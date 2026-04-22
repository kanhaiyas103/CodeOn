import { promises as fs } from "node:fs"
import path from "node:path"
import { createGroqCompletion, stripMarkdownCodeFences } from "@/lib/groq"

export type GeneratedProjectFile = {
  path: string
  content: string
}

export type GeneratedProject = {
  projectName: string
  summary: string
  files: GeneratedProjectFile[]
  outputDir: string
}

const GENERATOR_MODEL = process.env.GROQ_PROJECT_MODEL || process.env.GROQ_MODEL || "llama-3.1-8b-instant"
const OUTPUT_ROOT = path.join(process.cwd(), "temp", "generated-projects")

const SYSTEM_PROMPT = `You are a principal software architect and implementation engineer.
Generate an MVP project scaffold based on the user brief.
Output strict JSON object with keys:
- projectName (string)
- summary (string)
- files (array of objects with path and content)
Constraints:
- include at most 14 files
- use practical Next.js + TypeScript defaults when web app is requested
- never include binary data
- file paths must be relative, safe, and contain no .. segments`

function sanitizeRelativePath(filePath: string) {
  const cleaned = filePath.replace(/\\/g, "/").replace(/^\/+/, "")
  if (!cleaned || cleaned.includes("..")) {
    return null
  }
  return cleaned
}

export async function generateProjectFromBrief(brief: string, context?: string): Promise<GeneratedProject> {
  const prompt = [brief, context ? `\nContext:\n${context}` : "", "\nReturn JSON only."].join("\n")

  const raw = await createGroqCompletion({
    model: GENERATOR_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    temperature: 0.35,
    maxTokens: 2200,
  })

  const jsonText = stripMarkdownCodeFences(raw)
  const parsed = JSON.parse(jsonText) as {
    projectName?: string
    summary?: string
    files?: Array<{ path?: string; content?: string }>
  }

  const normalizedFiles: GeneratedProjectFile[] = []
  for (const file of parsed.files || []) {
    const safePath = sanitizeRelativePath(file.path || "")
    if (!safePath) {
      continue
    }
    normalizedFiles.push({
      path: safePath,
      content: typeof file.content === "string" ? file.content : "",
    })
    if (normalizedFiles.length >= 20) {
      break
    }
  }

  const projectName = parsed.projectName?.trim() || "generated-mvp"
  const safeProjectSlug = projectName.toLowerCase().replace(/[^a-z0-9-_]+/g, "-").replace(/-+/g, "-")
  const outputDir = path.join(OUTPUT_ROOT, `${Date.now()}-${safeProjectSlug || "mvp"}`)

  await fs.mkdir(outputDir, { recursive: true })

  for (const file of normalizedFiles) {
    const targetPath = path.join(outputDir, file.path)
    await fs.mkdir(path.dirname(targetPath), { recursive: true })
    await fs.writeFile(targetPath, file.content, "utf-8")
  }

  return {
    projectName,
    summary: parsed.summary || "Generated MVP scaffold.",
    files: normalizedFiles,
    outputDir,
  }
}
