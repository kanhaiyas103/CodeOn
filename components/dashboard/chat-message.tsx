"use client"

import { useMemo, useState } from "react"
import ReactMarkdown from "react-markdown"
import { Check, Copy } from "lucide-react"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  image?: string
}

function languageFromClassName(className?: string) {
  if (!className) {
    return "text"
  }
  const match = /language-([\w-]+)/.exec(className)
  return match?.[1] || "text"
}

export default function ChatMessage({ message }: { message: Message }) {
  const [copiedMessage, setCopiedMessage] = useState(false)
  const [copiedBlock, setCopiedBlock] = useState("")

  const markdown = useMemo(() => message.content, [message.content])

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopiedMessage(true)
    setTimeout(() => setCopiedMessage(false), 1500)
  }

  return (
    <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-3xl rounded-xl p-4 border group ${
          message.role === "user"
            ? "bg-primary text-primary-foreground border-primary/50"
            : "bg-card border-border"
        }`}
      >
        <div
          className={`prose max-w-none text-sm ${
            message.role === "user" ? "prose-invert" : "prose-slate dark:prose-invert"
          }`}
        >
          <ReactMarkdown
            components={{
              pre: ({ children }) => <>{children}</>,
              code: ({ className, children }: any) => {
                const code = String(children).replace(/\n$/, "")
                const inline = !className

                if (inline) {
                  return (
                    <code className="rounded bg-black/20 px-1.5 py-0.5 text-xs font-mono text-current">{code}</code>
                  )
                }

                const language = languageFromClassName(className)

                return (
                  <div className="my-3 rounded-lg overflow-hidden border border-border/80 bg-black/40">
                    <div className="flex items-center justify-between px-3 py-2 text-xs bg-black/50 border-b border-border/60">
                      <span className="uppercase tracking-wide text-muted-foreground">{language}</span>
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(code)
                          setCopiedBlock(code)
                          setTimeout(() => setCopiedBlock(""), 1200)
                        }}
                        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      >
                        {copiedBlock === code ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedBlock === code ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
                      <code className="font-mono">{code}</code>
                    </pre>
                  </div>
                )
              },
            }}
          >
            {markdown}
          </ReactMarkdown>
        </div>

        {message.image ? (
          <img src={message.image} alt="Uploaded file" className="mt-3 rounded-lg max-w-sm border border-border" />
        ) : null}

        {message.role === "assistant" ? (
          <button
            type="button"
            onClick={copyMessage}
            className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {copiedMessage ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiedMessage ? "Copied" : "Copy reply"}
          </button>
        ) : null}
      </div>
    </div>
  )
}
