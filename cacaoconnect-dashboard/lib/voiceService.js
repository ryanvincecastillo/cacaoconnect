import { createClient } from '@supabase/supabase-js';
import { Deepgram } from '@deepgram/sdk';
import { Groq } from 'groq-sdk';

// --- CONFIGURATION ---

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Initialize Deepgram for Speech-to-Text
let deepgram = null;

// Initialize Deepgram only on server-side with proper error handling
try {
  if (typeof window === 'undefined' && process.env.DEEPGRAM_API_KEY) {
    deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);
    console.log('✅ Deepgram initialized successfully');
  }
} catch (error) {
  console.warn('⚠️ Deepgram initialization failed:', error.message);
  console.log('Falling back to browser Web Speech API for speech recognition');
}

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

  static async transcribeAudio(audioData, options = {}) {
    const {
      mimetype = 'audio/webm',
      language = 'en-US',
      model = 'nova-2'
    } = options;

    // Try Deepgram first if available
    if (deepgram) {
      try {
        console.log('Transcribing audio with Deepgram...');
        const response = await deepgram.listen.prerecorded({
          buffer: audioData,
          mimetype: mimetype
        }, {
          model: model,
          language: language,
          smart_format: true,
          punctuate: true,
          profanity_filter: false
        });

        const transcript = response.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
        console.log(`Deepgram transcription: "${transcript}"`);
        return transcript;
      } catch (error) {
        console.warn('Deepgram transcription failed:', error.message);
        return this.fallbackTranscription(audioData);
      }
    }

    // Fallback to browser Web Speech API if available
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      return this.browserTranscription(audioData);
    }

    throw new Error('No speech recognition available. Please set DEEPGRAM_API_KEY or use a supported browser.');
  }

  static async fallbackTranscription(audioData) {
    // Simple fallback - return empty transcription for now
    // In a real implementation, you could:
    // 1. Use a different STT service
    // 2. Store audio for manual transcription
    // 3. Use cached transcription if available
    console.warn('Using fallback transcription - this returns empty text');
    return '';
  }

  static async browserTranscription(audioData) {
    return new Promise((resolve, reject) => {
      if (!('webkitSpeechRecognition' in window)) {
        reject(new Error('Web Speech API not supported'));
        return;
      }

      const recognition = new webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      recognition.onerror = (event) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      recognition.start();
    });
  }

  // Real-time transcription for live audio streams
  static createRealtimeTranscriber(options = {}) {
    if (!deepgram) {
      throw new Error('Deepgram not available for real-time transcription');
    }

    const {
      language = 'en-US',
      model = 'nova-2',
      onTranscript = () => {},
      onError = () => {}
    } = options;

    return deepgram.listen.live({
      model: model,
      language: language,
      punctuate: true,
      smart_format: true
    })
    .on('transcriptReceived', (transcript) => {
      const result = transcript.channel?.alternatives?.[0]?.transcript;
      if (result) {
        onTranscript(result);
      }
    })
    .on('error', (error) => {
      console.error('Real-time transcription error:', error);
      onError(error);
    });
  }
}

// --- EMOTIONAL INTELLIGENCE UTILITIES (Enhanced) ---

export class EmotionalIntelligence {

  static detectEmotion(text) {
    const lowerText = text.toLowerCase();

    // Multi-dimensional emotion detection with scoring
    const emotionScores = {
      enthusiastic: 0,
      concerned: 0,
      neutral: 0,
      friendly: 0
    };

    // Positive emotion indicators
    const enthusiasticWords = ['great', 'excellent', 'wonderful', 'fantastic', 'amazing', 'successful', 'approved', 'perfect', 'outstanding'];
    const enthusiasticEmphasis = /\!\!|\*\*.*?\*\*|congratulations|bravo/;

    // Concern/Warning indicators
    const concernedWords = ['error', 'problem', 'failed', 'unable', 'apologize', 'sorry', 'unfortunately', 'issue', 'trouble', 'difficult'];
    const concernedEmphasis = /\b(?:immediately|urgent|important|critical|warning)\b/;

    // Neutral/Information indicators
    const neutralWords = ['currently', 'status', 'report', 'information', 'kilograms', 'inventory', 'data', 'details', 'statistics'];

    // Helpful/Friendly indicators
    const friendlyWords = ['help', 'assist', 'support', 'guide', 'please', 'thank you', 'welcome', 'happy to', 'glad to'];

    // Score emotions based on word presence
    enthusiasticWords.forEach(word => {
      if (lowerText.includes(word)) emotionScores.enthusiastic += 2;
    });

    concernedWords.forEach(word => {
      if (lowerText.includes(word)) emotionScores.concerned += 2;
    });

    neutralWords.forEach(word => {
      if (lowerText.includes(word)) emotionScores.neutral += 1;
    });

    friendlyWords.forEach(word => {
      if (lowerText.includes(word)) emotionScores.friendly += 1;
    });

    // Bonus points for emphasis patterns
    if (enthusiasticEmphasis.test(text)) emotionScores.enthusiastic += 3;
    if (concernedEmphasis.test(text)) emotionScores.concerned += 3;

    // Default to friendly if no strong signals
    if (Object.values(emotionScores).every(score => score === 0)) {
      emotionScores.friendly = 1;
    }

    // Return emotion with highest score
    return Object.keys(emotionScores).reduce((a, b) =>
      emotionScores[a] > emotionScores[b] ? a : b
    );
  }
  
  static enhanceTextWithEmotion(text, emotion) {
    const emotionPrefixes = {
      enthusiastic: ['Great news!', 'Excellent!', 'Wonderful!', 'Fantastic!'],
      concerned: ['I understand your concern.', 'Let me help you with that.', 'I apologize for the inconvenience.'],
      neutral: ['Here\'s the information you requested.', 'Let me provide you with an update.'],
      friendly: ['I\'d be happy to help you with that.', 'Certainly!', 'Of course!']
    };
    
    const emotionSuffixes = {
      enthusiastic: [' Is there anything else I can help you with?', ' Feel free to ask if you need anything else!'],
      concerned: [' Please let me know if you need further assistance.', ' I\'m here to help resolve any issues.'],
      neutral: [' Let me know if you need more details.', ' Is there anything specific you\'d like to know?'],
      friendly: [' How else can I assist you today?', ' I\'m here whenever you need me!']
    };
    
    const prefixes = emotionPrefixes[emotion] || emotionPrefixes.friendly;
    const suffixes = emotionSuffixes[emotion] || emotionSuffixes.friendly;
    
    // Randomly select prefix and suffix for variety
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    // Add emotion-specific interjections
    const interjections = {
      enthusiastic: ['Oh, ', 'Wow, ', 'Excellent! '],
      concerned: ['Hmm, ', 'Well, ', 'I see. '],
      neutral: ['', '', ''],
      friendly: ['', '', '']
    };
    
    const interjection = interjections[emotion][Math.floor(Math.random() * interjections[emotion].length)];
    
    return `${prefix} ${interjection}${text}${suffix}`;
  }
}

// --- TEXT-TO-SPEECH UTILITIES (Enhanced with Humanization) ---

export class TextToSpeechService {

  // Get voice configuration from environment variables
  static getVoiceConfig() {
    return {
      voice: process.env.ASSISTANT_VOICE || 'en-US-Ava',
      rate: parseFloat(process.env.ASSISTANT_VOICE_RATE) || 1.0,
      pitch: parseFloat(process.env.ASSISTANT_VOICE_PITCH) || 1.0,
      volume: parseFloat(process.env.ASSISTANT_VOICE_VOLUME) || 1.0,
      emotion: process.env.ASSISTANT_VOICE_EMOTION || 'friendly',
      stability: parseFloat(process.env.ASSISTANT_VOICE_STABILITY) || 0.8,
      similarity_boost: parseFloat(process.env.ASSISTANT_VOICE_SIMILARITY_BOOST) || 0.8,
      pause_duration: parseInt(process.env.ASSISTANT_VOICE_PAUSE_DURATION) || 500,
      breathing_enabled: process.env.ASSISTANT_VOICE_BREATHING_ENABLED === 'true'
    };
  }

  static async synthesizeSpeech(text, options = {}) {
    const config = this.getVoiceConfig();
    const {
      voice = config.voice,
      rate = config.rate,
      pitch = config.pitch,
      volume = config.volume,
      emotion = config.emotion
    } = options;

    // Detect and enhance emotion
    const detectedEmotion = EmotionalIntelligence.detectEmotion(text);
    const enhancedText = this.addNaturalHumanization(text, detectedEmotion);

    // Apply dynamic prosody control
    const prosodySettings = this.calculateProsodySettings(enhancedText, detectedEmotion, { rate, pitch, volume });

    // Use browser's built-in speech synthesis as fallback
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return new Promise((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(enhancedText);
        utterance.rate = prosodySettings.rate;
        utterance.pitch = prosodySettings.pitch;
        utterance.volume = prosodySettings.volume;

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
  
  // Add natural humanization features to speech
  static addNaturalHumanization(text, emotion) {
    const config = this.getVoiceConfig();
    let enhancedText = text;

    // Add breathing sounds for longer sentences
    if (config.breathing_enabled && text.length > 100) {
      enhancedText = this.insertBreathingPauses(enhancedText);
    }

    // Add natural speech patterns
    enhancedText = this.addNaturalSpeechPatterns(enhancedText, emotion);

    // Add emphasis for important information
    enhancedText = this.addStrategicEmphasis(enhancedText);

    return enhancedText;
  }

  // Insert breathing pauses for natural speech
  static insertBreathingPauses(text) {
    // Insert pauses after commas and periods for natural breathing
    return text
      .replace(/,/g, ', *')
      .replace(/\./g, '. *')
      .replace(/\?/g, '? *')
      .replace(/!/g, '! *')
      .replace(/\* \*/g, '*'); // Clean up double pauses
  }

  // Add natural speech patterns and hesitations
  static addNaturalSpeechPatterns(text, emotion) {
    const patterns = {
      enthusiastic: {
        starters: ['Well! ', 'Oh, that\'s great! ', 'Excellent! '],
        fillers: [' you know, ', ' actually, ', ' honestly, '],
        connectors: [' So, ', ' And, ', ' You know, ']
      },
      concerned: {
        starters: ['Hmm, ', 'Let me think about this... ', 'Well, '],
        fillers: [' I mean, ', ' you see, ', ' basically, '],
        connectors: [' However, ', ' But, ', ' On the other hand, ']
      },
      neutral: {
        starters: ['Alright, ', 'Okay, ', 'Right, '],
        fillers: [' essentially, ', ' basically, ', ' in fact, '],
        connectors: [' So, ', ' And, ', ' Also, ']
      },
      friendly: {
        starters: ['Sure! ', 'Of course! ', 'I\'d be happy to help! '],
        fillers: [' by the way, ', ' just so you know, ', ' actually, '],
        connectors: [' And, ', ' So, ', ' Also, ']
      }
    };

    const emotionPattern = patterns[emotion] || patterns.friendly;
    let result = text;

    // Occasionally add natural starters (20% chance)
    if (Math.random() < 0.2) {
      const starter = emotionPattern.starters[Math.floor(Math.random() * emotionPattern.starters.length)];
      result = starter + result.charAt(0).toLowerCase() + result.slice(1);
    }

    // Add occasional fillers for longer sentences (15% chance)
    if (result.length > 50 && Math.random() < 0.15) {
      const filler = emotionPattern.fillers[Math.floor(Math.random() * emotionPattern.fillers.length)];
      const middle = Math.floor(result.length / 2);
      result = result.slice(0, middle) + filler + result.slice(middle);
    }

    return result;
  }

  // Add strategic emphasis for important information
  static addStrategicEmphasis(text) {
    // Emphasize numbers, important keywords, and action items
    return text
      // Emphasize quantities
      .replace(/(\d+)\s*(kg|kilograms?|tons?|percent|%|degrees?)/gi, '**$1 $2**')
      // Emphasize important action words
      .replace(/\b(immediately|urgent|important|critical|required|must|please)/gi, '**$1**')
      // Emphasize grade letters
      .replace(/\b(grade [ABC])\b/gi, '**$1**')
      // Emphasize currency values
      .replace(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g, '**$$$1**');
  }

  // Calculate prosody settings based on content analysis
  static calculateProsodySettings(text, emotion, baseSettings) {
    const config = this.getVoiceConfig();
    let settings = { ...baseSettings };

    // Analyze text characteristics
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const avgWordsPerSentence = words / Math.max(sentences, 1);
    const hasNumbers = /\d/.test(text);
    const hasEmphasis = /\*\*.*?\*\*/.test(text);

    // Adjust rate based on content complexity
    if (avgWordsPerSentence > 15 || hasNumbers) {
      // Slow down for complex sentences or numbers
      settings.rate *= 0.85;
    } else if (avgWordsPerSentence < 8) {
      // Speed up slightly for short, simple sentences
      settings.rate *= 1.1;
    }

    // Adjust pitch for emphasized content
    if (hasEmphasis) {
      settings.pitch *= 1.05;
    }

    // Apply emotion-based adjustments
    const emotionAdjustments = {
      enthusiastic: { rate: 1.05, pitch: 1.15, volume: 1.1 },
      concerned: { rate: 0.9, pitch: 0.95, volume: 0.95 },
      neutral: { rate: 1.0, pitch: 1.0, volume: 1.0 },
      friendly: { rate: 0.98, pitch: 1.02, volume: 1.0 }
    };

    const emotionAdjustment = emotionAdjustments[emotion] || emotionAdjustments.friendly;
    settings.rate *= emotionAdjustment.rate;
    settings.pitch *= emotionAdjustment.pitch;
    settings.volume *= emotionAdjustment.volume;

    // Apply environment variable overrides
    settings.rate = Math.max(0.5, Math.min(2.0, settings.rate * config.rate));
    settings.pitch = Math.max(0.5, Math.min(2.0, settings.pitch * config.pitch));
    settings.volume = Math.max(0.1, Math.min(1.0, settings.volume * config.volume));

    return settings;
  }

  // Advanced TTS with Deepgram Aura (if available)
  static async synthesizeSpeechWithDeepgram(text, options = {}) {
    const config = this.getVoiceConfig();

    // Map standard voice names to Deepgram Aura models
    const voiceModelMap = {
      'en-US-Ava': 'aura-asteria-en',
      'aura-luna-en': 'aura-luna-en',
      'aura-stella-en': 'aura-stella-en',
      'aura-asteria-en': 'aura-asteria-en'
    };

    const {
      voice = config.voice,
      emotion = config.emotion
    } = options;

    const model = voiceModelMap[voice] || 'aura-asteria-en';

    // Detect and enhance emotion
    const detectedEmotion = EmotionalIntelligence.detectEmotion(text);
    const enhancedText = this.addNaturalHumanization(text, detectedEmotion);

    // Calculate prosody settings
    const prosodySettings = this.calculateProsodySettings(text, detectedEmotion, config);

    if (!process.env.DEEPGRAM_API_KEY) {
      console.warn('DEEPGRAM_API_KEY not set, falling back to browser TTS');
      return this.synthesizeSpeech(text, options);
    }

    try {
      console.log(`Synthesizing with Deepgram Aura: model=${model}, emotion=${detectedEmotion}`);

      const response = await fetch('https://api.deepgram.com/v1/speak?model=' + model, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: enhancedText,
          // Optional: Add voice settings for more control
          ...(process.env.NODE_ENV === 'development' && {
            voice_settings: {
              stability: config.stability,
              similarity_boost: config.similarity_boost,
              style: detectedEmotion
            }
          })
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Deepgram API error: ${response.status} ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      console.log(`Deepgram TTS successful: ${audioBuffer.byteLength} bytes`);
      return audioBuffer;

    } catch (error) {
      console.error('Deepgram TTS Error:', error);
      // Fallback to browser TTS with enhanced settings
      return this.synthesizeSpeech(text, {
        ...options,
        rate: prosodySettings.rate,
        pitch: prosodySettings.pitch,
        volume: prosodySettings.volume
      });
    }
  }
}

export default VoiceService;
