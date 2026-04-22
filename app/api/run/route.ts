import { NextRequest, NextResponse } from "next/server"
import { runJavaScriptSandbox, runPythonSandbox } from "@/lib/server/run-sandbox"

export const runtime = "nodejs"

export type RunRequest = {
  code?: string
  language?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RunRequest
    const code = typeof body.code === "string" ? body.code.trim() : ""
    const language = typeof body.language === "string" ? body.language.toLowerCase() : "javascript"

    if (!code) {
      return NextResponse.json({ error: "Code is required." }, { status: 400 })
    }

    if (!["js", "javascript", "ts", "typescript", "py", "python"].includes(language)) {
      return NextResponse.json(
        { error: "Supported runtimes: JavaScript/TypeScript/Python." },
        { status: 400 },
      )
    }

    if (code.length > 12000) {
      return NextResponse.json({ error: "Code is too large for sandbox execution." }, { status: 400 })
    }

    if (["py", "python"].includes(language)) {
      return NextResponse.json(await runPythonSandbox(code, 3000))
    }

    return NextResponse.json(runJavaScriptSandbox(code, 2500))
  } catch (error) {
    console.error("Run API failure:", error)
    return NextResponse.json(
      {
        error: "Failed to execute code.",
        success: false,
        stdout: [],
        stderr: ["Server error while executing code."],
        durationMs: 0,
      },
      { status: 500 },
    )
  }
}
