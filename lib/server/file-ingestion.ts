import { promises as fs } from "node:fs"
import path from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)
const TMP_ROOT = path.join(process.cwd(), "temp", "uploads")
const MAX_TEXT = 12000
const TEXT_FILE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".txt",
  ".css",
  ".html",
  ".yml",
  ".yaml",
  ".env",
  ".py",
  ".java",
  ".cpp",
  ".c",
  ".go",
  ".rs",
  ".sh",
])

function normalizeWhitespace(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trim()
}

export function extractPdfText(buffer: Buffer) {
  const latinText = buffer.toString("latin1")
  const chunks = latinText.match(/\(([^)]{3,500})\)/g) || []
  const cleaned = chunks
    .map((chunk) => chunk.slice(1, -1))
    .join(" ")
    .replace(/\\[rn]/g, " ")
    .replace(/[^\x20-\x7E]+/g, " ")

  const normalized = normalizeWhitespace(cleaned)
  return normalized.length > MAX_TEXT ? `${normalized.slice(0, MAX_TEXT)}\n...[truncated]` : normalized
}

export async function extractDocxText(buffer: Buffer, originalName: string) {
  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const baseDir = path.join(TMP_ROOT, uploadId)
  const sourceFile = path.join(baseDir, originalName)
  const extractDir = path.join(baseDir, "unzipped")

  await fs.mkdir(baseDir, { recursive: true })
  await fs.writeFile(sourceFile, buffer)

  await execFileAsync("powershell", [
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    "Expand-Archive -LiteralPath $args[0] -DestinationPath $args[1] -Force",
    sourceFile,
    extractDir,
  ])

  const docXmlPath = path.join(extractDir, "word", "document.xml")
  const xml = await fs.readFile(docXmlPath, "utf-8")
  const plain = xml
    .replace(/<w:p[^>]*>/g, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')

  const normalized = normalizeWhitespace(plain)
  return normalized.length > MAX_TEXT ? `${normalized.slice(0, MAX_TEXT)}\n...[truncated]` : normalized
}

async function walkFiles(root: string, current: string, results: string[]) {
  const entries = await fs.readdir(current, { withFileTypes: true })
  for (const entry of entries) {
    const absolute = path.join(current, entry.name)
    if (entry.isDirectory()) {
      await walkFiles(root, absolute, results)
      continue
    }
    results.push(path.relative(root, absolute).replace(/\\/g, "/"))
  }
}

export async function parseProjectZip(buffer: Buffer, originalName: string) {
  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const baseDir = path.join(TMP_ROOT, uploadId)
  const sourceFile = path.join(baseDir, originalName)
  const extractDir = path.join(baseDir, "project")

  await fs.mkdir(baseDir, { recursive: true })
  await fs.writeFile(sourceFile, buffer)

  await execFileAsync("powershell", [
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    "Expand-Archive -LiteralPath $args[0] -DestinationPath $args[1] -Force",
    sourceFile,
    extractDir,
  ])

  const relativeFiles: string[] = []
  await walkFiles(extractDir, extractDir, relativeFiles)

  const sortedFiles = relativeFiles.sort((a, b) => a.localeCompare(b)).slice(0, 200)
  const textSnippets: string[] = []
  for (const relPath of sortedFiles) {
    const extension = path.extname(relPath).toLowerCase()
    if (!TEXT_FILE_EXTENSIONS.has(extension)) {
      continue
    }

    const absolute = path.join(extractDir, relPath)
    try {
      const raw = await fs.readFile(absolute, "utf-8")
      const normalized = normalizeWhitespace(raw)
      if (!normalized) {
        continue
      }
      textSnippets.push(`File: ${relPath}\n${normalized.slice(0, 900)}`)
      if (textSnippets.join("\n\n").length > MAX_TEXT) {
        break
      }
    } catch {
      // Skip unreadable files
    }
  }

  return {
    uploadId,
    extractedPath: extractDir,
    files: sortedFiles,
    summary: textSnippets.join("\n\n---\n\n").slice(0, MAX_TEXT),
  }
}
