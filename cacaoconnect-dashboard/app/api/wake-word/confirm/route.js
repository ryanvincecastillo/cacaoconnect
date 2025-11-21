import { NextResponse } from 'next/server';
import { Deepgram } from '@deepgram/sdk';

// Initialize Deepgram for server-side confirmation
let deepgram = null;

// Function to initialize Deepgram lazily
const getDeepgramClient = () => {
  if (!deepgram && process.env.DEEPGRAM_API_KEY) {
    deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);
  }
  return deepgram;
};

/**
 * POST /api/wake-word/confirm
 * Confirm wake word detection using server-side speech recognition
 * 
 * Request body:
 * {
 *   "audioData": "base64-encoded-audio-data",
 *   "wakeWord": "hey jodex",
 *   "confidence": 0.85,
 *   "userId": "user123"
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { audioData, wakeWord, confidence, userId } = body;

    // Validate required fields
    if (!audioData || !wakeWord) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: audioData and wakeWord are required',
          confirmed: false,
          confidence: 0
        },
        { status: 400 }
      );
    }

    // Initialize Deepgram client
    const dgClient = getDeepgramClient();
    if (!dgClient) {
      console.warn('Deepgram not configured, skipping server-side confirmation');
      return NextResponse.json({
        confirmed: true, // Fallback to client-side detection
        confidence: confidence || 0.7,
        method: 'client-only',
        transcript: null,
        warning: 'Server-side confirmation not available'
      });
    }

    // Convert base64 audio data to buffer
    let audioBuffer;
    try {
      audioBuffer = Buffer.from(audioData, 'base64');
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Invalid audio data format',
          confirmed: false,
          confidence: 0
        },
        { status: 400 }
      );
    }

    // Transcribe audio using Deepgram
    let transcriptionResult;
    try {
      const response = await dgClient.listen.prerecorded(
        { buffer: audioBuffer, mimetype: 'audio/webm' },
        {
          model: 'nova-2',
          language: 'en-US',
          smart_format: true,
          punctuate: true,
          utterances: true,
          profanity_filter: false,
          alternatives: 3
        }
      );

      transcriptionResult = response.results;
    } catch (deepgramError) {
      console.error('Deepgram transcription error:', deepgramError);
      
      // Fallback to client-side detection if Deepgram fails
      return NextResponse.json({
        confirmed: confidence >= 0.7,
        confidence: confidence || 0.7,
        method: 'client-fallback',
        transcript: null,
        error: 'Server transcription failed, using client-side detection'
      });
    }

    // Process transcription results
    const alternatives = transcriptionResult?.channels?.[0]?.alternatives || [];
    const primaryTranscript = alternatives[0]?.transcript?.toLowerCase()?.trim() || '';
    const primaryConfidence = alternatives[0]?.confidence || 0;

    // Check if wake word is detected in transcript
    const wakeWordLower = wakeWord.toLowerCase();
    const isWakeWordDetected = primaryTranscript.includes(wakeWordLower);

    // Calculate confirmation score
    let confirmationScore = 0;
    let matchedAlternative = null;

    for (const alternative of alternatives) {
      const transcript = alternative.transcript?.toLowerCase()?.trim() || '';
      const altConfidence = alternative.confidence || 0;
      
      if (transcript.includes(wakeWordLower)) {
        // Exact match bonus
        if (transcript === wakeWordLower) {
          altConfidence *= 1.2;
        }
        
        // Standalone phrase bonus (not in middle of other words)
        const words = transcript.split(' ');
        const wakeWordWords = wakeWordLower.split(' ');
        let isStandalone = false;
        
        for (let i = 0; i <= words.length - wakeWordWords.length; i++) {
          const slice = words.slice(i, i + wakeWordWords.length).join(' ');
          if (slice === wakeWordLower) {
            isStandalone = true;
            break;
          }
        }
        
        const adjustedScore = isStandalone ? altConfidence * 1.1 : altConfidence;
        
        if (adjustedScore > confirmationScore) {
          confirmationScore = adjustedScore;
          matchedAlternative = alternative;
        }
      }
    }

    // Combine client and server confidence
    const combinedConfidence = (confidence + confirmationScore) / 2;
    const finalConfirmed = combinedConfidence >= 0.6; // Slightly lower threshold for combined

    // Log detection for analytics (in production, you'd send to a proper analytics service)
    console.log(`Wake word confirmation for user ${userId}:`, {
      wakeWord,
      clientConfidence: confidence,
      serverConfidence: confirmationScore,
      combinedConfidence,
      confirmed: finalConfirmed,
      transcript: primaryTranscript,
      detectedAt: new Date().toISOString()
    });

    return NextResponse.json({
      confirmed: finalConfirmed,
      confidence: Math.min(combinedConfidence, 1.0),
      method: 'server-confirmed',
      transcript: primaryTranscript,
      alternatives: alternatives.map(alt => ({
        transcript: alt.transcript,
        confidence: alt.confidence
      })),
      matchedAlternative: matchedAlternative ? {
        transcript: matchedAlternative.transcript,
        confidence: matchedAlternative.confidence
      } : null,
      isWakeWordDetected,
      serverTranscription: {
        confidence: primaryConfidence,
        transcript: primaryTranscript
      }
    });

  } catch (error) {
    console.error('Wake word confirmation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error during wake word confirmation',
        confirmed: false,
        confidence: 0,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/wake-word/confirm
 * Get wake word detection statistics and configuration
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Return configuration and statistics
    const config = {
      supportedWakeWords: ['hey jodex', 'hi jodex'],
      defaultSensitivity: 0.7,
      minConfidence: 0.6,
      maxAudioSize: 5 * 1024 * 1024, // 5MB
      supportedFormats: ['webm', 'wav', 'mp3'],
      deepgramConfigured: !!process.env.DEEPGRAM_API_KEY,
      features: {
        serverConfirmation: !!process.env.DEEPGRAM_API_KEY,
        clientFallback: true,
        analytics: true,
        customWakeWords: false
      }
    };

    // In a real implementation, you might fetch user-specific statistics from a database
    const stats = userId ? {
      userId,
      totalDetections: 0, // Would come from database
      confirmedDetections: 0,
      averageConfidence: 0,
      lastDetection: null
    } : null;

    return NextResponse.json({
      config,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Wake word config error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get wake word configuration',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/wake-word/confirm
 * Update user-specific wake word settings
 */
export async function PUT(request) {
  try {
    const body = await request.json();
    const { userId, settings } = body;

    if (!userId || !settings) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and settings' },
        { status: 400 }
      );
    }

    // Validate settings
    const { sensitivity, wakeWords, enabled } = settings;
    
    if (sensitivity !== undefined && (sensitivity < 0.1 || sensitivity > 1.0)) {
      return NextResponse.json(
        { error: 'Sensitivity must be between 0.1 and 1.0' },
        { status: 400 }
      );
    }

    if (wakeWords && (!Array.isArray(wakeWords) || wakeWords.length === 0)) {
      return NextResponse.json(
        { error: 'Wake words must be a non-empty array' },
        { status: 400 }
      );
    }

    // In a real implementation, you would save these to a database
    console.log(`Updating wake word settings for user ${userId}:`, settings);

    return NextResponse.json({
      success: true,
      updated: {
        userId,
        settings: {
          sensitivity: sensitivity ?? 0.7,
          wakeWords: wakeWords ?? ['hey jodex'],
          enabled: enabled ?? true
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Wake word settings update error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update wake word settings',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
