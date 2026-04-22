import { NextRequest, NextResponse } from "next/server"
import { extractDocxText, extractPdfText, parseProjectZip } from "@/lib/server/file-ingestion"

export const runtime = "nodejs"

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp"])
const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "json",
  "js",
  "jsx",
  "ts",
  "tsx",
  "py",
  "java",
  "cpp",
  "c",
  "go",
  "rs",
  "html",
  "css",
  "yml",
  "yaml",
  "env",
])

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ status: "error", message: "No file uploaded" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = (file.name.split(".").pop() || "").toLowerCase()

    if (IMAGE_EXTENSIONS.has(ext)) {
      const base64 = buffer.toString("base64")
      const mime = file.type || `image/${ext}`

      return NextResponse.json({
        status: "image",
        name: file.name,
        base64: `data:${mime};base64,${base64}`,
      })
    }

    if (TEXT_EXTENSIONS.has(ext)) {
      const content = buffer.toString("utf-8")
      return NextResponse.json({
        status: "text",
        name: file.name,
        content,
      })
    }

    if (ext === "pdf") {
      const content = extractPdfText(buffer)
      return NextResponse.json({
        status: "document",
        name: file.name,
        format: "pdf",
        content: content || "No extractable PDF text found.",
      })
    }

    if (ext === "docx") {
      const content = await extractDocxText(buffer, file.name)
      return NextResponse.json({
        status: "document",
        name: file.name,
        format: "docx",
        content: content || "No extractable DOCX text found.",
      })
    }

    if (ext === "zip") {
      const project = await parseProjectZip(buffer, file.name)
      return NextResponse.json({
        status: "project_bundle",
        name: file.name,
        uploadId: project.uploadId,
        extractedPath: project.extractedPath,
        files: project.files,
        summary: project.summary,
      })
    }

    return NextResponse.json(
      {
        status: "unsupported",
        name: file.name,
        message: "Unsupported file type. Upload image, code/text, pdf, docx, or zip.",
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("File upload parsing error:", error)
    return NextResponse.json({ status: "error", message: "Failed to parse uploaded file." }, { status: 500 })
  }
}
