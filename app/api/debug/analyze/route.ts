import { NextRequest, NextResponse } from "next/server"
import { createGroqCompletion, HttpError, stripMarkdownCodeFences } from "@/lib/groq"

const DEBUG_MODEL = process.env.GROQ_DEBUG_MODEL || process.env.GROQ_MODEL || "llama-3.1-8b-instant"

const SYSTEM_PROMPT = `You are a debugging expert.
Given runtime errors and source code, produce practical fixes.
Return JSON with keys: summary (string), rootCause (string), fixes (array of strings), patchedCode (string).
patchedCode should contain full corrected code when possible, otherwise an empty string.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const errorText = typeof body?.error === "string" ? body.error.trim() : ""
    const code = typeof body?.code === "string" ? body.code : ""
    const language = typeof body?.language === "string" ? body.language.toLowerCase() : "javascript"

    if (!errorText) {
      return NextResponse.json({ error: "error text is required" }, { status: 400 })
    }

    const prompt = [
      `Language: ${language}`,
      `Error:\n${errorText}`,
      code ? `\nCode:\n${code}` : "",
      "\nReturn valid JSON only.",
    ].join("\n")

    const raw = await createGroqCompletion({
      model: DEBUG_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      maxTokens: 1200,
    })

    let parsed: {
      summary?: string
      rootCause?: string
      fixes?: string[]
      patchedCode?: string
    } = {}

    try {
      parsed = JSON.parse(stripMarkdownCodeFences(raw))
    } catch {
      parsed = {
        summary: "Generated debug guidance.",
        rootCause: raw,
        fixes: [],
        patchedCode: "",
      }
    }

    return NextResponse.json({
      summary: parsed.summary || "Potential issue found.",
      rootCause: parsed.rootCause || "No root-cause details returned.",
      fixes: Array.isArray(parsed.fixes) ? parsed.fixes : [],
      patchedCode: typeof parsed.patchedCode === "string" ? parsed.patchedCode : "",
    })
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Unable to analyze debug issue." }, { status: 500 })
  }
}
