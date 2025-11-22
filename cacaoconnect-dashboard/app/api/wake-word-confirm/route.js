import { NextResponse } from 'next/server';

/**
 * Wake Word Confirmation API Endpoint
 *
 * This endpoint provides server-side confirmation for wake word detection
 * to prevent false positives and enhance accuracy.
 */

const WAKE_WORD_PATTERNS = [
  /hey\s+cacao/i,
  /okay\s+cacao/i,
  /hi\s+assistant/i,
  /hello\s+cacao/i,
  /cacao\s+assistant/i
];

const CONFIDENCE_BOOST_PATTERNS = [
  /\b(please|help|assist)\b/i,
  /\b(check|show|tell|what|how)\b/i,
  /\b(cocoa|farm|inventory|order|delivery)\b/i
];

export async function POST(request) {
  try {
    const { wakeWord, timestamp, audioContext } = await request.json();

    // Validate request
    if (!wakeWord || !timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: wakeWord, timestamp' },
        { status: 400 }
      );
    }

    // Check if wake word is recent (within last 5 seconds)
    const now = Date.now();
    const timeDiff = now - timestamp;

    if (timeDiff > 5000) {
      return NextResponse.json({
        confirmed: false,
        reason: 'Wake word too old',
        confidence: 0
      });
    }

    // Validate wake word pattern
    const isValidWakeWord = WAKE_WORD_PATTERNS.some(pattern =>
      pattern.test(wakeWord.toLowerCase())
    );

    if (!isValidWakeWord) {
      return NextResponse.json({
        confirmed: false,
        reason: 'Invalid wake word pattern',
        confidence: 0
      });
    }

    // Calculate confidence score
    let confidence = 0.7; // Base confidence for pattern match

    // Boost confidence if wake word includes contextual terms
    if (CONFIDENCE_BOOST_PATTERNS.some(pattern => pattern.test(wakeWord))) {
      confidence += 0.2;
    }

    // Check for false positive patterns
    const falsePositivePatterns = [
      /\b(hello|hi)\s+world\b/i,
      /\b(hey|okay)\s+(there|man|dude)\b/i,
      /\b(cacao)\s+(beans|chocolate|powder)\b/i
    ];

    if (falsePositivePatterns.some(pattern => pattern.test(wakeWord))) {
      confidence -= 0.3;
    }

    // Check time since last confirmed wake word (prevent rapid re-triggering)
    const lastConfirmed = global.lastWakeWordConfirmed || 0;
    if (now - lastConfirmed < 2000) {
      confidence -= 0.4;
    }

    // Ensure confidence is within valid range
    confidence = Math.max(0, Math.min(1, confidence));

    const confirmed = confidence >= 0.6; // Minimum threshold

    if (confirmed) {
      global.lastWakeWordConfirmed = now;
      console.log(`✅ Wake word confirmed: "${wakeWord}" (confidence: ${confidence.toFixed(2)})`);
    } else {
      console.log(`❌ Wake word rejected: "${wakeWord}" (confidence: ${confidence.toFixed(2)})`);
    }

    return NextResponse.json({
      confirmed,
      confidence,
      wakeWord: wakeWord.toLowerCase(),
      timestamp,
      reason: confirmed ? 'Wake word pattern matched' : 'Confidence too low'
    });

  } catch (error) {
    console.error('Wake word confirmation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return supported wake words for client-side validation
  return NextResponse.json({
    supportedWakeWords: [
      'Hey Cacao',
      'Okay Cacao',
      'Hi Assistant',
      'Hello Cacao',
      'Cacao Assistant'
    ],
    minimumConfidence: 0.6,
    cooldownPeriod: 2000
  });
}