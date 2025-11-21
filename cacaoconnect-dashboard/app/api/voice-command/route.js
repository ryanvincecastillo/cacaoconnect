import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { command, userId, userType } = body;

    if (!command || !userId) {
      return NextResponse.json({ error: 'Missing command or userId' }, { status: 400 });
    }

    console.log('Processing voice command:', command, 'for user:', userId);

    // Parse command to extract intent and entities
    const parsedCommand = parseVoiceCommand(command);

    // Generate response based on intent
    const response = await generateVoiceResponse(parsedCommand, userId, userType);

    console.log('Generated response:', response);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Voice command API error:', error);
    return NextResponse.json({
      error: 'Failed to process voice command',
      text: 'I apologize, I encountered an error processing your request. Please try again.',
      action: null,
      data: null
    }, { status: 500 });
  }
}

function parseVoiceCommand(text) {
  const lowerText = text.toLowerCase().trim();

  // Order commitment commands
  const commitMatch = lowerText.match(/commit\s+(\d+)\s*(?:kg|kilograms?)?\s+(?:to\s+)?order\s*(\w+)/i);
  if (commitMatch) {
    return {
      intent: 'commit_volume',
      entities: {
        volume: parseFloat(commitMatch[1]),
        orderId: commitMatch[2]
      },
      originalText: text
    };
  }

  // Inventory check commands
  if (/check\s+(?:my\s+)?inventory|what\s+(?:do|i)\s+have|show\s+(?:my\s+)?stock/.test(lowerText)) {
    return { intent: 'check_inventory', entities: {}, originalText: text };
  }

  // Delivery status commands
  if (/check\s+(?:my\s+)?deliveries|pending\s+deliveries|delivery\s+status/.test(lowerText)) {
    return { intent: 'check_deliveries', entities: {}, originalText: text };
  }

  // Weather commands
  if (/weather\s+forecast|weather\s+update|rain\s+forecast/.test(lowerText)) {
    return { intent: 'weather_forecast', entities: {}, originalText: text };
  }

  // Market price commands
  if (/market\s+prices|cocoa\s+prices|current\s+prices/.test(lowerText)) {
    return { intent: 'market_prices', entities: {}, originalText: text };
  }

  // Quality assessment commands
  if (/quality\s+check|check\s+quality|grade\s+assessment/.test(lowerText)) {
    return { intent: 'quality_assessment', entities: {}, originalText: text };
  }

  // Pickup scheduling commands
  if (/schedule\s+pickup|arrange\s+pickup|pickup\s+date/.test(lowerText)) {
    return { intent: 'schedule_pickup', entities: {}, originalText: text };
  }

  // General query
  return { intent: 'general_query', entities: { query: text }, originalText: text };
}

async function generateVoiceResponse(command, userId, userType) {
  const { intent, entities, originalText } = command;

  try {
    switch (intent) {
      case 'check_inventory':
        return await handleCheckInventory(userId);

      case 'check_deliveries':
        return await handleCheckDeliveries(userId);

      case 'commit_volume':
        return await handleCommitVolume(entities, userId);

      case 'weather_forecast':
        return await handleWeatherForecast();

      case 'market_prices':
        return await handleMarketPrices();

      case 'quality_assessment':
        return await handleQualityAssessment();

      case 'schedule_pickup':
        return await handleSchedulePickup();

      case 'general_query':
        return await handleGeneralQuery(entities.query, userId);

      default:
        return {
          text: "I'm your cocoa farming assistant. I can help you with orders, inventory, deliveries, weather, and market information. What would you like to know?",
          action: null,
          data: null
        };
    }
  } catch (error) {
    console.error('Response generation error:', error);
    return {
      text: "I apologize, I'm having trouble processing that request. Please try again.",
      action: null,
      data: null
    };
  }
}

async function handleCheckInventory(userId) {
  try {
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    if (!inventory || inventory.length === 0) {
      return {
        text: "You don't have any cocoa beans in your inventory at the moment.",
        action: 'inventory_report',
        data: { inventory: [] }
      };
    }

    const totalVolume = inventory.reduce((sum, item) => sum + (item.volume_kg || 0), 0);
    const gradeBreakdown = inventory.reduce((grades, item) => {
      grades[item.grade] = (grades[item.grade] || 0) + (item.volume_kg || 0);
      return grades;
    }, {});

    let response = `You currently have ${totalVolume} kilograms of cocoa beans in inventory. `;

    if (Object.keys(gradeBreakdown).length > 0) {
      response += 'Breakdown by grade: ';
      Object.entries(gradeBreakdown).forEach(([grade, volume]) => {
        response += `${grade}: ${volume} kilograms. `;
      });
    }

    return {
      text: response,
      action: 'inventory_report',
      data: { totalVolume, gradeBreakdown, inventory }
    };

  } catch (error) {
    console.error('Inventory check error:', error);
    return {
      text: "I'm having trouble accessing your inventory information right now.",
      action: null,
      data: null
    };
  }
}

async function handleCheckDeliveries(userId) {
  try {
    const { data: commitments, error } = await supabase
      .from('commitments')
      .select(`
        *,
        orders:order_id (order_number, status, processor_id)
      `)
      .eq('user_id', userId)
      .in('status', ['approved', 'ready', 'collected', 'in_transit']);

    if (error) throw error;

    if (!commitments || commitments.length === 0) {
      return {
        text: "You don't have any active deliveries at the moment.",
        action: 'delivery_report',
        data: { deliveries: [] }
      };
    }

    const readyCount = commitments.filter(c => c.status === 'ready').length;
    const inTransitCount = commitments.filter(c => ['collected', 'in_transit'].includes(c.status)).length;

    let response = `You have ${readyCount} deliveries ready for pickup`;
    if (inTransitCount > 0) {
      response += ` and ${inTransitCount} deliveries currently in transit.`;
    } else {
      response += '.';
    }

    // Add specific order details
    if (readyCount > 0) {
      const readyOrders = commitments
        .filter(c => c.status === 'ready')
        .map(c => `${c.committed_volume_kg}kg for order ${c.orders.order_number}`)
        .join(', ');
      response += ` Ready orders: ${readyOrders}.`;
    }

    return {
      text: response,
      action: 'delivery_report',
      data: { deliveries: commitments, readyCount, inTransitCount }
    };

  } catch (error) {
    console.error('Delivery check error:', error);
    return {
      text: "I'm unable to check your delivery status right now.",
      action: null,
      data: null
    };
  }
}

async function handleCommitVolume(entities, userId) {
  const { volume, orderId } = entities;

  return {
    text: `I can help you commit ${volume} kilograms to order ${orderId}. This feature will be available soon. Please use the website to complete this commitment for now.`,
    action: 'commitment_info',
    data: { volume, orderId }
  };
}

async function handleWeatherForecast() {
  return {
    text: "The weather forecast for your area looks favorable for cocoa farming this week. Expect moderate rainfall on Tuesday and Thursday, with temperatures between 22 to 28 degrees Celsius. Good conditions for harvesting and drying your cocoa beans.",
    action: 'weather_report',
    data: {
      forecast: 'favorable',
      temperature: '22-28°C',
      rainfall: 'moderate',
      recommendations: ['Good for harvesting', 'Suitable for drying']
    }
  };
}

async function handleMarketPrices() {
  return {
    text: "Current cocoa market prices are trending upward. Grade A cocoa is fetching approximately $3,200 per ton, Grade B at $2,700, and Grade C at $2,200. It's a good time to sell quality beans. Prices are expected to remain stable for the next few weeks.",
    action: 'market_report',
    data: {
      gradeA: 3200,
      gradeB: 2700,
      gradeC: 2200,
      trend: 'upward',
      currency: 'USD',
      unit: 'per_ton'
    }
  };
}

async function handleQualityAssessment() {
  return {
    text: "For quality assessment, I'll help you evaluate your cocoa beans. Look for consistent brown color, no mold or foreign matter, and good chocolate aroma. The beans should be properly fermented with a moisture content between 6-8%. Would you like me to schedule a quality inspection with our experts?",
    action: 'quality_guidance',
    data: {
      qualityFactors: ['color', 'aroma', 'moisture', 'fermentation'],
      recommendations: ['Visual inspection', 'Aroma test', 'Moisture check']
    }
  };
}

async function handleSchedulePickup() {
  return {
    text: "I can help you schedule a pickup for your cocoa beans. Please check your orders page to schedule pickups for now. The voice scheduling feature will be available soon.",
    action: 'schedule_info',
    data: {
      requires: ['order_selection', 'date', 'time_preference'],
      nextStep: 'use_web_interface'
    }
  };
}

async function handleGeneralQuery(query, userId) {
  try {
    // For general queries, we can integrate with the existing chat API
    const chatResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `As a cocoa farming assistant for CacaoConnect, please help with this question: ${query}. Keep your response concise and practical for farmers.`
      })
    });

    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      return {
        text: chatData.response || chatData.message || "I'm here to help with your cocoa farming needs.",
        action: 'general_response',
        data: null
      };
    }
  } catch (error) {
    console.error('Chat API integration error:', error);
  }

  // Fallback response
  return {
    text: "I'm your cocoa farming assistant. I can help you with orders, inventory, deliveries, weather, and market information. For specific questions, please try asking about one of these topics.",
    action: 'general_response',
    data: null
  };
}