import { NextRequest, NextResponse } from "next/server"
import { createGroqCompletion, HttpError, stripMarkdownCodeFences } from "@/lib/groq"

const BUILD_MODEL = process.env.GROQ_BUILD_MODEL || process.env.GROQ_MODEL || "llama-3.1-8b-instant"

const SYSTEM_PROMPT = `You are a senior frontend engineer.
Generate a complete single-file HTML document with embedded CSS and optional vanilla JavaScript.
Requirements:
- Return only valid HTML (no markdown, no backticks).
- The design must be modern, responsive, and production-ready.
- Use semantic structure and accessible labels.
- Do not include external libraries or CDN links.
- Keep the output concise but visually polished.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : ""

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 })
    }

    if (prompt.length > 2000) {
      return NextResponse.json({ error: "Prompt is too long. Keep it under 2000 characters." }, { status: 400 })
    }

    const rawHtml = await createGroqCompletion({
      model: BUILD_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
      maxTokens: 1800,
    })

    const html = stripMarkdownCodeFences(rawHtml)

    if (!html.toLowerCase().includes("<html")) {
      return NextResponse.json({ error: "Model did not return a full HTML document." }, { status: 502 })
    }

    return NextResponse.json({ html })
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error("Build API failure:", error)
    return NextResponse.json({ error: "Unexpected server error in build API." }, { status: 500 })
  }
}
