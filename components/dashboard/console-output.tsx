export default function ConsoleOutput({
  output,
  hasError,
  isRunning,
}: {
  output: string[]
  hasError: boolean
  isRunning: boolean
}) {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2">
      {output.length === 0 && !isRunning ? (
        <div className="flex items-center justify-center h-full text-center">
          <div>
            <p className="text-muted-foreground text-sm">Run your code to see output here</p>
          </div>
        </div>
      ) : (
        <>
          {output.map((line, idx) => (
            <div
              key={idx}
              className={`text-xs font-mono ${hasError && idx === output.length - 1 ? "text-red-400" : "text-green-400"}`}
            >
              {line}
            </div>
          ))}
          {isRunning && (
            <div className="flex gap-2 items-center text-xs text-muted-foreground">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
              Running...
            </div>
          )}
        </>
      )}
    </div>
  )
}
