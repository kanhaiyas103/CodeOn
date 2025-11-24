"use client"
import ReactMarkdown from "react-markdown"
import { Copy, Check } from "lucide-react"
import { useState } from "react"

export default function ChatMessage({
  message,
}: {
  message: {
    id: string
    role: "user" | "assistant"
    content: string
    image?: string
  }
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex ${message.role === "user" ? "justify-end" : ""}`}>
      <div className={`max-w-2xl rounded-lg p-4 border group ${
        message.role === "user"
          ? "bg-primary text-primary-foreground border-primary/50"
          : "bg-card border-border"
      }`}>

        {/* TEXT CONTENT */}
        <div className="prose prose-invert max-w-none text-sm">
          <ReactMarkdown>
            {message.content}
          </ReactMarkdown>
        </div>

        {/* ✅ IMAGE PREVIEW */}
        {message.image && (
          <img
            src={message.image}
            alt="Uploaded file"
            className="mt-3 rounded-lg max-w-sm border border-border"
          />
        )}

        {/* COPY BUTTON */}
        {message.role === "assistant" && (
          <button
            onClick={handleCopy}
            className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>
    </div>
  )
}
