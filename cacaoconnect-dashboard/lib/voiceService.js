import { createClient } from '@supabase/supabase-js';
import { Deepgram } from '@deepgram/sdk';
import { Groq } from 'groq-sdk';

// --- CONFIGURATION ---

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Initialize Deepgram for Speech-to-Text
let deepgram = null;
// Temporarily disabled to fix build issues
// if (typeof window === 'undefined' && process.env.DEEPGRAM_API_KEY) {
//   deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);
// }

// Initialize Groq for LLM processing
let groq = null;
if (typeof window === 'undefined' && process.env.GROQ_API_KEY) {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

// --- FARMING-SPECIFIC VOICE COMMANDS ---

export const FARMING_COMMANDS = {
  // Order Management
  COMMIT_TO_ORDER: {
    patterns: [/commit\s+(\d+)\s*(?:kg|kilograms?)?\s+(?:to\s+)?order\s+(\w+)/i, /commit\s+(\d+)\s*(?:kg|kilograms?)?\s+(?:to\s+)?(\w+)/i],
    action: 'commit_volume',
    description: 'Commit specific volume to an order'
  },

  // Inventory Queries
  CHECK_INVENTORY: {
    patterns: [/check\s+(?:my\s+)?inventory/i, /what\s+(?:do|i)\s+have/i, /show\s+(?:my\s+)?stock/i],
    action: 'check_inventory',
    description: 'Check current inventory status'
  },

  // Delivery Status
  CHECK_DELIVERIES: {
    patterns: [/check\s+(?:my\s+)?deliveries/i, /pending\s+deliveries/i, /delivery\s+status/i],
    action: 'check_deliveries',
    description: 'Check status of pending deliveries'
  },

  // Weather Information
  WEATHER_FORECAST: {
    patterns: [/weather\s+forecast/i, /weather\s+update/i, /rain\s+forecast/i],
    action: 'weather_forecast',
    description: 'Get weather information for farming'
  },

  // Market Information
  MARKET_PRICES: {
    patterns: [/market\s+prices/i, /cocoa\s+prices/i, /current\s+prices/i],
    action: 'market_prices',
    description: 'Get current market price information'
  },

  // Quality Assessment
  QUALITY_CHECK: {
    patterns: [/quality\s+check/i, /check\s+quality/i, /grade\s+assessment/i],
    action: 'quality_assessment',
    description: 'Assess cocoa quality'
  },

  // Pickup Scheduling
  SCHEDULE_PICKUP: {
    patterns: [/schedule\s+pickup/i, /arrange\s+pickup/i, /pickup\s+date/i],
    action: 'schedule_pickup',
    description: 'Schedule a pickup for processed cocoa'
  }
};

// --- VOICE SERVICE UTILITIES ---

export class VoiceService {

  // Parse voice command and extract intent
  static parseCommand(text) {
    const lowerText = text.toLowerCase().trim();

    for (const [commandName, command] of Object.entries(FARMING_COMMANDS)) {
      for (const pattern of command.patterns) {
        const match = lowerText.match(pattern);
        if (match) {
          return {
            command: commandName,
            action: command.action,
            parameters: match.slice(1), // Extract captured groups
            confidence: this.calculateConfidence(lowerText, command.patterns)
          };
        }
      }
    }

    return {
      command: 'GENERAL_QUERY',
      action: 'general_query',
      parameters: [text],
      confidence: 0.5
    };
  }

  // Calculate confidence score for command matching
  static calculateConfidence(text, patterns) {
    let bestScore = 0;

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        // Simple confidence calculation based on match length
        const score = match[0].length / text.length;
        bestScore = Math.max(bestScore, score);
      }
    }

    return Math.min(bestScore, 1.0);
  }

  // Generate farming-specific response based on command
  static async generateResponse(command, userContext = {}) {
    const { action, parameters } = command;

    try {
      switch (action) {
        case 'commit_volume':
          return await this.handleCommitVolume(parameters, userContext);

        case 'check_inventory':
          return await this.handleCheckInventory(userContext);

        case 'check_deliveries':
          return await this.handleCheckDeliveries(userContext);

        case 'weather_forecast':
          return await this.handleWeatherForecast(userContext);

        case 'market_prices':
          return await this.handleMarketPrices(userContext);

        case 'quality_assessment':
          return await this.handleQualityAssessment(parameters, userContext);

        case 'schedule_pickup':
          return await this.handleSchedulePickup(parameters, userContext);

        default:
          return await this.handleGeneralQuery(parameters[0], userContext);
      }
    } catch (error) {
      console.error('Voice service error:', error);
      return {
        text: "I apologize, I'm having trouble processing that request. Please try again.",
        action: null,
        data: null
      };
    }
  }

  // --- COMMAND HANDLERS ---

  static async handleCommitVolume(parameters, userContext) {
    const [volume, orderId] = parameters;

    if (!volume || !orderId) {
      return {
        text: "I need both the volume and order number to commit. For example: 'Commit 50kg to order 123'.",
        action: 'request_clarification',
        data: { required: ['volume', 'order_id'] }
      };
    }

    // Here you would integrate with the existing order commitment system
    return {
      text: `I can help you commit ${volume} kilograms to order ${orderId}. Please confirm this commitment.`,
      action: 'confirm_commitment',
      data: { volume: parseFloat(volume), order_id: orderId }
    };
  }

  static async handleCheckInventory(userContext) {
    try {
      // Query inventory from Supabase
      const { data: inventory, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', userContext.userId);

      if (error) throw error;

      const totalVolume = inventory?.reduce((sum, item) => sum + (item.volume_kg || 0), 0) || 0;
      const gradeBreakdown = inventory?.reduce((grades, item) => {
        grades[item.grade] = (grades[item.grade] || 0) + (item.volume_kg || 0);
        return grades;
      }, {}) || {};

      let response = `You currently have ${totalVolume} kilograms of cocoa in inventory.`;

      if (Object.keys(gradeBreakdown).length > 0) {
        response += ' Breakdown by grade: ';
        Object.entries(gradeBreakdown).forEach(([grade, volume]) => {
          response += `${grade}: ${volume}kg. `;
        });
      }

      return {
        text: response,
        action: 'inventory_report',
        data: { totalVolume, gradeBreakdown }
      };

    } catch (error) {
      return {
        text: "I'm having trouble accessing your inventory information right now.",
        action: null,
        data: null
      };
    }
  }

  static async handleCheckDeliveries(userContext) {
    try {
      const { data: deliveries, error } = await supabase
        .from('commitments')
        .select(`
          *,
          orders:order_id (order_number, status)
        `)
        .eq('user_id', userContext.userId)
        .in('status', ['ready', 'collected', 'in_transit']);

      if (error) throw error;

      if (!deliveries || deliveries.length === 0) {
        return {
          text: "You don't have any pending deliveries at the moment.",
          action: 'delivery_report',
          data: { deliveries: [] }
        };
      }

      const pendingCount = deliveries.filter(d => d.status === 'ready').length;
      const inTransitCount = deliveries.filter(d => d.status === 'collected' || d.status === 'in_transit').length;

      let response = `You have ${pendingCount} deliveries ready for pickup`;
      if (inTransitCount > 0) {
        response += ` and ${inTransitCount} deliveries currently in transit.`;
      } else {
        response += '.';
      }

      return {
        text: response,
        action: 'delivery_report',
        data: { deliveries, pendingCount, inTransitCount }
      };

    } catch (error) {
      return {
        text: "I'm unable to check your delivery status right now.",
        action: null,
        data: null
      };
    }
  }

  static async handleWeatherForecast(userContext) {
    // This would integrate with a weather API
    return {
      text: "The weather looks favorable for cocoa farming this week. Expect moderate rainfall and temperatures between 22-28°C. Good conditions for harvesting and drying.",
      action: 'weather_report',
      data: { forecast: 'favorable', temp: '22-28°C', rainfall: 'moderate' }
    };
  }

  static async handleMarketPrices(userContext) {
    // This would integrate with a market data API
    return {
      text: "Current cocoa market prices are trending upward. Grade A cocoa is fetching approximately $3,200 per ton, Grade B at $2,700, and Grade C at $2,200. It's a good time to sell quality beans.",
      action: 'market_report',
      data: {
        gradeA: 3200,
        gradeB: 2700,
        gradeC: 2200,
        trend: 'upward'
      }
    };
  }

  static async handleQualityAssessment(parameters, userContext) {
    return {
      text: "For quality assessment, I'll need to examine your cocoa beans. Please ensure they are properly fermented and dried. Look for consistent brown color, no mold, and good aroma. Would you like me to schedule a quality inspection?",
      action: 'quality_guidance',
      data: { nextSteps: ['visual_inspection', 'aroma_test', 'moisture_check'] }
    };
  }

  static async handleSchedulePickup(parameters, userContext) {
    return {
      text: "I can help schedule a pickup for your processed cocoa. What date would work best for you, and do you have any specific time preferences?",
      action: 'schedule_request',
      data: { requires: ['date', 'time_preference'] }
    };
  }

  static async handleGeneralQuery(query, userContext) {
    try {
      // Use existing OpenAI integration for general queries
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `As a cocoa farming assistant, please answer this question from a farmer: ${query}` }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          text: data.response || data.message || "I'm here to help with your cocoa farming needs.",
          action: 'general_response',
          data: data
        };
      }
    } catch (error) {
      console.error('General query error:', error);
    }

    return {
      text: "I'm your cocoa farming assistant. I can help you with inventory, orders, deliveries, weather, and market information. What would you like to know?",
      action: 'help_response',
      data: null
    };
  }
}

// --- SPEECH-TO-TEXT UTILITIES ---

export class SpeechToTextService {

  static async transcribeAudio(audioData) {
    if (!deepgram) {
      throw new Error('Deepgram not initialized. Check DEEPGRAM_API_KEY.');
    }

    try {
      const response = await deepgram.listen.prerecorded({
        buffer: audioData,
        mimetype: 'audio/webm' // Adjust based on your audio format
      }, {
        model: 'nova-2',
        language: 'en-US',
        smart_format: true
      });

      return response.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    } catch (error) {
      console.error('STT Error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }
}

// --- TEXT-TO-SPEECH UTILITIES (Enhanced) ---

export class TextToSpeechService {

  static async synthesizeSpeech(text, options = {}) {
    const {
      voice = process.env.ASSISTANT_VOICE || 'en-US-Ava',
      rate = 0.9,
      pitch = 1,
      volume = 1
    } = options;

    // Use browser's built-in speech synthesis as fallback
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return new Promise((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        const voices = speechSynthesis.getVoices();
        const selectedVoice = voices.find(v => v.name.includes(voice.split('-')[1])) ||
                             voices.find(v => v.lang.startsWith('en')) ||
                             voices[0];

        if (selectedVoice) utterance.voice = selectedVoice;

        utterance.onend = () => resolve();
        utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));

        speechSynthesis.speak(utterance);
      });
    }

    // For server-side, you would integrate with Deepgram's TTS API here
    throw new Error('Speech synthesis not available in this environment');
  }
}

export default VoiceService;
