import { NextRequest, NextResponse } from "next/server"
import { HttpError } from "@/lib/groq"
import { generateProjectFromBrief } from "@/lib/server/project-generator"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const brief = typeof body?.brief === "string" ? body.brief.trim() : ""
    const context = typeof body?.context === "string" ? body.context.trim() : ""

    if (!brief) {
      return NextResponse.json({ error: "brief is required" }, { status: 400 })
    }

    const generated = await generateProjectFromBrief(brief, context)

    return NextResponse.json({
      projectName: generated.projectName,
      summary: generated.summary,
      outputDir: generated.outputDir,
      files: generated.files.map((file) => file.path),
    })
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Model did not return valid project JSON. Try a more specific brief." },
        { status: 502 },
      )
    }

    console.error("Project generation failure:", error)
    return NextResponse.json({ error: "Failed to generate project scaffold." }, { status: 500 })
  }
}
