require('dotenv').config();

const { Worker, initializeLogger } = require('@livekit/agents');
const { Groq } = require('groq-sdk');
const { createClient } = require('@supabase/supabase-js');
const { WebSocket } = require('ws');
const { AudioBufferUtils, AudioProcessor } = require('../lib/audioUtils');
const DatabaseContextService = require('../lib/databaseContext');

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
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ASSISTANT_VOICE,
  ASSISTANT_VOICE_RATE,
  ASSISTANT_VOICE_PITCH
} = process.env;

// Initialize Groq for LLM processing
const groq = new Groq({ apiKey: GROQ_API_KEY });

// Initialize Supabase for data access
const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Audio processing configuration
const AUDIO_CONFIG = {
  sampleRate: 16000,
  channels: 1,
  frameSize: 1024,
  maxAudioBuffer: 10 * 1024 * 1024 // 10MB
};

// Farming-specific voice agent class
class CacaoVoiceAgent extends Worker {
  constructor(workerOptions) {
    super(workerOptions);
    this.conversationContext = new Map(); // Store conversation context per user
    this.initializeVoiceHandlers();
  }

  initializeVoiceHandlers() {
    this.audioBuffer = [];
    this.isProcessing = false;
    this.participantAudioStreams = new Map();

    this.on('participant_connected', (participant) => {
      console.log(`Farmer/Processor connected: ${participant.identity}`);
      this.setupParticipantAudioStream(participant);
      this.greetUser(participant.identity);
    });

    this.on('participant_disconnected', (participant) => {
      console.log(`Farmer/Processor disconnected: ${participant.identity}`);
      this.cleanupParticipantAudioStream(participant);
    });

    this.on('track_subscribed', (track, publication, participant) => {
      console.log(`Track subscribed: ${track.kind} from ${participant.identity}`);

      if (track.kind === 'audio') {
        this.handleAudioTrack(track, participant);
      }
    });

    this.on('track_unsubscribed', (track, publication, participant) => {
      console.log(`Track unsubscribed: ${track.kind} from ${participant.identity}`);

      if (track.kind === 'audio') {
        this.cleanupAudioTrack(track, participant);
      }
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

  setupParticipantAudioStream(participant) {
    this.participantAudioStreams.set(participant.identity, {
      buffer: [],
      isActive: true,
      lastActivity: Date.now()
    });
  }

  cleanupParticipantAudioStream(participant) {
    this.participantAudioStreams.delete(participant.identity);
  }

  handleAudioTrack(track, participant) {
    const participantStream = this.participantAudioStreams.get(participant.identity);
    if (!participantStream) {
      console.warn(`No stream found for participant: ${participant.identity}`);
      return;
    }

    track.on('frameReceived', (frame) => {
      if (participantStream.isActive) {
        this.processAudioFrame(frame, participant);
      }
    });
  }

  cleanupAudioTrack(track, participant) {
    const participantStream = this.participantAudioStreams.get(participant.identity);
    if (participantStream) {
      participantStream.isActive = false;
    }
  }

  async processAudioFrame(frame, participant) {
    try {
      // Convert LiveKit audio frame to processable format
      const audioData = this.convertFrameToAudioData(frame);

      if (!audioData || audioData.length === 0) return;

      // Apply audio processing
      const processedAudio = this.preprocessAudio(audioData);

      // Add to participant's audio buffer
      const participantStream = this.participantAudioStreams.get(participant.identity);
      if (participantStream) {
        participantStream.buffer.push(processedAudio);
        participantStream.lastActivity = Date.now();

        // Limit buffer size to prevent memory issues
        if (participantStream.buffer.length > 1000) {
          participantStream.buffer.shift();
        }
      }

      // If buffer has enough data, process for transcription
      if (this.shouldTranscribe(participantStream)) {
        await this.transcribeAudioFromBuffer(participant);
      }

    } catch (error) {
      console.error('Error processing audio frame:', error);
    }
  }

  convertFrameToAudioData(frame) {
    try {
      // Convert LiveKit audio frame to Float32Array
      if (frame.data instanceof Buffer) {
        const float32Data = new Float32Array(frame.data.length / 2);
        const int16Data = new Int16Array(frame.data.buffer, frame.data.byteOffset, frame.data.length / 2);

        for (let i = 0; i < int16Data.length; i++) {
          float32Data[i] = int16Data[i] / 32768.0; // Convert to -1 to 1 range
        }

        return float32Data;
      }

      return null;
    } catch (error) {
      console.error('Error converting audio frame:', error);
      return null;
    }
  }

  preprocessAudio(audioData) {
    try {
      // Apply audio processing pipeline
      let processedData = audioData;

      // Normalize audio levels
      processedData = AudioProcessor.normalizeAudio(processedData);

      // Apply noise reduction
      processedData = AudioProcessor.applyNoiseReduction(processedData, 0.01);

      // Apply fade in/out to prevent clicks
      processedData = AudioProcessor.applyFade(processedData, 0.01, 0.01, AUDIO_CONFIG.sampleRate);

      return processedData;
    } catch (error) {
      console.error('Error preprocessing audio:', error);
      return audioData;
    }
  }

  shouldTranscribe(participantStream) {
    if (!participantStream || participantStream.buffer.length === 0) {
      return false;
    }

    // Check if we have enough audio data (approximately 1-2 seconds)
    const totalSamples = participantStream.buffer.reduce((sum, chunk) => sum + chunk.length, 0);
    const durationSeconds = totalSamples / AUDIO_CONFIG.sampleRate;

    // Also check if there's been a pause in speech
    const timeSinceLastActivity = Date.now() - participantStream.lastActivity;

    return durationSeconds >= 1.0 || (durationSeconds >= 0.5 && timeSinceLastActivity > 1000);
  }

  async transcribeAudioFromBuffer(participant) {
    const participantStream = this.participantAudioStreams.get(participant.identity);
    if (!participantStream || this.isProcessing) return;

    this.isProcessing = true;

    try {
      // Combine all audio chunks
      const combinedAudio = this.combineAudioChunks(participantStream.buffer);

      if (combinedAudio.length > 0) {
        // Convert to Buffer for Deepgram
        const audioBuffer = AudioBufferUtils.floatToInt16(combinedAudio);
        const audioData = Buffer.from(audioBuffer.buffer);

        // Transcribe the audio
        const transcription = await this.transcribeAudio(audioData);

        if (transcription && transcription.trim().length > 0) {
          console.log(`Transcription from ${participant.identity}: "${transcription}"`);

          // Process the transcribed text
          await this.processTranscription(transcription, participant);
        }
      }

      // Clear the buffer after processing
      participantStream.buffer = [];

    } catch (error) {
      console.error('Error transcribing audio from buffer:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  combineAudioChunks(chunks) {
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Float32Array(totalLength);

    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    return combined;
  }

  /**
   * Get database context for AI prompts
   */
  async getDatabaseContext(userId, command, userQuery) {
    try {
      console.log(`Fetching database context for user ${userId}, command: ${command.intent}`);

      // Get command-specific context for efficiency
      const context = await DatabaseContextService.getCommandContext(
        userId,
        command.intent,
        { query: userQuery }
      );

      console.log(`Database context fetched: ${context.summary || 'No context available'}`);
      return context;

    } catch (error) {
      console.error('Error fetching database context:', error);
      return {
        summary: 'Database context unavailable',
        error: error.message
      };
    }
  }

  /**
   * Generate context-aware response using database information
   */
  async generateContextAwareResponse(command, conversationContext, databaseContext, userId) {
    try {
      const { intent, entities } = command;

      // First try to use existing handlers for specific intents
      switch (intent) {
        case 'commit_volume':
          return await this.handleCommitVolumeWithContext(entities, userId, databaseContext);

        case 'check_inventory':
          return await this.handleCheckInventoryWithContext(userId, databaseContext);

        case 'check_deliveries':
          return await this.handleCheckDeliveriesWithContext(userId, databaseContext);

        case 'market_prices':
          return await this.handleMarketPricesWithContext(databaseContext);

        case 'weather_forecast':
          return await this.handleWeatherForecastWithContext(databaseContext);

        case 'quality_assessment':
          return await this.handleQualityAssessmentWithContext(entities, userId, databaseContext);

        case 'schedule_pickup':
          return await this.handleSchedulePickupWithContext(entities, userId, databaseContext);

        case 'general_query':
          return await this.handleGeneralQueryWithContext(entities?.query || '', conversationContext, databaseContext, userId);

        default:
          return await this.createBasicResponse(databaseContext);
      }

    } catch (error) {
      console.error('Error generating context-aware response:', error);
      return {
        text: "I'm having trouble processing that request. Please try again.",
        action: null,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * Context-aware handler methods for concise voice responses
   */

  async handleCheckInventoryWithContext(userId, databaseContext) {
    if (databaseContext.hasInventory) {
      const { totalVolume, gradeBreakdown, summary } = databaseContext;
      const gradeDetails = Object.entries(gradeBreakdown)
        .map(([grade, volume]) => `${grade}: ${volume}kg`)
        .join(', ');

      return {
        text: `You have ${totalVolume}kg total. ${gradeDetails}.`,
        action: 'inventory_report',
        data: { totalVolume, gradeBreakdown }
      };
    } else {
      return {
        text: "No cocoa beans in your inventory right now.",
        action: 'inventory_report',
        data: { inventory: [] }
      };
    }
  }

  async handleCheckDeliveriesWithContext(userId, databaseContext) {
    if (databaseContext.hasCommitments) {
      const { readyCommitments, inTransitCommitments, summary } = databaseContext;

      if (readyCommitments === 0 && inTransitCommitments === 0) {
        return {
          text: "No active deliveries at the moment.",
          action: 'delivery_report',
          data: { deliveries: [] }
        };
      }

      let response = `${readyCommitments} ready for pickup`;
      if (inTransitCommitments > 0) {
        response += ` and ${inTransitCommitments} in transit.`;
      } else {
        response += '.';
      }

      return {
        text: response,
        action: 'delivery_report',
        data: databaseContext
      };
    } else {
      return {
        text: "No delivery commitments found.",
        action: 'delivery_report',
        data: { deliveries: [] }
      };
    }
  }

  async handleMarketPricesWithContext(databaseContext) {
    if (databaseContext.cocoaPrices) {
      const { gradeA, gradeB, gradeC } = databaseContext.cocoaPrices;
      const trends = {
        up: '↑',
        down: '↓',
        stable: '→'
      };

      return {
        text: `Grade A: $${gradeA.price}/ton ${trends[gradeA.trend]}. Grade B: $${gradeB.price}/ton. Good time to sell!`,
        action: 'market_report',
        data: databaseContext.cocoaPrices
      };
    } else {
      return {
        text: "Market prices temporarily unavailable. Please check back later.",
        action: 'market_report',
        data: null
      };
    }
  }

  async handleCommitVolumeWithContext(entities, userId, databaseContext) {
    const [volume, orderId] = entities;

    if (!volume || !orderId) {
      return {
        text: "I need both volume and order number. Like: 'Commit 50kg to order ABC'.",
        action: 'request_clarification',
        data: { required: ['volume', 'order_id'] }
      };
    }

    // Check if user has inventory to commit
    if (databaseContext.inventory?.hasInventory) {
      const { totalVolume } = databaseContext.inventory;

      if (totalVolume < parseFloat(volume)) {
        return {
          text: `You only have ${totalVolume}kg available, but want to commit ${volume}kg. Check your inventory.`,
          action: 'inventory_insufficient',
          data: { available: totalVolume, requested: parseFloat(volume) }
        };
      }
    }

    return {
      text: `I'll commit ${volume}kg to order ${orderId}. Please confirm this commitment.`,
      action: 'confirm_commitment',
      data: { volume: parseFloat(volume), order_id: orderId }
    };
  }

  async handleWeatherForecastWithContext(databaseContext) {
    if (databaseContext.temperature && databaseContext.conditions) {
      const { temperature, rainfall, conditions } = databaseContext;

      return {
        text: `${conditions}: ${temperature.min}-${temperature.max}°C with ${rainfall} rain. Good for farming!`,
        action: 'weather_report',
        data: databaseContext
      };
    } else {
      return {
        text: "Weather info temporarily unavailable. Good conditions expected this week.",
        action: 'weather_report',
        data: { forecast: 'unavailable' }
      };
    }
  }

  async handleQualityAssessmentWithContext(entities, userId, databaseContext) {
    // Reference user's inventory for quality guidance
    let guidance = "Check for consistent color, no mold, and good aroma. Moisture should be 6-8%.";

    if (databaseContext.inventory?.hasInventory) {
      guidance += " Would you like me to schedule a quality inspection for your current inventory?";
    }

    return {
      text: guidance,
      action: 'quality_guidance',
      data: databaseContext.inventory || null
    };
  }

  async handleSchedulePickupWithContext(entities, userId, databaseContext) {
    // Check if user has ready commitments
    if (databaseContext.hasCommitments && databaseContext.readyCommitments > 0) {
      return {
        text: `You have ${databaseContext.readyCommitments} commitments ready for pickup. What date works best?`,
        action: 'schedule_request',
        data: { readyCount: databaseContext.readyCommitments }
      };
    } else {
      return {
        text: "No commitments are ready for pickup yet. I'll let you know when they are.",
        action: 'schedule_request',
        data: { readyCount: 0 }
      };
    }
  }

  async handleGeneralQueryWithContext(query, conversationContext, databaseContext, userId) {
    try {
      // Create context-aware prompt for Groq
      const contextPrompt = this.createContextAwarePrompt(query, databaseContext);

      const completion = await groq.chat.completions.create({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: `${contextPrompt}

Respond concisely in 25-50 words. Focus on practical advice for Filipino cocoa farmers. Use simple language and mention specific user data when relevant.`
          },
          {
            role: "user",
            content: query
          }
        ],
        max_tokens: 80, // Reduced for voice optimization
        temperature: 0.7
      });

      const response = completion.choices[0]?.message?.content ||
        "I can help with your cocoa farming questions about inventory, orders, deliveries, weather, or market prices.";

      return {
        text: response,
        action: 'general_response',
        data: { context: databaseContext?.summary }
      };

    } catch (error) {
      console.error('General query error:', error);
      return {
        text: "I'm here to help with cocoa farming. Ask me about inventory, orders, deliveries, weather, or market prices.",
        action: 'help_response',
        data: null
      };
    }
  }

  async createBasicResponse(databaseContext) {
    let response = "I'm your CacaoConnect assistant. I can help you with farming needs.";

    if (databaseContext?.summary) {
      response += ` Current status: ${databaseContext.summary}`;
    }

    response += " What would you like to know?";

    return {
      text: response,
      action: 'help_response',
      data: databaseContext
    };
  }

  /**
   * Create context-aware system prompt for AI
   */
  createContextAwarePrompt(userQuery, databaseContext) {
    let prompt = "You are a helpful Filipino cocoa farming assistant for CacaoConnect.";

    if (databaseContext?.summary && databaseContext.summary !== 'Database context unavailable') {
      prompt += `\n\nCurrent User Data: ${databaseContext.summary}`;
    }

    // Add specific context based on query
    const queryLower = userQuery.toLowerCase();

    if (queryLower.includes('inventory') && databaseContext?.inventory?.hasInventory) {
      prompt += `\n\nUser Inventory: ${databaseContext.inventory.summary}`;
    }

    if (queryLower.includes('order') && databaseContext?.orders?.hasOrders) {
      prompt += `\n\nUser Orders: ${databaseContext.orders.summary}`;
    }

    if (queryLower.includes('delivery') && databaseContext?.commitments?.hasCommitments) {
      prompt += `\n\nUser Commitments: ${databaseContext.commitments.summary}`;
    }

    if (queryLower.includes('market') && databaseContext?.market) {
      prompt += `\n\nMarket Data: ${databaseContext.market.summary}`;
    }

    prompt += "\n\nProvide helpful, practical advice in simple terms. Focus on action items and key information.";

    return prompt;
  }

  async processTranscription(text, participant) {
    try {
      // Parse command and get context
      const command = this.parseCommand(text);
      const conversationContext = this.getConversationContext(participant.identity);

      // Fetch database context for AI
      const databaseContext = await this.getDatabaseContext(participant.identity, command, text);

      // Generate appropriate response with database context
      const response = await this.generateContextAwareResponse(command, conversationContext, databaseContext, participant.identity);

      // Update conversation context
      this.updateConversationContext(participant.identity, {
        lastCommand: command,
        lastResponse: response,
        timestamp: Date.now(),
        databaseContext: databaseContext?.summary || null
      });

      // Convert response to speech and send back
      await this.sendAudioResponse(response.text, participant);

      // Handle any action that needs to be taken
      if (response.action && response.data) {
        await this.executeAction(response.action, response.data, participant.identity, participant);
      }

    } catch (error) {
      console.error('Error processing transcription:', error);
      this.sendErrorMessage(participant, "I'm having trouble processing that. Please try again.");
    }
  }

  // Legacy method - replaced by real-time audio processing pipeline
// Kept for compatibility with any existing client implementations
async processVoiceData(data, participant) {
  console.warn('Using legacy processVoiceData method. Consider upgrading to real-time audio processing.');

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
  await this.sendAudioResponse(response.text, participant);

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
    // Enhanced transcription with Deepgram STT
    try {
      console.log('Transcribing audio data...');
      const { SpeechToTextService } = require('../lib/voiceService');

      const transcription = await SpeechToTextService.transcribeAudio(audioData, {
        mimetype: 'audio/webm', // Adjust based on actual audio format
        language: 'en-US',
        model: 'nova-2'
      });

      console.log(`Transcription result: "${transcription}"`);
      return transcription;

    } catch (error) {
      console.error('Transcription failed:', error.message);

      // Fallback to simple text processing for demo purposes
      if (audioData && typeof audioData.toString === 'function') {
        const fallbackText = audioData.toString().trim();
        if (fallbackText && fallbackText.length > 0) {
          console.log('Using fallback transcription');
          return fallbackText;
        }
      }

      // Return empty transcription if all methods fail
      return '';
    }
  }

  async synthesizeSpeech(text) {
    // Use enhanced TTS with humanization features
    try {
      // Try Deepgram Aura first for more natural voice with humanization
      const { TextToSpeechService } = require('../lib/voiceService');
      const voiceConfig = TextToSpeechService.getVoiceConfig();

      console.log(`Synthesizing speech with voice: ${voiceConfig.voice}, rate: ${voiceConfig.rate}, pitch: ${voiceConfig.pitch}`);

      return await TextToSpeechService.synthesizeSpeechWithDeepgram(text, {
        voice: voiceConfig.voice,
        emotion: voiceConfig.emotion,
        rate: voiceConfig.rate,
        pitch: voiceConfig.pitch,
        volume: voiceConfig.volume
      });
    } catch (error) {
      console.error('Advanced TTS failed, falling back to basic:', error);
      // Fallback to returning text (client will handle basic TTS)
      return text;
    }
  }

  async sendAudioResponse(text, participant) {
    try {
      console.log(`Sending audio response to ${participant.identity}: "${text}"`);

      // Generate speech audio
      const audioResponse = await this.synthesizeSpeech(text);

      if (audioResponse && typeof audioResponse === 'object' && audioResponse.byteLength) {
        // Send audio through LiveKit
        await this.publishAudioToParticipant(audioResponse, participant);
      } else if (typeof audioResponse === 'string') {
        // Fallback to text if TTS failed
        this.sendTextMessage(text, participant);
      }

    } catch (error) {
      console.error('Error sending audio response:', error);
      // Fallback to text message
      this.sendTextMessage(text, participant);
    }
  }

  async publishAudioToParticipant(audioBuffer, participant) {
    try {
      // This is a simplified implementation
      // In a real LiveKit implementation, you would:
      // 1. Convert audio buffer to the correct format
      // 2. Create an audio track
      // 3. Publish the track to the participant

      console.log(`Publishing audio (${audioBuffer.byteLength} bytes) to ${participant.identity}`);

      // For now, we'll use a data channel to send the audio
      // This would be replaced with proper LiveKit audio track publishing
      this sendDataToParticipant({
        type: 'audio_response',
        audioData: Array.from(new Uint8Array(audioBuffer)),
        timestamp: Date.now()
      }, participant);

    } catch (error) {
      console.error('Error publishing audio:', error);
      throw error;
    }
  }

  sendTextMessage(text, participant) {
    try {
      console.log(`Sending text message to ${participant.identity}: "${text}"`);

      this.sendDataToParticipant({
        type: 'text_response',
        text: text,
        timestamp: Date.now()
      }, participant);

    } catch (error) {
      console.error('Error sending text message:', error);
    }
  }

  sendDataToParticipant(data, participant) {
    try {
      const message = JSON.stringify(data);

      // Use LiveKit's data channel to send the message
      if (participant.dataChannel) {
        participant.dataChannel.send(message);
      } else {
        // Fallback to direct participant communication
        participant.publishData(message, { reliable: true });
      }

    } catch (error) {
      console.error('Error sending data to participant:', error);
    }
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
