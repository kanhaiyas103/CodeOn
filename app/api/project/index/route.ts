import { NextResponse } from "next/server"
import { buildProjectIndex, loadProjectIndex } from "@/lib/server/project-index"

export async function GET() {
  const existing = await loadProjectIndex()
  if (existing) {
    return NextResponse.json({
      createdAt: existing.createdAt,
      fileCount: existing.files.length,
      cached: true,
    })
  }

  const built = await buildProjectIndex()
  return NextResponse.json({
    createdAt: built.createdAt,
    fileCount: built.files.length,
    cached: false,
  })
}

export async function POST() {
  const built = await buildProjectIndex()
  return NextResponse.json({
    createdAt: built.createdAt,
    fileCount: built.files.length,
    cached: false,
  })
}
