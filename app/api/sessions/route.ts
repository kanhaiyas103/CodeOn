import { NextRequest, NextResponse } from "next/server"
import { getSessionStoreMode, readUserSessions, writeUserSessions, type StoredSession } from "@/lib/server/session-store"

function normalizeUserId(value: unknown) {
  if (typeof value !== "string") {
    return ""
  }
  return value.trim().toLowerCase()
}

function isValidSession(value: unknown): value is StoredSession {
  if (!value || typeof value !== "object") {
    return false
  }

  const session = value as Record<string, unknown>
  return (
    typeof session.id === "string" &&
    typeof session.title === "string" &&
    typeof session.createdAt === "number" &&
    typeof session.updatedAt === "number" &&
    Array.isArray(session.messages)
  )
}

export async function GET(req: NextRequest) {
  const userId = normalizeUserId(req.nextUrl.searchParams.get("userId"))
  if (!userId) {
    return NextResponse.json({ error: "userId query parameter is required." }, { status: 400 })
  }

  const sessions = await readUserSessions(userId)
  return NextResponse.json({ sessions, mode: getSessionStoreMode() })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const userId = normalizeUserId(body?.userId)
    const sessions = body?.sessions

    if (!userId) {
      return NextResponse.json({ error: "userId is required." }, { status: 400 })
    }

    if (!Array.isArray(sessions) || !sessions.every(isValidSession)) {
      return NextResponse.json({ error: "sessions must be a valid session array." }, { status: 400 })
    }

    const cleanedSessions = [...sessions]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 100)
      .map((session) => ({
        ...session,
        messages: session.messages.slice(-80),
      }))

    await writeUserSessions(userId, cleanedSessions)
    return NextResponse.json({ ok: true, count: cleanedSessions.length, mode: getSessionStoreMode() })
  } catch {
    return NextResponse.json({ error: "Unable to sync sessions." }, { status: 500 })
  }
}
