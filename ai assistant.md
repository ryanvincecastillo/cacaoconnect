Below is the **clean, rigorous, technical implementation plan** in **Markdown**, tailored for your **existing folder structure**:

```
cacaoconnect/
│
└── cacaoconnect-dashboard/   (Next.js app)
```

This MD file tells your AI coder *exactly* what to build, with zero Python, fully Node-only, using LiveKit + Groq + Deepgram.

---

# **AI Voice Assistant Integration Plan (Node-Only, Next.js + LiveKit + Groq + Deepgram)**

This document describes how to implement a **floating voice AI assistant** inside the `cacaoconnect-dashboard` Next.js project, with a **single Node-only ecosystem**.
No Python, no extra services — only Next.js + a Node Agent.

---

# **1. Project Structure**

Inside your main repo:

```
cacaoconnect/
│
└── cacaoconnect-dashboard/       # Next.js 13+ App Router
│     ├── app/
│     ├── components/
│     ├── public/
│     ├── lib/
│     ├── agent/                  # NEW: Realtime Voice Agent Server
│     │    └── agent.js
│     ├── api/
│     └── ...
│
└── package.json  (workspace optional)
```

---

# **2. Required Keys**

Put in `.env.local` inside `cacaoconnect-dashboard/`:

```
# LiveKit
LIVEKIT_URL=wss://your-livekit-server-url
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# Groq (LLM)
GROQ_API_KEY=your_groq_key

# Deepgram (STT + TTS)
DEEPGRAM_API_KEY=your_deepgram_key

# Assistant
ASSISTANT_VOICE=en-US-Ava
```

All these keys have **free tiers**:

* Deepgram: free tier with real-time STT/TTS
* Groq: free tier
* LiveKit Cloud: free tier with usage credits

---

# **3. Install Dependencies (Node Only)**

Inside **cacaoconnect-dashboard** run:

```bash
npm install livekit-client @livekit/components-react \
livekit-server-sdk \
@livekit/agents \
groq-sdk \
deepgram-sdk \
ws \
pm2
```

---

# **4. Floating Voice Assistant Component**

Create:

```
/cacaoconnect-dashboard/components/VoiceAssistantWidget.tsx
```

Contents:

```tsx
"use client";

import { VoiceAssistant, LiveKitRoom } from "@livekit/components-react";

export default function VoiceAssistantWidget() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <LiveKitRoom
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        token={undefined}
      >
        <VoiceAssistant
          agentUrl="/api/livekit-token"
          autoConnect={false}
          bubble
        />
      </LiveKitRoom>
    </div>
  );
}
```

---

# **5. Generate LiveKit Token via Next.js API Route**

Create:

```
cacaoconnect-dashboard/app/api/livekit-token/route.ts
```

```ts
import { AccessToken } from "livekit-server-sdk";

export async function GET() {
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    { identity: "user-" + Date.now() }
  );

  at.addGrant({ roomJoin: true, room: "assistant" });

  return Response.json({ token: at.toJwt() });
}
```

---

# **6. Real-Time AI Agent Server (Node-Only)**

Inside:

```
cacaoconnect-dashboard/agent/agent.js
```

```js
import { RealtimeAgent } from "@livekit/agents";
import { Groq } from "groq-sdk";
import { Deepgram } from "@deepgram/sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);

const agent = new RealtimeAgent({
  url: process.env.LIVEKIT_URL,
  apiKey: process.env.LIVEKIT_API_KEY,
  apiSecret: process.env.LIVEKIT_API_SECRET,
  room: "assistant",
  participantName: "VoiceAssistant"
});

// Incoming user voice data → STT
agent.on("audio", async (msg) => {
  const { text } = await deepgram.transcription.transcribeAudio(msg.audioData);

  const llmResponse = await groq.chat.completions.create({
    model: "mixtral-8x7b-32768",
    messages: [{ role: "user", content: text }]
  });

  const reply = llmResponse.choices[0].message.content;

  const tts = await deepgram.speak.request(
    { text: reply },
    { model: process.env.ASSISTANT_VOICE }
  );

  agent.sendAudio(tts);
});

console.log("Realtime voice agent running...");
```

---

# **7. Run Agent Using PM2 (Same Project)**

Inside `cacaoconnect-dashboard`:

```
npx pm2 start agent/agent.js --name ai-voice-agent
```

Restart after changes:

```
npx pm2 restart ai-voice-agent
```

---

# **8. Import the Floating Widget Into Layout**

Add to:

```
cacaoconnect-dashboard/app/layout.tsx
```

```tsx
import VoiceAssistantWidget from "@/components/VoiceAssistantWidget";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <VoiceAssistantWidget />
      </body>
    </html>
  );
}
```

---

# **9. Deployment Plan (Local or Server)**

### Option A — PM2 on your server (recommended)

```
cd cacaoconnect-dashboard
pm2 start agent/agent.js
npm run build
npm start
```

### Option B — Docker (optional)

Create Dockerfile combining Next.js + Node agent.

---

# **10. Expected Behavior**

✔ Floating AI assistant appears in bottom-right
✔ Click to start voice conversation
✔ Audio → Deepgram STT
✔ STT → Groq LLM
✔ LLM → Deepgram TTS
✔ TTS → LiveKit → spoken reply

All **Node-only**, zero Python.

---
