import { promises as fs } from "node:fs"
import path from "node:path"

export type IndexedFile = {
  path: string
  summary: string
  content: string
  updatedAt: number
}

export type ProjectIndex = {
  createdAt: number
  files: IndexedFile[]
}

const IGNORE_DIRS = new Set(["node_modules", ".next", ".git", "dist", "build", "temp"])
const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".css",
  ".html",
  ".yml",
  ".yaml",
  ".env",
  ".txt",
])
const MAX_FILE_SIZE = 128 * 1024
const MAX_FILE_CONTENT = 5000
const INDEX_FILE = path.join(process.cwd(), "temp", "project-index.json")

async function walkFiles(root: string, current: string, results: IndexedFile[]) {
  const entries = await fs.readdir(current, { withFileTypes: true })

  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) {
      continue
    }

    const absolutePath = path.join(current, entry.name)
    if (entry.isDirectory()) {
      await walkFiles(root, absolutePath, results)
      continue
    }

    const extension = path.extname(entry.name).toLowerCase()
    if (!TEXT_EXTENSIONS.has(extension) && entry.name !== "README") {
      continue
    }

    const stats = await fs.stat(absolutePath)
    if (stats.size > MAX_FILE_SIZE) {
      continue
    }

    const content = await fs.readFile(absolutePath, "utf-8")
    if (!content.trim()) {
      continue
    }

    const relativePath = path.relative(root, absolutePath).replace(/\\/g, "/")
    const normalized = content.replace(/\r\n/g, "\n").trim()
    const compact = normalized.length > MAX_FILE_CONTENT ? normalized.slice(0, MAX_FILE_CONTENT) : normalized

    results.push({
      path: relativePath,
      content: compact,
      summary: compact.split("\n").slice(0, 12).join("\n"),
      updatedAt: stats.mtimeMs,
    })
  }
}

export async function buildProjectIndex() {
  const root = process.cwd()
  const files: IndexedFile[] = []
  await walkFiles(root, root, files)

  const index: ProjectIndex = {
    createdAt: Date.now(),
    files,
  }

  await fs.mkdir(path.dirname(INDEX_FILE), { recursive: true })
  await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2), "utf-8")
  return index
}

export async function loadProjectIndex() {
  try {
    const raw = await fs.readFile(INDEX_FILE, "utf-8")
    const parsed = JSON.parse(raw) as ProjectIndex
    if (!Array.isArray(parsed?.files)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function searchProjectIndex(index: ProjectIndex, query: string, limit = 4) {
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter((token) => token.length > 1)

  if (tokens.length === 0) {
    return []
  }

  const scored = index.files
    .map((file) => {
      const haystack = `${file.path}\n${file.content}`.toLowerCase()
      const score = tokens.reduce((total, token) => {
        if (!haystack.includes(token)) {
          return total
        }
        const inPath = file.path.toLowerCase().includes(token) ? 3 : 1
        return total + inPath
      }, 0)
      return { file, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.file.updatedAt - a.file.updatedAt)
    .slice(0, limit)
    .map((entry) => entry.file)

  return scored
}
