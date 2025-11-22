# Enhanced Voice Configuration Examples

## Environment Variables for Voice Humanization

Add these to your `.env` file to customize the voice assistant characteristics:

### Basic Voice Settings
```bash
# Voice model selection (supports Deepgram Aura voices)
ASSISTANT_VOICE=aura-luna-en        # Options: aura-luna-en, aura-stella-en, aura-asteria-en, en-US-Ava

# Speech rate control (0.5 = slow, 1.0 = normal, 2.0 = fast)
ASSISTANT_VOICE_RATE=0.9           # Slightly slower for farming context

# Pitch control (0.5 = low, 1.0 = normal, 2.0 = high)
ASSISTANT_VOICE_PITCH=1.0          # Natural pitch

# Volume control (0.1 = quiet, 1.0 = normal)
ASSISTANT_VOICE_VOLUME=1.0         # Normal volume

# Default emotion style
ASSISTANT_VOICE_EMOTION=friendly   # Options: enthusiastic, concerned, neutral, friendly
```

### Advanced Voice Settings
```bash
# Deepgram voice quality settings
ASSISTANT_VOICE_STABILITY=0.8      # 0.0 = variable, 1.0 = stable
ASSISTANT_VOICE_SIMILARITY_BOOST=0.8  # 0.0 = low similarity, 1.0 = high similarity

# Natural speech features
ASSISTANT_VOICE_PAUSE_DURATION=500   # Pause duration in milliseconds
ASSISTANT_VOICE_BREATHING_ENABLED=true  # Enable breathing sounds and pauses
```

## Voice Personality Examples

### **Option 1: Professional Farming Assistant**
```bash
ASSISTANT_VOICE=en-US-Ava
ASSISTANT_VOICE_RATE=0.9
ASSISTANT_VOICE_PITCH=1.0
ASSISTANT_VOICE_EMOTION=neutral
ASSISTANT_VOICE_STABILITY=0.9
ASSISTANT_VOICE_BREATHING_ENABLED=false
```

### **Option 2: Energetic Farming Partner**
```bash
ASSISTANT_VOICE=aura-luna-en
ASSISTANT_VOICE_RATE=1.1
ASSISTANT_VOICE_PITCH=1.1
ASSISTANT_VOICE_EMOTION=enthusiastic
ASSISTANT_VOICE_STABILITY=0.7
ASSISTANT_VOICE_BREATHING_ENABLED=true
```

### **Option 3: Caring Farming Advisor**
```bash
ASSISTANT_VOICE=aura-stella-en
ASSISTANT_VOICE_RATE=0.85
ASSISTANT_VOICE_PITCH=0.95
ASSISTANT_VOICE_EMOTION=friendly
ASSISTANT_VOICE_STABILITY=0.85
ASSISTANT_VOICE_BREATHING_ENABLED=true
```

## What These Features Do

### **Enhanced Emotional Intelligence**
- Detects emotions from text with scoring system
- Adds appropriate emotion-specific speech patterns
- Includes natural hesitations and fillers
- Emphasizes important information automatically

### **Natural Speech Patterns**
- **Breathing Pauses**: Adds natural pauses after commas and periods
- **Filler Words**: Uses realistic fillers like "you know", "actually", "basically"
- **Conversation Starters**: Adds natural conversation starters
- **Strategic Emphasis**: Emphasizes numbers, grades, and important keywords

### **Dynamic Prosody Control**
- **Content-Aware Rate**: Slows down for complex sentences and numbers
- **Emotion-Based Pitch**: Adjusts pitch based on detected emotion
- **Intelligent Volume**: Modifies volume for enthusiastic vs concerned content
- **Sentence Structure Analysis**: Optimizes speech rhythm based on sentence complexity

### **Deepgram Aura Integration**
- Supports all Aura voices with proper voice settings
- Fallback to browser TTS if Deepgram is unavailable
- Real-time voice parameter adjustment
- Enhanced error handling and logging

## Testing Different Voices

### **Available Voice Models:**
- `aura-luna-en` - Warm, friendly female voice
- `aura-stella-en` - Professional, clear female voice
- `aura-asteria-en` - Natural, conversational female voice
- `en-US-Ava` - Standard browser voice (fallback)

### **Recommended for CacaoConnect:**
- **Primary**: `aura-luna-en` - Friendly and approachable for farmers
- **Alternative**: `aura-stella-en` - Professional for business contexts
- **Fallback**: `en-US-Ava` - Reliable browser-based option

## Example Voice Transformations

### **Before (Robotic):**
"You have 50kg of Grade A cocoa in inventory. Market prices are $3200 per ton."

### **After (Humanized):**
"Well! You currently have **50 kg** of **Grade A** cocoa in your inventory. * Market prices are currently at **$3,200 per ton**, which is quite good news for farmers right now. *"

### **Key Humanization Features Applied:**
1. ✅ Natural conversation starter ("Well!")
2. ✅ Strategic emphasis on numbers and grades
3. ✅ Breathing pauses (*)
4. ✅ Enthusiastic tone for good news
5. ✅ Context-appropriate vocabulary
6. ✅ Sentence structure variation

## Usage in Production

1. **Set your desired voice configuration** in `.env` file
2. **Restart the voice agent**: `npm run voice:restart`
3. **Test with voice commands**: "Check my inventory", "Market prices"
4. **Monitor logs**: `npm run voice:logs` to see voice configuration
5. **Fine-tune settings** based on user feedback

The system will automatically apply humanization features to make the AI voice sound more natural and engaging for farmers using the CacaoConnect platform.