import { NextRequest, NextResponse } from "next/server"
import { buildProjectIndex, loadProjectIndex, searchProjectIndex } from "@/lib/server/project-index"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const query = typeof body?.query === "string" ? body.query.trim() : ""

    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 })
    }

    const limit = typeof body?.limit === "number" ? Math.min(Math.max(body.limit, 1), 8) : 4
    let index = await loadProjectIndex()
    if (!index) {
      index = await buildProjectIndex()
    }

    const results = searchProjectIndex(index, query, limit).map((file) => ({
      path: file.path,
      snippet: file.summary,
    }))

    return NextResponse.json({ results, indexedAt: index.createdAt })
  } catch {
    return NextResponse.json({ error: "Unable to query project index" }, { status: 500 })
  }
}
