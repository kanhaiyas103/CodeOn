import { NextResponse } from "next/server"
import { getSessionStoreMode } from "@/lib/server/session-store"

export async function GET() {
  const mode = getSessionStoreMode()
  const hasSupabaseUrl = Boolean(process.env.SUPABASE_URL)
  const hasSupabaseServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

  return NextResponse.json({
    persistenceMode: mode,
    supabaseConfigured: hasSupabaseUrl && hasSupabaseServiceRoleKey,
    hasSupabaseUrl,
    hasSupabaseServiceRoleKey,
  })
}
