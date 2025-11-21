import { AccessToken } from 'livekit-server-sdk';

// --- CONFIGURATION ---

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL;

// Room names for different purposes
const VOICE_ASSISTANT_ROOM = 'cacao-voice-assistant';
const FARMER_SUPPORT_ROOM = 'farmer-support';
const PROCESSOR_ROOM = 'processor-room';

// Generate a random participant identity
function generateParticipantIdentity(userType = 'user') {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  return `${userType}-${timestamp}-${randomId}`;
}

// Main GET endpoint for token generation
export async function GET(request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const roomName = searchParams.get('room') || VOICE_ASSISTANT_ROOM;
    const userType = searchParams.get('userType') || 'farmer';
    const userId = searchParams.get('userId');

    // Validate required configuration
    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
      return new Response(
        JSON.stringify({
          error: 'LiveKit configuration is missing',
          details: {
            hasApiKey: !!LIVEKIT_API_KEY,
            hasApiSecret: !!LIVEKIT_API_SECRET,
            hasUrl: !!LIVEKIT_URL
          }
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate room name
    const allowedRooms = [VOICE_ASSISTANT_ROOM, FARMER_SUPPORT_ROOM, PROCESSOR_ROOM];
    if (!allowedRooms.includes(roomName)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid room name',
          allowedRooms
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create access token
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: userId || generateParticipantIdentity(userType),
      name: `${userType.charAt(0).toUpperCase() + userType.slice(1)} Assistant`
    });

    // Add grants for the participant
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });

    // Additional metadata for the participant
    at.metadata = JSON.stringify({
      userType,
      joinedAt: new Date().toISOString(),
      clientVersion: '1.0.0'
    });

    // Generate JWT token
    const token = at.toJwt();

    // Return token and configuration
    return new Response(
      JSON.stringify({
        success: true,
        token,
        url: LIVEKIT_URL,
        roomName,
        participant: {
          identity: at.identity,
          name: at.name,
          metadata: at.metadata
        },
        grants: {
          roomJoin: true,
          canPublish: true,
          canSubscribe: true,
          canPublishData: true
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );

  } catch (error) {
    console.error('LiveKit token generation error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to generate LiveKit token',
        message: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// POST endpoint for specific room requests
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      room = VOICE_ASSISTANT_ROOM,
      userType = 'farmer',
      userId,
      customMetadata = {}
    } = body;

    // Validate required configuration
    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
      return new Response(
        JSON.stringify({
          error: 'LiveKit configuration is missing on server'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create access token with custom configuration
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: userId || generateParticipantIdentity(userType),
      name: `${userType.charAt(0).toUpperCase() + userType.slice(1)} User`
    });

    // Add grants based on user type and room
    const grants = {
      roomJoin: true,
      room: room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    };

    // Special grants for different user types
    if (userType === 'farmer') {
      grants.canPublish = true;  // Farmers can speak
      grants.canSubscribe = true; // Farmers can listen to assistant
    } else if (userType === 'processor') {
      grants.canPublish = true;  // Processors can speak
      grants.canSubscribe = true; // Processors can listen
    } else if (userType === 'assistant') {
      grants.canPublish = true;  // Assistant can speak
      grants.canSubscribe = true; // Assistant can listen to users
    }

    at.addGrant(grants);

    // Add custom metadata
    const metadata = {
      userType,
      joinedAt: new Date().toISOString(),
      clientVersion: '1.0.0',
      ...customMetadata
    };

    at.metadata = JSON.stringify(metadata);

    // Generate JWT token
    const token = at.toJwt();

    return new Response(
      JSON.stringify({
        success: true,
        token,
        url: LIVEKIT_URL,
        room,
        participant: {
          identity: at.identity,
          name: at.name,
          metadata
        },
        grants
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );

  } catch (error) {
    console.error('LiveKit POST token generation error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to generate LiveKit token',
        message: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}