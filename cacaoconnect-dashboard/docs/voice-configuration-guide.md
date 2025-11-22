# Voice Configuration Guide for CacaoConnect

## 🎯 **Simplified Voice Variables (No More Duplicates!)**

Here's the clean, single set of voice configuration variables you need:

### **Required Variables**
```bash
# Choose your voice model (pick ONE):
ASSISTANT_VOICE=aura-luna-en          # Warm, friendly (recommended for Filipino farmers)
# OR
ASSISTANT_VOICE=aura-stella-en        # Professional, clear voice
# OR
ASSISTANT_VOICE=aura-asteria-en       # Natural, conversational
# OR
ASSISTANT_VOICE=en-US-Ava             # Standard browser fallback
```

### **Optional Voice Fine-Tuning**
```bash
# Voice Speed (0.5 = very slow, 1.0 = normal, 2.0 = very fast)
ASSISTANT_VOICE_RATE=0.85

# Voice Pitch (0.5 = very low, 1.0 = normal, 2.0 = very high)
ASSISTANT_VOICE_PITCH=1.05

# Voice Volume (0.1 = very quiet, 1.0 = normal)
ASSISTANT_VOICE_VOLUME=1.0

# Voice Personality: enthusiastic, concerned, neutral, friendly
ASSISTANT_VOICE_EMOTION=friendly

# Advanced Quality (keep defaults unless you're fine-tuning)
ASSISTANT_VOICE_STABILITY=0.75         # Voice consistency
ASSISTANT_VOICE_SIMILARITY_BOOST=0.85 # Voice clarity

# Natural Speech Features
ASSISTANT_VOICE_PAUSE_DURATION=600     # Pause length (ms)
ASSISTANT_VOICE_BREATHING_ENABLED=true # Natural breathing sounds
```

## 🔧 **What Was Removed (The Duplicates)**

### **BEFORE (Confusing Duplicates):**
```bash
# ❌ DUPLICATE - DON'T USE THESE ANYMORE
TTS_PROVIDER=deepgram          # Same as ASSISTANT_VOICE
TTS_MODEL=aura-luna-en         # Same as ASSISTANT_VOICE
TTS_EMOTIONAL_RESPONSE=true    # Same as ASSISTANT_VOICE_EMOTION
```

### **AFTER (Clean & Simple):**
```bash
# ✅ USE THESE INSTEAD
ASSISTANT_VOICE=aura-luna-en
ASSISTANT_VOICE_EMOTION=friendly
# (Other variables above...)
```

## 🎙️ **Voice Model Recommendations**

### **For Filipino Farmers (Recommended):**
```bash
ASSISTANT_VOICE=aura-luna-en
ASSISTANT_VOICE_RATE=0.85
ASSISTANT_VOICE_PITCH=1.05
ASSISTANT_VOICE_EMOTION=friendly
```

### **For Professional Business:**
```bash
ASSISTANT_VOICE=aura-stella-en
ASSISTANT_VOICE_RATE=0.9
ASSISTANT_VOICE_PITCH=1.0
ASSISTANT_VOICE_EMOTION=neutral
```

### **For Casual/Friendly:**
```bash
ASSISTANT_VOICE=aura-asteria-en
ASSISTANT_VOICE_RATE=0.95
ASSISTANT_VOICE_PITCH=1.0
ASSISTANT_VOICE_EMOTION=enthusiastic
```

## 🚀 **Quick Setup**

### **Step 1:** Clean your `.env` file
```bash
# REMOVE these duplicate lines:
TTS_PROVIDER=deepgram
TTS_MODEL=aura-luna-en
TTS_EMOTIONAL_RESPONSE=true

# KEEP only these:
ASSISTANT_VOICE=aura-luna-en
ASSISTANT_VOICE_RATE=0.85
ASSISTANT_VOICE_PITCH=1.05
ASSISTANT_VOICE_EMOTION=friendly
```

### **Step 2:** Restart voice agent
```bash
npm run voice:restart
```

### **Step 3:** Test your voice
```bash
npm run voice:logs
# Say: "Check my inventory"
```

## 📊 **Variable Ranges Explained**

| Variable | Range | Effect | Recommended |
|----------|-------|--------|-------------|
| `RATE` | 0.5-2.0 | Speech speed | 0.85 (slower for clarity) |
| `PITCH` | 0.5-2.0 | Voice height | 1.05 (slightly higher, friendly) |
| `VOLUME` | 0.1-1.0 | Loudness | 1.0 (normal) |
| `STABILITY` | 0.0-1.0 | Voice consistency | 0.75 (natural variation) |
| `SIMILARITY_BOOST` | 0.0-1.0 | Voice clarity | 0.85 (balanced) |
| `PAUSE_DURATION` | 100-1000ms | Pause length | 600ms (natural) |

## 🎯 **Troubleshooting**

### **If voice sounds robotic:**
```bash
ASSISTANT_VOICE_RATE=0.75
ASSISTANT_VOICE_BREATHING_ENABLED=true
ASSISTANT_VOICE_PAUSE_DURATION=800
```

### **If voice speaks too fast:**
```bash
ASSISTANT_VOICE_RATE=0.7
```

### **If voice is too quiet:**
```bash
ASSISTANT_VOICE_VOLUME=1.2
```

### **If voice sounds unnatural:**
```bash
ASSISTANT_VOICE_STABILITY=0.6
ASSISTANT_VOICE_SIMILARITY_BOOST=0.9
```

## ✅ **Minimal Working Configuration**

If you want the simplest setup, just use these 4 variables:

```bash
ASSISTANT_VOICE=aura-luna-en
ASSISTANT_VOICE_RATE=0.85
ASSISTANT_VOICE_PITCH=1.05
ASSISTANT_VOICE_EMOTION=friendly
```

That's it! No more confusion with duplicate variables. 🎉