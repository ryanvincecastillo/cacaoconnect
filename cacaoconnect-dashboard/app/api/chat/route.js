import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { prompt, messages } = body;

    const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      // Fallback response for demo purposes
      return NextResponse.json({ 
        response: "I'm your cocoa farming assistant. I can help you with inventory management, order tracking, weather forecasts, market prices, and quality assessments. What would you like to know?",
        message: "I'm your cocoa farming assistant. I can help you with inventory management, order tracking, weather forecasts, market prices, and quality assessments. What would you like to know?"
      });
    }

    // Handle both old prompt format and new messages format
    const userContent = prompt || (messages && messages[0] && messages[0].content);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful cocoa farming assistant. Provide helpful, practical advice for farmers."
          },
          {
            role: "user",
            content: userContent
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error("OpenAI API Error:", data.error);
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    // Return the content directly without JSON parsing for better flexibility
    const content = data.choices[0].message.content;

    return NextResponse.json({ 
      response: content,
      message: content 
    });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
