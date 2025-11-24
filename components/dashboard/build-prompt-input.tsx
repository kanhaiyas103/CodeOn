"use client"

import { Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function BuildPromptInput({
  prompt,
  setPrompt,
  onGenerate,
  isGenerating,
}: {
  prompt: string
  setPrompt: (value: string) => void
  onGenerate: () => void
  isGenerating: boolean
}) {
  return (
    <div className="flex flex-col h-full p-6 gap-4">
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Design Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the UI you want to generate..."
          className="w-full flex-1 bg-input border border-border rounded-lg p-4 text-foreground placeholder:text-muted-foreground resize-none outline-none focus:ring-1 focus:ring-primary font-mono text-sm"
        />
      </div>
      <Button
        onClick={onGenerate}
        disabled={!prompt.trim() || isGenerating}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-10"
      >
        <Wand2 className="w-4 h-4" />
        {isGenerating ? "Generating..." : "Generate UI"}
      </Button>
      <div className="flex-1" />
      <div className="text-xs text-muted-foreground space-y-2 pb-4 border-t border-border pt-4">
        <p className="font-medium text-foreground">Tips:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Be specific about layout and style</li>
          <li>Include color preferences</li>
          <li>Mention components needed</li>
        </ul>
      </div>
    </div>
  )
}
