import { NextRequest, NextResponse } from "next/server"
import { createGroqCompletion, HttpError, stripMarkdownCodeFences } from "@/lib/groq"
import { runJavaScriptSandbox, runPythonSandbox } from "@/lib/server/run-sandbox"

export const runtime = "nodejs"

type AutoFixRequest = {
  code?: string
  language?: string
  maxIterations?: number
}

type IterationResult = {
  iteration: number
  success: boolean
  stdout: string[]
  stderr: string[]
  durationMs: number
  patchedCode?: string
  reason?: string
}

const DEBUG_MODEL = process.env.GROQ_DEBUG_MODEL || process.env.GROQ_MODEL || "llama-3.1-8b-instant"

function getSystemPrompt(language: string) {
  if (["py", "python"].includes(language)) {
    return `You are a senior Python debugging engineer.
Fix the provided Python code so it executes without runtime errors.
Return only corrected Python code. No markdown.`
  }

  return `You are a senior JavaScript debugging engineer.
Fix the provided JavaScript code so it executes without runtime errors.
Return only corrected JavaScript code. No markdown.`
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AutoFixRequest
    const language = typeof body.language === "string" ? body.language.toLowerCase() : "javascript"
    const maxIterations =
      typeof body.maxIterations === "number" ? Math.min(Math.max(body.maxIterations, 1), 4) : 3

    if (!["js", "javascript", "ts", "typescript", "py", "python"].includes(language)) {
      return NextResponse.json({ error: "Supported runtimes: JavaScript/TypeScript/Python." }, { status: 400 })
    }

    let workingCode = typeof body.code === "string" ? body.code.trim() : ""
    if (!workingCode) {
      return NextResponse.json({ error: "Code is required." }, { status: 400 })
    }

    const iterations: IterationResult[] = []

    for (let index = 0; index < maxIterations; index += 1) {
      const run = ["py", "python"].includes(language)
        ? await runPythonSandbox(workingCode, 3000)
        : runJavaScriptSandbox(workingCode, 2500)
      iterations.push({
        iteration: index + 1,
        success: run.success,
        stdout: run.stdout,
        stderr: run.stderr,
        durationMs: run.durationMs,
      })

      if (run.success) {
        return NextResponse.json({
          success: true,
          fixedCode: workingCode,
          iterations,
        })
      }

      const errorText = run.stderr.join("\n")
      const runtimeLabel = ["py", "python"].includes(language) ? "Python" : "JavaScript"
      const fixPrompt = [
        `Current runtime error:\n${errorText}`,
        "\nCurrent code:",
        workingCode,
        `\nReturn only corrected ${runtimeLabel} code.`,
      ].join("\n")

      const candidate = await createGroqCompletion({
        model: DEBUG_MODEL,
        messages: [
          { role: "system", content: getSystemPrompt(language) },
          { role: "user", content: fixPrompt },
        ],
        temperature: 0.1,
        maxTokens: 1400,
      })

      const patchedCode = stripMarkdownCodeFences(candidate)
      if (!patchedCode || patchedCode.length > 24000) {
        iterations[iterations.length - 1].reason = "Model returned invalid patched code"
        break
      }

      workingCode = patchedCode
      iterations[iterations.length - 1].patchedCode = patchedCode
    }

    return NextResponse.json({
      success: false,
      fixedCode: workingCode,
      iterations,
      error: "Unable to fully auto-fix within iteration limit.",
    })
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error("Run autofix API failure:", error)
    return NextResponse.json({ error: "Failed to auto-fix code." }, { status: 500 })
  }
}
