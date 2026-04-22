"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Cloud, MessageSquare, Plus, RefreshCcw, Trash2 } from "lucide-react"
import ChatMessage from "@/components/dashboard/chat-message"
import ChatInput from "@/components/dashboard/chat-input"
import { Button } from "@/components/ui/button"

type ChatRole = "user" | "assistant"

type Message = {
  id: string
  role: ChatRole
  content: string
  image?: string
  createdAt: number
}

type ChatSession = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: Message[]
}

type ProjectQueryResponse = {
  results?: Array<{ path: string; snippet: string }>
}

type UploadResponse =
  | { status: "image"; name: string; base64: string }
  | { status: "text"; name: string; content: string }
  | { status: "document"; name: string; format: string; content: string }
  | { status: "project_bundle"; name: string; uploadId: string; extractedPath: string; files: string[]; summary: string }
  | { status: "unsupported"; name: string; message: string }
  | { status: "error"; message: string }

const STORAGE_KEY = "codeon.chat.sessions.v1"
const ACTIVE_STORAGE_KEY = "codeon.chat.active-session.v1"
const USER_ID_KEY = "codeon.user.id"

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function createAssistantWelcomeMessage(): Message {
  return {
    id: makeId(),
    role: "assistant",
    content:
      "Welcome to Codeon. I can help debug, explain code, design architecture, and improve performance. What are we building today?",
    createdAt: Date.now(),
  }
}

function createSession(seedTitle?: string): ChatSession {
  const now = Date.now()
  return {
    id: makeId(),
    title: seedTitle || "New Chat",
    createdAt: now,
    updatedAt: now,
    messages: [createAssistantWelcomeMessage()],
  }
}

function makeTitleFromMessage(content: string) {
  const cleaned = content.replace(/\s+/g, " ").trim()
  if (!cleaned) {
    return "New Chat"
  }
  return cleaned.length > 42 ? `${cleaned.slice(0, 42)}...` : cleaned
}

function isSessionArray(value: unknown): value is ChatSession[] {
  return (
    Array.isArray(value) &&
    value.every(
      (session) =>
        session &&
        typeof session.id === "string" &&
        typeof session.title === "string" &&
        Array.isArray(session.messages),
    )
  )
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string>("")
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorText, setErrorText] = useState("")
  const [isHydrated, setIsHydrated] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)
  const [useProjectContext, setUseProjectContext] = useState(true)
  const [isIndexing, setIsIndexing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const userId = useMemo(() => {
    if (typeof window === "undefined") {
      return ""
    }
    return (localStorage.getItem(USER_ID_KEY) || "").trim().toLowerCase()
  }, [isHydrated])

  const activeSession = useMemo(() => {
    return sessions.find((session) => session.id === activeSessionId) || null
  }, [sessions, activeSessionId])

  useEffect(() => {
    const bootstrap = async () => {
      const rawSessions = localStorage.getItem(STORAGE_KEY)
      const rawActiveSessionId = localStorage.getItem(ACTIVE_STORAGE_KEY)
      const localSessions = (() => {
        try {
          if (!rawSessions) {
            return []
          }
          const parsed = JSON.parse(rawSessions) as unknown
          return isSessionArray(parsed) ? parsed : []
        } catch {
          return []
        }
      })()

      const initialUserId = (localStorage.getItem(USER_ID_KEY) || "").trim().toLowerCase()

      if (initialUserId) {
        try {
          const response = await fetch(`/api/sessions?userId=${encodeURIComponent(initialUserId)}`)
          const data = await response.json()
          if (response.ok && isSessionArray(data?.sessions) && data.sessions.length > 0) {
            const remoteSessions = [...data.sessions].sort((a, b) => b.updatedAt - a.updatedAt)
            setSessions(remoteSessions)
            const hasActive = rawActiveSessionId && remoteSessions.some((session) => session.id === rawActiveSessionId)
            setActiveSessionId(hasActive ? rawActiveSessionId : remoteSessions[0].id)
            setIsHydrated(true)
            return
          }
        } catch {
          // fall back to local only
        }
      }

      if (localSessions.length > 0) {
        const sorted = [...localSessions].sort((a, b) => b.updatedAt - a.updatedAt)
        setSessions(sorted)
        const hasActive = rawActiveSessionId && sorted.some((session) => session.id === rawActiveSessionId)
        setActiveSessionId(hasActive ? rawActiveSessionId : sorted[0].id)
      } else {
        const initial = createSession()
        setSessions([initial])
        setActiveSessionId(initial.id)
      }

      setIsHydrated(true)
    }

    void bootstrap()
  }, [])

  useEffect(() => {
    if (!isHydrated || sessions.length === 0) {
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  }, [sessions, isHydrated])

  useEffect(() => {
    if (!isHydrated || !activeSessionId) {
      return
    }
    localStorage.setItem(ACTIVE_STORAGE_KEY, activeSessionId)
  }, [activeSessionId, isHydrated])

  useEffect(() => {
    if (!isHydrated || !userId || sessions.length === 0) {
      return
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSyncing(true)
        const response = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, sessions }),
        })

        if (!response.ok) {
          return
        }

        setLastSyncedAt(Date.now())
      } finally {
        setIsSyncing(false)
      }
    }, 900)

    return () => window.clearTimeout(timeoutId)
  }, [sessions, userId, isHydrated])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeSession?.messages, isLoading])

  const patchSession = (sessionId: string, updater: (session: ChatSession) => ChatSession) => {
    setSessions((prev) => {
      const next = prev.map((session) => {
        if (session.id !== sessionId) {
          return session
        }
        return updater(session)
      })
      return [...next].sort((a, b) => b.updatedAt - a.updatedAt)
    })
  }

  const createNewSession = () => {
    const session = createSession()
    setSessions((prev) => [session, ...prev])
    setActiveSessionId(session.id)
    setInput("")
    setErrorText("")
  }

  const deleteSession = (sessionId: string) => {
    setSessions((prev) => {
      const remaining = prev.filter((session) => session.id !== sessionId)
      if (remaining.length === 0) {
        const fallback = createSession()
        setActiveSessionId(fallback.id)
        return [fallback]
      }

      if (activeSessionId === sessionId) {
        setActiveSessionId(remaining[0].id)
      }
      return remaining
    })
  }

  const getProjectContext = async (query: string) => {
    if (!useProjectContext) {
      return ""
    }

    const response = await fetch("/api/project/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit: 3 }),
    })

    const data = (await response.json()) as ProjectQueryResponse
    if (!response.ok || !data.results || data.results.length === 0) {
      return ""
    }

    return data.results
      .map((entry) => `File: ${entry.path}\n${entry.snippet}`)
      .join("\n\n---\n\n")
  }

  const refreshProjectIndex = async () => {
    try {
      setIsIndexing(true)
      await fetch("/api/project/index", { method: "POST" })
    } finally {
      setIsIndexing(false)
    }
  }

  const sendWithMessage = async (newMessage: Message) => {
    if (!activeSession) {
      return
    }

    setErrorText("")
    setIsLoading(true)

    const updatedMessages = [...activeSession.messages, newMessage]
    patchSession(activeSession.id, (session) => ({
      ...session,
      title: session.title === "New Chat" && newMessage.role === "user" ? makeTitleFromMessage(newMessage.content) : session.title,
      updatedAt: Date.now(),
      messages: updatedMessages,
    }))

    try {
      const projectContext = newMessage.role === "user" ? await getProjectContext(newMessage.content) : ""
      const payloadMessages = updatedMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        image: msg.image,
      }))

      const outboundMessages = projectContext
        ? [
            {
              role: "system",
              content:
                "Project context snippets below. Use only if relevant and mention file paths when making code suggestions.\n\n" +
                projectContext,
            },
            ...payloadMessages,
          ]
        : payloadMessages

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: outboundMessages }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || "Failed to fetch AI response")
      }

      const aiMessage: Message = {
        id: makeId(),
        role: "assistant",
        content: data.response || "No response returned.",
        createdAt: Date.now(),
      }

      patchSession(activeSession.id, (session) => ({
        ...session,
        updatedAt: Date.now(),
        messages: [...session.messages, aiMessage],
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error"
      setErrorText(message)

      const aiErrorMessage: Message = {
        id: makeId(),
        role: "assistant",
        content: `I hit an error while contacting the model: ${message}`,
        createdAt: Date.now(),
      }

      patchSession(activeSession.id, (session) => ({
        ...session,
        updatedAt: Date.now(),
        messages: [...session.messages, aiErrorMessage],
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = async () => {
    const content = input.trim()
    if (!content || !activeSession || isLoading) {
      return
    }

    setInput("")

    if (content.toLowerCase().startsWith("/generate-mvp")) {
      const brief = content.replace(/^\/generate-mvp\s*/i, "").trim()
      if (!brief) {
        setErrorText("Usage: /generate-mvp <your project brief>")
        return
      }

      setIsLoading(true)
      try {
        const generationResponse = await fetch("/api/project/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brief }),
        })
        const generationData = await generationResponse.json()
        if (!generationResponse.ok) {
          throw new Error(generationData?.error || "Project generation failed")
        }

        const systemMessage: Message = {
          id: makeId(),
          role: "assistant",
          content: [
            `MVP scaffold generated: ${generationData.projectName}`,
            generationData.summary ? `Summary: ${generationData.summary}` : "",
            `Output: ${generationData.outputDir}`,
            Array.isArray(generationData.files) && generationData.files.length > 0
              ? `Files:\n${generationData.files.slice(0, 25).map((file: string) => `- ${file}`).join("\n")}`
              : "",
          ]
            .filter(Boolean)
            .join("\n\n"),
          createdAt: Date.now(),
        }

        patchSession(activeSession.id, (session) => ({
          ...session,
          updatedAt: Date.now(),
          messages: [...session.messages, systemMessage],
        }))
      } catch (error) {
        setErrorText(error instanceof Error ? error.message : "Project generation failed")
      } finally {
        setIsLoading(false)
      }
      return
    }

    const userMessage: Message = {
      id: makeId(),
      role: "user",
      content,
      createdAt: Date.now(),
    }

    await sendWithMessage(userMessage)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeSession || isLoading) {
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    try {
      setErrorText("")
      const res = await fetch("/api/files", {
        method: "POST",
        body: formData,
      })
      const data = (await res.json()) as UploadResponse

      if (!res.ok) {
        throw new Error("message" in data ? data.message : "File upload failed")
      }

      if (data.status === "image") {
        const imageMessage: Message = {
          id: makeId(),
          role: "user",
          content: "Describe this image in detail and explain anything useful for a developer.",
          image: data.base64,
          createdAt: Date.now(),
        }
        await sendWithMessage(imageMessage)
        return
      }

      if (data.status === "text") {
        const textPrompt = `Analyze this file and suggest concrete improvements:\n\nFile Name: ${data.name}\n\n${data.content}`
        const textMessage: Message = {
          id: makeId(),
          role: "user",
          content: textPrompt,
          createdAt: Date.now(),
        }
        await sendWithMessage(textMessage)
        return
      }

      if (data.status === "document") {
        const documentPrompt = [
          `Analyze this ${data.format.toUpperCase()} document for implementation insights.`,
          `Document Name: ${data.name}`,
          "",
          data.content,
        ].join("\n")

        const textMessage: Message = {
          id: makeId(),
          role: "user",
          content: documentPrompt,
          createdAt: Date.now(),
        }
        await sendWithMessage(textMessage)
        return
      }

      if (data.status === "project_bundle") {
        const bundlePrompt = [
          "A full project bundle was uploaded. Analyze architecture, risks, and next implementation tasks.",
          `Bundle Name: ${data.name}`,
          `Extracted At: ${data.extractedPath}`,
          `Top Files (${Math.min(data.files.length, 40)} shown):`,
          ...data.files.slice(0, 40).map((file) => `- ${file}`),
          "",
          "Extracted Snippets:",
          data.summary,
        ].join("\n")

        const textMessage: Message = {
          id: makeId(),
          role: "user",
          content: bundlePrompt,
          createdAt: Date.now(),
        }
        await sendWithMessage(textMessage)
        return
      }

      if (data.status === "unsupported") {
        throw new Error(data.message)
      }
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "File upload failed")
    } finally {
      e.target.value = ""
    }
  }

  return (
    <div className="flex h-full bg-background">
      <aside className="w-80 border-r border-border bg-card/30 backdrop-blur-sm flex flex-col">
        <div className="p-4 border-b border-border space-y-2">
          <Button onClick={createNewSession} className="w-full gap-2">
            <Plus className="w-4 h-4" />
            New Chat
          </Button>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Cloud className="w-3 h-3" />
              {userId ? `Sync user: ${userId}` : "No sync user set"}
            </span>
            <span>{isSyncing ? "Syncing..." : lastSyncedAt ? "Synced" : "Local"}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="inline-flex items-center gap-2 text-muted-foreground">
              <input
                type="checkbox"
                checked={useProjectContext}
                onChange={(event) => setUseProjectContext(event.target.checked)}
              />
              Use project context
            </label>
            <Button size="sm" variant="outline" onClick={refreshProjectIndex} disabled={isIndexing}>
              <RefreshCcw className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map((session) => {
            const isActive = session.id === activeSessionId
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => setActiveSessionId(session.id)}
                className={`w-full text-left p-3 rounded-lg border transition ${
                  isActive
                    ? "bg-primary/10 border-primary/40 text-foreground"
                    : "bg-card/40 border-border text-muted-foreground hover:text-foreground hover:border-primary/20"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{session.title}</p>
                    <p className="text-xs opacity-80 mt-1">{session.messages.length} messages</p>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      deleteSession(session.id)
                    }}
                    className="opacity-70 hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!activeSession || activeSession.messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mx-auto mb-4 flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">AI Chat Assistant</h3>
                <p className="text-muted-foreground text-sm">Start a new conversation with Codeon.</p>
              </div>
            </div>
          ) : (
            <>
              {activeSession.messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}

              {isLoading && (
                <div className="flex gap-2 items-center">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {errorText ? <div className="px-6 pb-2 text-sm text-red-300">{errorText}</div> : null}

        <ChatInput
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          onSend={handleSend}
          handleFileUpload={handleFileUpload}
        />
      </div>
    </div>
  )
}
