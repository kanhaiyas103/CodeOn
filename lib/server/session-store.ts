import { promises as fs } from "node:fs"
import path from "node:path"

export type StoredMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  image?: string
  createdAt: number
}

export type StoredSession = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: StoredMessage[]
}

const STORE_DIR = path.join(process.cwd(), "temp", "session-store")

const SUPABASE_URL = process.env.SUPABASE_URL || ""
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const HAS_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)

function safeUserId(userId: string) {
  return userId.toLowerCase().replace(/[^a-z0-9-_@.]/g, "_")
}

function userStorePath(userId: string) {
  return path.join(STORE_DIR, `${safeUserId(userId)}.json`)
}

function parseSessionArray(value: unknown): StoredSession[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((session) => {
    return (
      session &&
      typeof session === "object" &&
      typeof (session as StoredSession).id === "string" &&
      typeof (session as StoredSession).title === "string" &&
      Array.isArray((session as StoredSession).messages)
    )
  })
}

async function supabaseFetch(pathname: string, init?: RequestInit) {
  const response = await fetch(`${SUPABASE_URL}${pathname}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })
  return response
}

async function readUserSessionsFromSupabase(userId: string): Promise<StoredSession[]> {
  const response = await supabaseFetch(
    `/rest/v1/user_sessions?user_id=eq.${encodeURIComponent(userId)}&select=sessions_json&limit=1`,
    {
      method: "GET",
    },
  )

  if (!response.ok) {
    throw new Error(`Supabase read failed (${response.status})`)
  }

  const payload = (await response.json()) as Array<{ sessions_json?: unknown }>
  if (!Array.isArray(payload) || payload.length === 0) {
    return []
  }

  return parseSessionArray(payload[0]?.sessions_json)
}

async function writeUserSessionsToSupabase(userId: string, sessions: StoredSession[]) {
  const response = await supabaseFetch(`/rest/v1/user_sessions`, {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify([
      {
        user_id: userId,
        sessions_json: sessions,
        updated_at: new Date().toISOString(),
      },
    ]),
  })

  if (!response.ok) {
    throw new Error(`Supabase write failed (${response.status})`)
  }
}

async function readUserSessionsFromFile(userId: string): Promise<StoredSession[]> {
  const filePath = userStorePath(userId)
  try {
    const raw = await fs.readFile(filePath, "utf-8")
    const parsed = JSON.parse(raw) as unknown
    return parseSessionArray(parsed)
  } catch {
    return []
  }
}

async function writeUserSessionsToFile(userId: string, sessions: StoredSession[]) {
  await fs.mkdir(STORE_DIR, { recursive: true })
  const filePath = userStorePath(userId)
  await fs.writeFile(filePath, JSON.stringify(sessions, null, 2), "utf-8")
}

export function getSessionStoreMode() {
  return HAS_SUPABASE ? "supabase" : "local"
}

export async function readUserSessions(userId: string): Promise<StoredSession[]> {
  if (HAS_SUPABASE) {
    try {
      return await readUserSessionsFromSupabase(userId)
    } catch (error) {
      console.warn("Falling back to local session store after Supabase read failure:", error)
    }
  }

  return readUserSessionsFromFile(userId)
}

export async function writeUserSessions(userId: string, sessions: StoredSession[]) {
  if (HAS_SUPABASE) {
    try {
      await writeUserSessionsToSupabase(userId, sessions)
      return
    } catch (error) {
      console.warn("Falling back to local session store after Supabase write failure:", error)
    }
  }

  await writeUserSessionsToFile(userId, sessions)
}
