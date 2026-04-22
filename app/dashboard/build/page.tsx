"use client"

import { useState } from "react"
import { Check, Copy, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import BuildPromptInput from "@/components/dashboard/build-prompt-input"
import BuildPreview from "@/components/dashboard/build-preview"

type BuildResponse = {
  html?: string
  error?: string
}

export default function BuildUIPage() {
  const [prompt, setPrompt] = useState(
    "Create a modern SaaS landing page with glassmorphism and a strong hero CTA",
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewHTML, setPreviewHTML] = useState("")
  const [copied, setCopied] = useState(false)
  const [errorText, setErrorText] = useState("")

  const handleGenerate = async () => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt || isGenerating) {
      return
    }

    setIsGenerating(true)
    setPreviewHTML("")
    setErrorText("")

    try {
      const response = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmedPrompt }),
      })

      const data = (await response.json()) as BuildResponse

      if (!response.ok) {
        throw new Error(data.error || "UI generation failed")
      }

      setPreviewHTML(data.html || "")
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Unexpected generation error")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyCode = async () => {
    if (!previewHTML) {
      return
    }

    await navigator.clipboard.writeText(previewHTML)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleDownload = () => {
    if (!previewHTML) {
      return
    }

    const blob = new Blob([previewHTML], { type: "text/html;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "codeon-generated-ui.html"
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/3 border-r border-border flex flex-col">
          <BuildPromptInput
            prompt={prompt}
            setPrompt={setPrompt}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        </div>

        <div className="flex-1 flex flex-col">
          <div className="h-16 border-b border-border bg-card/40 px-6 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Live Preview</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                disabled={!previewHTML}
                className="gap-2 bg-transparent"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!previewHTML}
                onClick={handleDownload}
                className="gap-2 bg-transparent"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>

          {errorText ? <div className="px-6 py-2 text-sm text-red-300">{errorText}</div> : null}
          <BuildPreview html={previewHTML} isGenerating={isGenerating} />
        </div>
      </div>
    </div>
  )
}
