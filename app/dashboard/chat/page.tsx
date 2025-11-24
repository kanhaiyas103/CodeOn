"use client"

import { useState, useRef, useEffect } from "react"
import ChatMessage from "@/components/dashboard/chat-message"
import ChatInput from "@/components/dashboard/chat-input"

export default function ChatPage() {
  const [messages, setMessages] = useState<Array<{
    id: string
    role: "user" | "assistant"
    content: string
    image?: string
  }>>([])
  
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
  
    const formData = new FormData()
    formData.append("file", e.target.files[0])
  
    const res = await fetch("/api/files", {
      method: "POST",
      body: formData,
    })
  
    const data = await res.json()
  
    // ✅ IMAGE PREVIEW
    if (data.status === "image") {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "user",
          content: `Uploaded Image: ${data.name}`,
          image: data.base64
        }
      ])
    }
  
    // ✅ TEXT FILE
    if (data.status === "text") {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "user",
          content: `Analyze this file:\n\n${data.content}`
        }
      ])
    }
  }
  
  

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate AI response
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [...messages, userMessage].map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    });
    
    const data = await response.json();
    
    const aiMessage = {
      id: Date.now().toString(),
      role: "assistant" as const,
      content: data.response,
    };
    
    setMessages((prev) => [...prev, aiMessage]);
    setIsLoading(false);
    
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mx-auto mb-4 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">AI Chat Assistant</h3>
              <p className="text-muted-foreground text-sm">
                Ask Codeon to generate, debug, or explain any code. Start typing to begin.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary/20 border border-secondary/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-secondary">AI</span>
                </div>
                <div className="flex gap-1 items-center">
                  <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" />
                  <div
                    className="w-2 h-2 rounded-full bg-primary/40 animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-primary/40 animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <ChatInput
  input={input}
  setInput={setInput}
  isLoading={isLoading}
  onSend={handleSend}
  handleFileUpload={handleFileUpload}
/>

    </div>
  )
}

import { MessageSquare } from "lucide-react"
