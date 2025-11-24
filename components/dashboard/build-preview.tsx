export default function BuildPreview({
  html,
  isGenerating,
}: {
  html: string
  isGenerating: boolean
}) {
  return (
    <div className="flex-1 overflow-auto">
      {isGenerating ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block">
              <div className="w-12 h-12 rounded-lg border-2 border-primary/30 border-t-primary animate-spin" />
            </div>
            <p className="text-muted-foreground text-sm mt-4">Generating your design...</p>
          </div>
        </div>
      ) : html ? (
        <iframe srcDoc={html} className="w-full h-full border-0" title="Preview" />
      ) : (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">Enter a prompt and click Generate to see your design here</p>
          </div>
        </div>
      )}
    </div>
  )
}
