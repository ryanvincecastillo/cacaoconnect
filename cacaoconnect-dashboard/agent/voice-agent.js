require('dotenv').config();

const { Worker, initializeLogger } = require('@livekit/agents');
const { Groq } = require('groq-sdk');
const { createClient } = require('@supabase/supabase-js');
const { WebSocket } = require('ws');

// Initialize LiveKit logger
initializeLogger({ pretty: true, level: 'info' });

// --- CONFIGURATION ---

const {
  LIVEKIT_URL,
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET,
  DEEPGRAM_API_KEY,
  GROQ_API_KEY,
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY
} = process.env;

// Initialize Groq for LLM processing
const groq = new Groq({ apiKey: GROQ_API_KEY });

// Initialize Supabase for data access
const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Farming-specific voice agent class
class CacaoVoiceAgent extends Worker {
  constructor(workerOptions) {
    super(workerOptions);
    this.conversationContext = new Map(); // Store conversation context per user
    this.initializeVoiceHandlers();
  }

  initializeVoiceHandlers() {
    this.on('participant_connected', (participant) => {
      console.log(`Farmer/Processor connected: ${participant.identity}`);
      this.greetUser(participant.identity);
    });

    this.on('data_received', async (data, participant) => {
      try {
        await this.processVoiceData(data, participant);
      } catch (error) {
        console.error('Error processing voice data:', error);
        this.sendErrorMessage(participant, "I'm having trouble understanding you. Please try again.");
      }
    });
  }

  async processVoiceData(data, participant) {
    const { audioData, userId } = data;

    // Step 1: Transcribe speech to text using Deepgram
    const transcription = await this.transcribeAudio(audioData);
    if (!transcription || transcription.trim().length === 0) {
      return; // No speech detected
    }

    console.log(`User said: "${transcription}"`);

    // Step 2: Parse command and get context
    const command = this.parseCommand(transcription);
    const context = this.getConversationContext(userId);

    // Step 3: Generate appropriate response
    const response = await this.generateFarmingResponse(command, context, userId);

    // Step 4: Update conversation context
    this.updateConversationContext(userId, {
      lastCommand: command,
      lastResponse: response,
      timestamp: Date.now()
    });

    // Step 5: Convert response to speech and send back
    const audioResponse = await this.synthesizeSpeech(response.text);
    this.sendAudioResponse(audioResponse, participant);

    // Step 6: Handle any action that needs to be taken
    if (response.action && response.data) {
      await this.executeAction(response.action, response.data, userId, participant);
    }
  }

  // Parse farming-specific commands
  parseCommand(text) {
    const lowerText = text.toLowerCase().trim();

    // Order commitment commands
    const commitMatch = lowerText.match(/commit\s+(\d+)\s*(?:kg|kilograms?)?\s+(?:to\s+)?order\s*(\w+)/i);
    if (commitMatch) {
      return {
        intent: 'commit_volume',
        entities: {
          volume: parseFloat(commitMatch[1]),
          orderId: commitMatch[2]
        }
      };
    }

    // Inventory check commands
    if (/check\s+(?:my\s+)?inventory|what\s+(?:do|i)\s+have|show\s+(?:my\s+)?stock/.test(lowerText)) {
      return { intent: 'check_inventory', entities: {} };
    }

    // Delivery status commands
    if (/check\s+(?:my\s+)?deliveries|pending\s+deliveries|delivery\s+status/.test(lowerText)) {
      return { intent: 'check_deliveries', entities: {} };
    }

    // Weather commands
    if (/weather\s+forecast|weather\s+update|rain\s+forecast/.test(lowerText)) {
      return { intent: 'weather_forecast', entities: {} };
    }

    // Market price commands
    if (/market\s+prices|cocoa\s+prices|current\s+prices/.test(lowerText)) {
      return { intent: 'market_prices', entities: {} };
    }

    // Quality assessment commands
    if (/quality\s+check|check\s+quality|grade\s+assessment/.test(lowerText)) {
      return { intent: 'quality_assessment', entities: {} };
    }

    // Pickup scheduling commands
    if (/schedule\s+pickup|arrange\s+pickup|pickup\s+date/.test(lowerText)) {
      return { intent: 'schedule_pickup', entities: {} };
    }

    // General query
    return { intent: 'general_query', entities: { query: text } };
  }

  // Generate farming-specific responses
  async generateFarmingResponse(command, context, userId) {
    const { intent, entities } = command;

    try {
      switch (intent) {
        case 'commit_volume':
          return await this.handleCommitVolume(entities, userId);

        case 'check_inventory':
          return await this.handleCheckInventory(userId);

        case 'check_deliveries':
          return await this.handleCheckDeliveries(userId);

        case 'weather_forecast':
          return await this.handleWeatherForecast(userId);

        case 'market_prices':
          return await this.handleMarketPrices(userId);

        case 'quality_assessment':
          return await this.handleQualityAssessment(entities, userId);

        case 'schedule_pickup':
          return await this.handleSchedulePickup(entities, userId);

        case 'general_query':
          return await this.handleGeneralQuery(entities.query, context, userId);

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

  // --- HANDLERS FOR SPECIFIC INTENTS ---

  async handleCommitVolume(entities, userId) {
    const { volume, orderId } = entities;

    try {
      // Find the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderId)
        .single();

      if (orderError || !order) {
        return {
          text: `I can't find order ${orderId}. Please check the order number and try again.`,
          action: null,
          data: null
        };
      }

      // Check if user already has a commitment
      const { data: existingCommitment } = await supabase
        .from('commitments')
        .select('*')
        .eq('order_id', order.id)
        .eq('user_id', userId)
        .single();

      if (existingCommitment) {
        return {
          text: `You already have a commitment of ${existingCommitment.committed_volume_kg}kg for order ${orderId}. Would you like to update it?`,
          action: 'update_commitment',
          data: { existingCommitment, newVolume: volume }
        };
      }

      // Create new commitment
      const { data: commitment, error: commitError } = await supabase
        .from('commitments')
        .insert({
          order_id: order.id,
          user_id: userId,
          committed_volume_kg: volume,
          status: 'pending'
        })
        .select()
        .single();

      if (commitError) throw commitError;

      return {
        text: `Great! I've committed ${volume} kilograms to order ${orderId}. Your commitment is now pending approval from the processor.`,
        action: 'commitment_created',
        data: { commitment, order }
      };

    } catch (error) {
      console.error('Commitment error:', error);
      return {
        text: "I'm having trouble processing your commitment. Please try again or contact support.",
        action: null,
        data: null
      };
    }
  }

  async handleCheckInventory(userId) {
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

  async handleCheckDeliveries(userId) {
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

  async handleWeatherForecast(userId) {
    // In a real implementation, you'd call a weather API
    // For now, providing a simulated response
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

  async handleMarketPrices(userId) {
    // In a real implementation, you'd call a market data API
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

  async handleQualityAssessment(entities, userId) {
    return {
      text: "For quality assessment, I'll help you evaluate your cocoa beans. Look for consistent brown color, no mold or foreign matter, and good chocolate aroma. The beans should be properly fermented with a moisture content between 6-8%. Would you like me to schedule a quality inspection with our experts?",
      action: 'quality_guidance',
      data: {
        qualityFactors: ['color', 'aroma', 'moisture', 'fermentation'],
        recommendations: ['Visual inspection', 'Aroma test', 'Moisture check']
      }
    };
  }

  async handleSchedulePickup(entities, userId) {
    return {
      text: "I can help you schedule a pickup for your processed cocoa. First, let me check which of your orders are ready for collection. Could you please tell me what date would work best for you, and do you prefer morning or afternoon pickup?",
      action: 'schedule_request',
      data: {
        requires: ['date', 'time_preference'],
        nextStep: 'check_ready_orders'
      }
    };
  }

  async handleGeneralQuery(query, context, userId) {
    try {
      const completion = await groq.chat.completions.create({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: `You are a helpful cocoa farming assistant for CacaoConnect.
            You help farmers with:
            - Managing their cocoa inventory and orders
            - Checking delivery status and market prices
            - Providing weather information for farming
            - Quality assessment guidance
            - General cocoa farming advice

            Be helpful, concise, and practical in your responses. Use simple language that farmers can understand.`
          },
          {
            role: "user",
            content: query
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      });

      const response = completion.choices[0]?.message?.content ||
        "I'm here to help with your cocoa farming needs. Feel free to ask me about orders, inventory, deliveries, or general farming questions.";

      return {
        text: response,
        action: 'general_response',
        data: null
      };

    } catch (error) {
      console.error('General query error:', error);
      return {
        text: "I'm your cocoa farming assistant. I can help you with orders, inventory, deliveries, weather, and market information. What would you like to know?",
        action: null,
        data: null
      };
    }
  }

  // --- UTILITY METHODS ---

  async transcribeAudio(audioData) {
    // This would integrate with Deepgram's STT API
    // For now, return a placeholder
    console.log('Transcribing audio data...');
    return audioData.toString(); // Placeholder - implement actual Deepgram integration
  }

  async synthesizeSpeech(text) {
    // This would integrate with Deepgram's TTS API
    // For now, return the text as-is (the client will handle TTS)
    return text;
  }

  greetUser(userId) {
    const greeting = "Hello! I'm your CacaoConnect voice assistant. I can help you with orders, inventory, deliveries, and farming advice. How can I assist you today?";
    console.log(`Greeting user: ${userId}`);
    // Send greeting to client
  }

  sendErrorMessage(participant, message) {
    console.log(`Error to ${participant.identity}: ${message}`);
    // Send error message to client
  }

  sendAudioResponse(audioResponse, participant) {
    console.log(`Sending response to ${participant.identity}`);
    // Send audio response to client
  }

  async executeAction(action, data, userId, participant) {
    console.log(`Executing action: ${action} for user: ${userId}`);

    // Handle specific actions that need additional processing
    switch (action) {
      case 'commitment_created':
        // Send notification to processor
        await this.notifyProcessor(data.order.processor_id, data.commitment);
        break;

      case 'schedule_request':
        // Initiate pickup scheduling flow
        await this.initiatePickupScheduling(userId, data);
        break;

      default:
        console.log(`No specific handler for action: ${action}`);
    }
  }

  async notifyProcessor(processorId, commitment) {
    // Send notification to processor about new commitment
    console.log(`Notifying processor ${processorId} about new commitment`);
  }

  async initiatePickupScheduling(userId, data) {
    // Start the pickup scheduling process
    console.log(`Initiating pickup scheduling for user ${userId}`);
  }

  getConversationContext(userId) {
    return this.conversationContext.get(userId) || {};
  }

  updateConversationContext(userId, newContext) {
    this.conversationContext.set(userId, newContext);

    // Clean up old contexts (older than 1 hour)
    const oneHour = 60 * 60 * 1000;
    this.conversationContext.forEach((context, id) => {
      if (Date.now() - context.timestamp > oneHour) {
        this.conversationContext.delete(id);
      }
    });
  }
}

// --- START THE VOICE AGENT ---

async function main() {
  console.log('Starting CacaoConnect Voice Agent...');

  try {
    const worker = new CacaoVoiceAgent({
      wsURL: LIVEKIT_URL,
      apiKey: LIVEKIT_API_KEY,
      apiSecret: LIVEKIT_API_SECRET,
      agentName: 'cacao-voice-assistant'
    });

    await worker.start();
    console.log('✅ CacaoConnect Voice Agent is running and ready to assist farmers!');

  } catch (error) {
    console.error('❌ Failed to start voice agent:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down voice agent...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Shutting down voice agent...');
  process.exit(0);
});

// Start the agent
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { CacaoVoiceAgent };