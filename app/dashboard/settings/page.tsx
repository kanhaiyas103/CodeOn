"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const USER_ID_KEY = "codeon.user.id"

export default function SettingsPage() {
  const [userId, setUserId] = useState("")
  const [savedUserId, setSavedUserId] = useState("")
  const [statusText, setStatusText] = useState("")
  const [isIndexing, setIsIndexing] = useState(false)
  const [persistenceMode, setPersistenceMode] = useState<"local" | "supabase" | "unknown">("unknown")
  const [supabaseConfigured, setSupabaseConfigured] = useState(false)

  useEffect(() => {
    const existing = localStorage.getItem(USER_ID_KEY) || ""
    setUserId(existing)
    setSavedUserId(existing)

    const loadStatus = async () => {
      try {
        const response = await fetch("/api/system/status")
        const data = await response.json()
        if (response.ok) {
          setPersistenceMode(data?.persistenceMode === "supabase" ? "supabase" : "local")
          setSupabaseConfigured(Boolean(data?.supabaseConfigured))
        }
      } catch {
        setPersistenceMode("unknown")
      }
    }

    void loadStatus()
  }, [])

  const saveIdentity = () => {
    const normalized = userId.trim().toLowerCase()
    localStorage.setItem(USER_ID_KEY, normalized)
    setSavedUserId(normalized)
    setStatusText(normalized ? "Cloud sync identity saved." : "Cloud sync identity cleared.")
  }

  const rebuildIndex = async () => {
    try {
      setIsIndexing(true)
      setStatusText("")
      const response = await fetch("/api/project/index", { method: "POST" })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || "Failed to build project index")
      }
      setStatusText(`Project index ready (${data.fileCount} files).`)
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to build project index")
    } finally {
      setIsIndexing(false)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>

        <Card className="p-6 bg-card border-border space-y-4">
          <h3 className="text-lg font-semibold">Cloud Sync Identity</h3>
          <p className="text-sm text-muted-foreground">
            Use any stable ID (email/username). Chat sessions sync to backend storage under this ID.
          </p>

          <input
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="you@example.com"
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm"
          />

          <div className="flex gap-2">
            <Button onClick={saveIdentity}>Save Identity</Button>
            <Button
              variant="outline"
              onClick={() => {
                setUserId("")
                localStorage.removeItem(USER_ID_KEY)
                setSavedUserId("")
                setStatusText("Cloud sync identity cleared.")
              }}
            >
              Clear
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">Current: {savedUserId || "(none)"}</p>
        </Card>

        <Card className="p-6 bg-card border-border space-y-4">
          <h3 className="text-lg font-semibold">Backend Mode</h3>
          <p className="text-sm text-muted-foreground">
            Persistence: {persistenceMode}. Supabase configured: {supabaseConfigured ? "yes" : "no"}.
          </p>
          <p className="text-xs text-muted-foreground">
            Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in environment to enable cloud DB persistence.
          </p>
        </Card>

        <Card className="p-6 bg-card border-border space-y-4">
          <h3 className="text-lg font-semibold">Project Memory Index</h3>
          <p className="text-sm text-muted-foreground">
            Build or refresh the project index used for file-aware chat retrieval.
          </p>
          <Button variant="outline" onClick={rebuildIndex} disabled={isIndexing}>
            {isIndexing ? "Indexing..." : "Rebuild Project Index"}
          </Button>
        </Card>

        {statusText ? <p className="text-sm text-cyan-300">{statusText}</p> : null}
      </div>
    </div>
  )
}
