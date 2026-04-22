import { NextRequest, NextResponse } from "next/server"
import { createGroqCompletion, HttpError, type GroqMessage } from "@/lib/groq"

type InputMessage = {
  role: "user" | "assistant" | "system"
  content: string
  image?: string
}

const DEFAULT_TEXT_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant"
const DEFAULT_VISION_MODEL = process.env.GROQ_VISION_MODEL || "llama-3.2-11b-vision-preview"

function isValidMessage(value: unknown): value is InputMessage {
  if (!value || typeof value !== "object") {
    return false
  }

  const msg = value as Record<string, unknown>
  const validRole = msg.role === "user" || msg.role === "assistant" || msg.role === "system"

  return validRole && typeof msg.content === "string" && msg.content.trim().length > 0
}

function toGroqMessage(message: InputMessage): GroqMessage {
  if (!message.image) {
    return {
      role: message.role,
      content: message.content,
    }
  }

  return {
    role: message.role,
    content: [
      {
        type: "text",
        text: message.content,
      },
      {
        type: "image_url",
        image_url: {
          url: message.image,
        },
      },
    ],
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const rawMessages = body?.messages

    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return NextResponse.json(
        { error: "Request must include a non-empty messages array." },
        { status: 400 },
      )
    }

    const messages = rawMessages.filter(isValidMessage).slice(-24)
    if (messages.length === 0) {
      return NextResponse.json(
        { error: "No valid chat messages were provided." },
        { status: 400 },
      )
    }

    const hasImage = messages.some((msg) => typeof msg.image === "string" && msg.image.startsWith("data:image/"))

    const aiText = await createGroqCompletion({
      model: hasImage ? DEFAULT_VISION_MODEL : DEFAULT_TEXT_MODEL,
      messages: messages.map(toGroqMessage),
      temperature: 0.4,
      maxTokens: 1000,
    })

    return NextResponse.json({ response: aiText })
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error("Chat API failure:", error)
    return NextResponse.json({ error: "Unexpected server error in chat API." }, { status: 500 })
  }
}
