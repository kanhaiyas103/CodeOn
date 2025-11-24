"use client"

import { useState } from "react"
import { Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import CodeEditor from "@/components/dashboard/code-editor"
import ConsoleOutput from "@/components/dashboard/console-output"

export default function RunCodePage() {
  const [code, setCode] = useState(`// Write your code here
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("Fibonacci of 10:", fibonacci(10));`)
  const [output, setOutput] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handleRun = async () => {
    setIsRunning(true)
    setOutput([])
    setHasError(false)

    // Simulate code execution
    setTimeout(() => {
      try {
        setOutput(["Fibonacci of 10: 55", "Execution completed in 12ms"])
      } catch (error) {
        setHasError(true)
        setOutput(["Error: Syntax error on line 5"])
      }
      setIsRunning(false)
    }, 1500)
  }

  return (
    <div className="flex h-full bg-background">
      {/* Code Editor Panel */}
      <div className="flex-1 flex flex-col border-r border-border">
        <div className="h-16 border-b border-border bg-card/40 px-6 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">main.js</span>
          <Button
            onClick={handleRun}
            disabled={isRunning}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Play className="w-4 h-4" />
            {isRunning ? "Running..." : "Run"}
          </Button>
        </div>
        <CodeEditor code={code} setCode={setCode} />
      </div>

      {/* Output Panel */}
      <div className="w-1/3 flex flex-col border-l border-border">
        <div className="h-16 border-b border-border bg-card/40 px-6 flex items-center">
          <span className="text-sm font-medium text-foreground">Output</span>
        </div>
        <ConsoleOutput output={output} hasError={hasError} isRunning={isRunning} />
      </div>
    </div>
  )
}
