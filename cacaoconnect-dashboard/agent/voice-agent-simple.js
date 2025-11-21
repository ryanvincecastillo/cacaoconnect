require('dotenv').config();

const { Groq } = require('groq-sdk');
const { createClient } = require('@supabase/supabase-js');
const { WebSocket } = require('ws');

console.log('🍫 Starting CacaoConnect Voice Agent (Simplified)...');
console.log('Voice agent is running in standalone mode for testing.');

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

// Check environment variables
console.log('🔧 Configuration check:');
console.log(`✅ Groq API Key: ${GROQ_API_KEY ? 'SET' : 'MISSING'}`);
console.log(`✅ Supabase URL: ${NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING'}`);
console.log(`✅ Deepgram API Key: ${DEEPGRAM_API_KEY ? 'SET' : 'MISSING'}`);
console.log(`✅ LiveKit URL: ${LIVEKIT_URL ? 'SET' : 'MISSING'}`);

// Initialize Groq for LLM processing
const groq = new Groq({ apiKey: GROQ_API_KEY });

// Initialize Supabase for data access
const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Simplified voice agent functions
class CacaoVoiceAgent {
  constructor() {
    this.conversationContext = new Map();
    console.log('🎤 Voice Agent initialized');
  }

  // Test Groq connection
  async testGroqConnection() {
    try {
      const response = await groq.chat.completions.create({
        messages: [{ role: 'user', content: 'Hello, can you help me with farming?' }],
        model: 'llama-3.1-8b-instant',
        max_tokens: 50
      });

      console.log('✅ Groq connection successful');
      console.log('🤖 Sample response:', response.choices[0]?.message?.content);
      return true;
    } catch (error) {
      console.error('❌ Groq connection failed:', error.message);
      return false;
    }
  }

  // Test Supabase connection
  async testSupabaseConnection() {
    try {
      const { data, error } = await supabase.from('orders').select('count').limit(1);
      if (error) throw error;

      console.log('✅ Supabase connection successful');
      console.log('📊 Database accessible');
      return true;
    } catch (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
  }

  // Parse farming commands
  parseCommand(transcription) {
    const text = transcription.toLowerCase();

    // Simple command parsing
    if (text.includes('inventory') || text.includes('stock')) {
      return { intent: 'check_inventory', confidence: 0.9 };
    }
    if (text.includes('commit') && text.includes('kg')) {
      return { intent: 'commit_volume', confidence: 0.8 };
    }
    if (text.includes('weather') || text.includes('rain')) {
      return { intent: 'weather_query', confidence: 0.9 };
    }
    if (text.includes('delivery') || text.includes('pickup')) {
      return { intent: 'delivery_status', confidence: 0.8 };
    }

    return { intent: 'general_query', confidence: 0.5 };
  }

  // Generate farming-specific response
  async generateFarmingResponse(command, context, userId) {
    try {
      const prompt = this.buildFarmingPrompt(command, context);

      const response = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        max_tokens: 150,
        temperature: 0.7
      });

      return {
        text: response.choices[0]?.message?.content || 'I can help you with that.',
        command: command,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating response:', error);
      return {
        text: 'I apologize, but I am having trouble processing your request right now.',
        command: command,
        timestamp: new Date().toISOString()
      };
    }
  }

  buildFarmingPrompt(command, context) {
    const prompts = {
      'check_inventory': 'You are helping a cacao farmer check their inventory. Provide a helpful response about checking their current stock levels.',
      'commit_volume': 'You are helping a cacao farmer commit to an order. Provide guidance on how to commit their cacao beans.',
      'weather_query': 'You are providing weather information to a cacao farmer. Give helpful farming-related weather advice.',
      'delivery_status': 'You are helping a cacao farmer check their delivery status. Provide helpful information about their shipments.',
      'general_query': 'You are assisting a cacao farmer with general questions about farming and the CacaoConnect platform.'
    };

    return prompts[command.intent] || prompts['general_query'];
  }
}

// Main function
async function main() {
  try {
    const agent = new CacaoVoiceAgent();

    console.log('\n🧪 Testing connections...');

    // Test connections
    const groqOk = await agent.testGroqConnection();
    const supabaseOk = await agent.testSupabaseConnection();

    if (groqOk && supabaseOk) {
      console.log('\n🎉 Voice agent is ready to use!');
      console.log('📱 Available voice commands:');
      console.log('  • "Check my inventory" - View current stock levels');
      console.log('  • "Commit 50kg to order ABC" - Commit to orders');
      console.log('  • "Weather forecast" - Get weather information');
      console.log('  • "Check my deliveries" - View delivery status');
      console.log('\n💡 Note: Full LiveKit voice integration requires additional setup.');
      console.log('🌐 Main app is available at: http://localhost:3000');

      // Keep the process running
      console.log('\n⏳ Voice agent running in test mode. Press Ctrl+C to stop.');
      setInterval(() => {
        console.log('🔄 Voice agent heartbeat - still running');
      }, 30000); // Log every 30 seconds

    } else {
      console.error('\n❌ Voice agent failed to initialize properly');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Failed to start voice agent:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down voice agent...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Terminating voice agent...');
  process.exit(0);
});

// Start the agent
if (require.main === module) {
  main();
}

module.exports = CacaoVoiceAgent;