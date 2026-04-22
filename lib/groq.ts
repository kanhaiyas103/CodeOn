export type GroqMessage = {
  role: "system" | "user" | "assistant"
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >
}

type GroqCompletionOptions = {
  messages: GroqMessage[]
  model: string
  temperature?: number
  maxTokens?: number
}

export class HttpError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

export async function createGroqCompletion({
  messages,
  model,
  temperature = 0.3,
  maxTokens = 1200,
}: GroqCompletionOptions) {
  const groqApiKey = process.env.GROQ_API_KEY
  if (!groqApiKey) {
    throw new HttpError("Missing GROQ_API_KEY in environment configuration.", 500)
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqApiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new HttpError(data?.error?.message || "Groq request failed.", response.status)
  }

  const text = data?.choices?.[0]?.message?.content
  if (!text || typeof text !== "string") {
    throw new HttpError("AI returned an empty response.", 502)
  }

  return text
}

export function stripMarkdownCodeFences(input: string) {
  const trimmed = input.trim()
  if (!trimmed.startsWith("```") || !trimmed.endsWith("```")) {
    return trimmed
  }

  const firstNewline = trimmed.indexOf("\n")
  if (firstNewline === -1) {
    return trimmed
  }

  return trimmed.slice(firstNewline + 1, -3).trim()
}
