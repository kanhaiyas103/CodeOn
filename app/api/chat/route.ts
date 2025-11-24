import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    const formattedMessages = messages.map((msg: any) => {
      // ✅ If message has image (vision input)
      if (msg.image) {
        return {
          role: msg.role,
          content: [
            { type: "text", text: msg.content || "Analyze this image" },
            { type: "image_url", image_url: { url: msg.image } }
          ]
        }
      }

      // ✅ Normal text message
      return {
        role: msg.role,
        content: msg.content
      }
    })

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o", // ✅ Vision capable model
        messages: formattedMessages,
        max_tokens: 800
      })
    })

    const data = await response.json()

    return NextResponse.json({
      response: data.choices[0].message.content
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ response: "AI error occurred" }, { status: 500 })
  }
}
