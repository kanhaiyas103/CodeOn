"use client"

export default function CodeEditor({
  code,
  setCode,
}: {
  code: string
  setCode: (value: string) => void
}) {
  return (
    <div className="flex-1 overflow-hidden">
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full h-full bg-background text-foreground font-mono text-sm p-6 resize-none outline-none border-0 focus:ring-0 scrollbar-thin"
        spellCheck="false"
      />
    </div>
  )
}
