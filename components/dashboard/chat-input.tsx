"use client"
import { useRef } from "react"
import type React from "react"
import { Send, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ChatInput({
  input,
  setInput,
  isLoading,
  onSend,
  handleFileUpload,
}: {
  input: string
  setInput: React.Dispatch<React.SetStateAction<string>>
  isLoading: boolean
  onSend: () => void
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="border-t border-border bg-card/40 backdrop-blur-sm p-6">
      <div className="max-w-4xl mx-auto flex gap-3">
        <div className="flex-1 flex gap-2 items-end bg-input border border-border rounded-lg p-3">

          {/* ✅ REAL FILE INPUT */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* ✅ WORKING CLIP BUTTON */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-muted-foreground hover:text-foreground"
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Codeon to generate, debug, or explain any code..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground resize-none outline-none text-sm leading-relaxed font-mono"
            rows={3}
          />
        </div>

        <Button
          onClick={onSend}
          disabled={!input.trim() || isLoading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground h-auto py-3 px-6"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
