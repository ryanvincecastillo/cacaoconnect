#!/usr/bin/env node

/**
 * Voice Enhancement Test Script
 * Tests the enhanced emotional intelligence and humanization features
 *
 * Usage: node test-voice-enhancement.js
 */

require('dotenv').config();

// Import the enhanced voice service
const { EmotionalIntelligence, TextToSpeechService } = require('./lib/voiceService');

// Comprehensive test cases for different farming scenarios
const testCases = [
  {
    text: "Great! Your order has been successfully approved and you're ready for harvest.",
    expectedEmotion: 'enthusiastic',
    description: "Positive success message",
    category: "order_management"
  },
  {
    text: "I apologize, but I'm unable to process your request due to a system error.",
    expectedEmotion: 'concerned',
    description: "Error/apology message",
    category: "error_handling"
  },
  {
    text: "You currently have 150 kilograms of Grade A cocoa in inventory with details.",
    expectedEmotion: 'neutral',
    description: "Informational status update",
    category: "inventory_report"
  },
  {
    text: "I can help you check your delivery status and market prices today.",
    expectedEmotion: 'friendly',
    description: "Helpful response",
    category: "general_assistance"
  },
  {
    text: "Important! You must immediately process the 50kg commitment for order ABC123.",
    expectedEmotion: 'concerned',
    description: "Urgent action required",
    category: "urgent_notification"
  },
  {
    text: "Excellent! Market prices for Grade A cocoa are at $3,200 per ton!",
    expectedEmotion: 'enthusiastic',
    description: "Good market news",
    category: "market_update"
  }
];

async function runTests() {
  console.log('🎤 Enhanced Voice Humanization Testing Suite\n');
  console.log('='.repeat(60));

  // Test 1: Voice Configuration
  testVoiceConfiguration();

  // Test 2: Enhanced Emotion Detection
  testEmotionDetection();

  // Test 3: Text Humanization Features
  testTextHumanization();

  // Test 4: Prosody Control
  testProsodyControl();

  // Test 5: Speech Rhythm Optimization
  testSpeechRhythm();

  // Test 6: Deepgram Integration
  await testDeepgramIntegration();

  console.log('\n✨ All voice enhancement tests completed!');
  displayConfigurationGuide();
}

function testVoiceConfiguration() {
  console.log('\n📋 Testing Voice Configuration:');
  console.log('-'.repeat(40));

  try {
    const config = TextToSpeechService.getVoiceConfig();

    console.log(`✅ Voice Model: ${config.voice}`);
    console.log(`✅ Speech Rate: ${config.rate} (0.5-2.0)`);
    console.log(`✅ Voice Pitch: ${config.pitch} (0.5-2.0)`);
    console.log(`✅ Volume Level: ${config.volume} (0.1-1.0)`);
    console.log(`✅ Default Emotion: ${config.emotion}`);
    console.log(`✅ Stability: ${config.stability}`);
    console.log(`✅ Similarity Boost: ${config.similarity_boost}`);
    console.log(`✅ Pause Duration: ${config.pause_duration}ms`);
    console.log(`✅ Breathing Enabled: ${config.breathing_enabled}`);

    // Validate ranges
    const isValid =
      config.rate >= 0.5 && config.rate <= 2.0 &&
      config.pitch >= 0.5 && config.pitch <= 2.0 &&
      config.volume >= 0.1 && config.volume <= 1.0 &&
      ['enthusiastic', 'concerned', 'neutral', 'friendly'].includes(config.emotion);

    console.log(`\n🔍 Configuration Validation: ${isValid ? '✅ Valid' : '❌ Invalid'}`);

  } catch (error) {
    console.log(`❌ Configuration test failed: ${error.message}`);
  }
}

function testEmotionDetection() {
  console.log('\n🎭 Testing Enhanced Emotion Detection:');
  console.log('-'.repeat(40));

  let passCount = 0;

  testCases.forEach((testCase, index) => {
    const detectedEmotion = EmotionalIntelligence.detectEmotion(testCase.text);
    const passed = detectedEmotion === testCase.expectedEmotion;
    if (passed) passCount++;

    console.log(`\n${index + 1}. ${testCase.description} (${testCase.category})`);
    console.log(`   Text: "${testCase.text}"`);
    console.log(`   Expected: ${testCase.expectedEmotion}`);
    console.log(`   Detected: ${detectedEmotion}`);
    console.log(`   Result: ${passed ? '✅ PASS' : '⚠️  MISMATCH'}`);
  });

  const accuracy = (passCount / testCases.length * 100).toFixed(1);
  console.log(`\n📊 Emotion Detection Accuracy: ${accuracy}% (${passCount}/${testCases.length})`);
}

function testTextHumanization() {
  console.log('\n🗣️ Testing Text Humanization Features:');
  console.log('-'.repeat(40));

  testCases.forEach((testCase, index) => {
    const emotion = EmotionalIntelligence.detectEmotion(testCase.text);

    // Test original emotion enhancement
    const emotionEnhanced = EmotionalIntelligence.enhanceTextWithEmotion(testCase.text, emotion);

    // Test new humanization features
    const fullyEnhanced = TextToSpeechService.addNaturalHumanization(testCase.text, emotion);

    console.log(`\n${index + 1}. ${testCase.description}`);
    console.log(`   Emotion: ${emotion}`);
    console.log(`   Original:    "${testCase.text}"`);
    console.log(`   Enhanced:    "${emotionEnhanced}"`);
    console.log(`   Humanized:   "${fullyEnhanced}"`);

    // Analyze humanization features
    const hasBreathingPauses = fullyEnhanced.includes('*');
    const hasEmphasis = fullyEnhanced.includes('**');
    const hasNaturalPatterns = /(\bwell\b|\boh\b|\bsure\b|\bof course\b|\bactually\b|\bbasically\b)/gi.test(fullyEnhanced);

    console.log(`   Features: ${hasBreathingPauses ? '🌬️ breathing' : ''}${hasEmphasis ? ' 💪 emphasis' : ''}${hasNaturalPatterns ? ' 💬 patterns' : ''}`);
  });
}

function testProsodyControl() {
  console.log('\n🎵 Testing Dynamic Prosody Control:');
  console.log('-'.repeat(40));

  const baseSettings = { rate: 1.0, pitch: 1.0, volume: 1.0 };

  testCases.forEach((testCase, index) => {
    const emotion = EmotionalIntelligence.detectEmotion(testCase.text);
    const prosodySettings = TextToSpeechService.calculateProsodySettings(testCase.text, emotion, baseSettings);

    console.log(`\n${index + 1}. ${testCase.description}`);
    console.log(`   Emotion: ${emotion}`);
    console.log(`   Text: "${testCase.text.substring(0, 50)}..."`);
    console.log(`   Base Settings:    rate=${baseSettings.rate}, pitch=${baseSettings.pitch}, volume=${baseSettings.volume}`);
    console.log(`   Adjusted Settings: rate=${prosodySettings.rate.toFixed(2)}, pitch=${prosodySettings.pitch.toFixed(2)}, volume=${prosodySettings.volume.toFixed(2)}`);

    const hasAdjustments =
      prosodySettings.rate !== baseSettings.rate ||
      prosodySettings.pitch !== baseSettings.pitch ||
      prosodySettings.volume !== baseSettings.volume;

    console.log(`   Adjustments Applied: ${hasAdjustments ? '✅ Yes' : '➖ No'}`);
  });
}

function testSpeechRhythm() {
  console.log('\n🥁 Testing Speech Rhythm Optimization:');
  console.log('-'.repeat(40));

  const rhythmTests = [
    {
      name: "Short simple sentence",
      text: "Check inventory.",
      expectedBehavior: "Slightly faster rate"
    },
    {
      name: "Complex sentence with numbers",
      text: "You have 150 kilograms of Grade A cocoa valued at $3,200 per ton for order ABC123.",
      expectedBehavior: "Slower rate with emphasis"
    },
    {
      name: "Long sentence with multiple clauses",
      text: "I can help you with your inventory management, market price analysis, delivery scheduling, and quality assessment, but I need to check your current status first.",
      expectedBehavior: "Breathing pauses and moderate rate"
    }
  ];

  const baseSettings = { rate: 1.0, pitch: 1.0, volume: 1.0 };

  rhythmTests.forEach((test, index) => {
    const emotion = 'neutral';
    const prosodySettings = TextToSpeechService.calculateProsodySettings(test.text, emotion, baseSettings);

    console.log(`\n${index + 1}. ${test.name}`);
    console.log(`   Text: "${test.text}"`);
    console.log(`   Expected: ${test.expectedBehavior}`);
    console.log(`   Result: rate=${prosodySettings.rate.toFixed(2)}`);
    console.log(`   Analysis: ${prosodySettings.rate < 1.0 ? '🐌 Slowed down' : prosodySettings.rate > 1.0 ? '🚀 Speed up' : '➖ Normal'}`);
  });
}

async function testDeepgramIntegration() {
  console.log('\n🌟 Testing Deepgram Integration:');
  console.log('-'.repeat(40));

  if (!process.env.DEEPGRAM_API_KEY) {
    console.log('⚠️  DEEPGRAM_API_KEY not set - skipping Deepgram tests');
    console.log('   Set DEEPGRAM_API_KEY in your .env file to test Deepgram Aura');
    return;
  }

  const testText = "Great! I can help you with your cocoa farming needs today.";

  try {
    console.log(`Testing with: "${testText}"`);
    console.log('Calling Deepgram Aura API...');

    // Note: This tests the full pipeline
    const audioBuffer = await TextToSpeechService.synthesizeSpeechWithDeepgram(testText);

    console.log(`✅ Deepgram synthesis successful!`);
    console.log(`   Audio buffer size: ${audioBuffer.byteLength} bytes`);
    console.log(`   Estimated duration: ${(audioBuffer.byteLength / 8000).toFixed(1)} seconds`);

  } catch (error) {
    console.log(`❌ Deepgram test failed: ${error.message}`);
    console.log('   Check your DEEPGRAM_API_KEY and network connection');
  }
}

function displayConfigurationGuide() {
  console.log('\n' + '='.repeat(60));
  console.log('📚 Voice Configuration Guide');
  console.log('='.repeat(60));
  console.log(`
To customize your voice assistant, add these to your .env file:

# Voice Model Selection:
ASSISTANT_VOICE=aura-luna-en        # Options: aura-luna-en, aura-stella-en, aura-asteria-en

# Speech Characteristics:
ASSISTANT_VOICE_RATE=0.9           # 0.5=slow, 1.0=normal, 2.0=fast
ASSISTANT_VOICE_PITCH=1.0          # 0.5=low, 1.0=normal, 2.0=high
ASSISTANT_VOICE_EMOTION=friendly   # enthusiastic, concerned, neutral, friendly

# Natural Speech Features:
ASSISTANT_VOICE_BREATHING_ENABLED=true   # Enable breathing pauses
ASSISTANT_VOICE_PAUSE_DURATION=500       # Pause length in milliseconds

Restart voice agent: npm run voice:restart
Monitor logs: npm run voice:logs
Test voice: npm run voice:dev
`);
}

// Run the tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testCases };
