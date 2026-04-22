"use client"

import { useState } from "react"
import { Bug, Play, WandSparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import CodeEditor from "@/components/dashboard/code-editor"
import ConsoleOutput from "@/components/dashboard/console-output"

type RunResponse = {
  success: boolean
  stdout: string[]
  stderr: string[]
  durationMs: number
  error?: string
}

type DebugResponse = {
  summary?: string
  rootCause?: string
  fixes?: string[]
  patchedCode?: string
  error?: string
}

type AutoFixResponse = {
  success: boolean
  fixedCode: string
  iterations: Array<{
    iteration: number
    success: boolean
    stdout: string[]
    stderr: string[]
    durationMs: number
  }>
  error?: string
}

export default function RunCodePage() {
  const [language, setLanguage] = useState<"javascript" | "python">("javascript")
  const [code, setCode] = useState(`// JavaScript runtime sandbox (MVP)
function fibonacci(n) {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}

console.log("Fibonacci of 10:", fibonacci(10))`)
  const [output, setOutput] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isDebugging, setIsDebugging] = useState(false)
  const [debugSummary, setDebugSummary] = useState("")
  const [debugRootCause, setDebugRootCause] = useState("")
  const [debugFixes, setDebugFixes] = useState<string[]>([])
  const [patchedCode, setPatchedCode] = useState("")
  const [autoFixLog, setAutoFixLog] = useState<string[]>([])

  const handleRun = async () => {
    setIsRunning(true)
    setOutput([])
    setHasError(false)
    setDebugSummary("")
    setDebugRootCause("")
    setDebugFixes([])
    setPatchedCode("")
    setAutoFixLog([])

    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
        }),
      })

      const data = (await response.json()) as RunResponse

      if (!response.ok) {
        setHasError(true)
        setOutput([data.error || "Execution request failed"])
        return
      }

      const nextOutput = [...data.stdout, ...data.stderr, `Execution completed in ${data.durationMs}ms`]

      setHasError(!data.success)
      setOutput(nextOutput.length > 0 ? nextOutput : ["Execution completed with no output"])
    } catch (error) {
      setHasError(true)
      setOutput([error instanceof Error ? error.message : "Unexpected execution error"])
    } finally {
      setIsRunning(false)
    }
  }

  const autoFixAndRun = async () => {
    if (isRunning || isDebugging) {
      return
    }

    try {
      setIsDebugging(true)
      setAutoFixLog([])
      const response = await fetch("/api/run/autofix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
          maxIterations: 3,
        }),
      })
      const data = (await response.json()) as AutoFixResponse
      if (!response.ok) {
        throw new Error(data.error || "Auto-fix failed")
      }

      const logs = data.iterations.flatMap((step) => {
        const parts = [`Iteration ${step.iteration}: ${step.success ? "success" : "failed"} (${step.durationMs}ms)`]
        if (step.stderr.length > 0) {
          parts.push(...step.stderr.map((line) => `  Error: ${line}`))
        }
        return parts
      })
      setAutoFixLog(logs)

      if (data.fixedCode && data.fixedCode !== code) {
        setCode(data.fixedCode)
        setPatchedCode(data.fixedCode)
      }

      if (data.success) {
        setDebugSummary("Auto-fix completed successfully.")
        setDebugRootCause("Code was patched and now executes without runtime errors.")
        setDebugFixes(["Patched code has been applied to editor. Click Run to verify output."])
      } else {
        setDebugSummary("Auto-fix reached iteration limit.")
        setDebugRootCause(data.error || "Some issues may still remain.")
      }
    } catch (error) {
      setDebugSummary(error instanceof Error ? error.message : "Auto-fix failed")
      setDebugRootCause("")
      setDebugFixes([])
    } finally {
      setIsDebugging(false)
    }
  }

  const analyzeError = async () => {
    if (!hasError || isDebugging) {
      return
    }

    try {
      setIsDebugging(true)
      const errorText = output.join("\n")
      const response = await fetch("/api/debug/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: errorText,
          code,
          language,
        }),
      })
      const data = (await response.json()) as DebugResponse

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze error")
      }

      setDebugSummary(data.summary || "")
      setDebugRootCause(data.rootCause || "")
      setDebugFixes(Array.isArray(data.fixes) ? data.fixes : [])
      setPatchedCode(data.patchedCode || "")
    } catch (error) {
      setDebugSummary(error instanceof Error ? error.message : "Failed to analyze error")
      setDebugRootCause("")
      setDebugFixes([])
      setPatchedCode("")
    } finally {
      setIsDebugging(false)
    }
  }

  return (
    <div className="flex h-full bg-background">
      <div className="flex-1 flex flex-col border-r border-border">
        <div className="h-16 border-b border-border bg-card/40 px-6 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">main.js</span>
          <div className="flex gap-2">
            <select
              value={language}
              onChange={(event) => {
                const nextLang = event.target.value === "python" ? "python" : "javascript"
                setLanguage(nextLang)
                if (nextLang === "python") {
                  setCode(`def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n - 1) + fibonacci(n - 2)\n\nprint(\"Fibonacci of 10:\", fibonacci(10))`)
                } else {
                  setCode(`// JavaScript runtime sandbox (MVP)\nfunction fibonacci(n) {\n  if (n <= 1) return n\n  return fibonacci(n - 1) + fibonacci(n - 2)\n}\n\nconsole.log(\"Fibonacci of 10:\", fibonacci(10))`)
                }
              }}
              className="bg-input border border-border rounded-md px-2 text-sm"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
            </select>
            <Button
              onClick={analyzeError}
              disabled={!hasError || isRunning || isDebugging}
              variant="outline"
              className="gap-2"
            >
              <Bug className="w-4 h-4" />
              {isDebugging ? "Analyzing..." : "Auto Debug"}
            </Button>
            <Button onClick={autoFixAndRun} disabled={isRunning || isDebugging} variant="outline" className="gap-2">
              <WandSparkles className="w-4 h-4" />
              {isDebugging ? "Fixing..." : "Auto Fix"}
            </Button>
            <Button
              onClick={handleRun}
              disabled={isRunning}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              <Play className="w-4 h-4" />
              {isRunning ? "Running..." : "Run"}
            </Button>
          </div>
        </div>
        <CodeEditor code={code} setCode={setCode} />
      </div>

      <div className="w-[38%] min-w-96 flex flex-col border-l border-border">
        <div className="h-16 border-b border-border bg-card/40 px-6 flex items-center">
          <span className="text-sm font-medium text-foreground">Output & Debugger</span>
        </div>

        <div className="h-56 border-b border-border">
          <ConsoleOutput output={output} hasError={hasError} isRunning={isRunning} />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
          {!debugSummary ? (
            <p className="text-muted-foreground">Run code and click Auto Debug to get root-cause analysis and fix plan.</p>
          ) : (
            <>
              <p className="font-semibold text-foreground">{debugSummary}</p>
              {debugRootCause ? <p className="text-muted-foreground">{debugRootCause}</p> : null}

              {debugFixes.length > 0 ? (
                <div>
                  <p className="font-medium mb-2">Suggested Fixes</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {debugFixes.map((fix, index) => (
                      <li key={`${fix}-${index}`}>{fix}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {patchedCode ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Patched Code</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => setCode(patchedCode)}
                    >
                      <WandSparkles className="w-4 h-4" />
                      Apply Patch
                    </Button>
                  </div>
                  <pre className="text-xs font-mono p-3 rounded-md bg-black/30 border border-border overflow-x-auto">
                    {patchedCode}
                  </pre>
                </div>
              ) : null}

              {autoFixLog.length > 0 ? (
                <div className="space-y-2">
                  <p className="font-medium">Auto-fix Attempts</p>
                  <pre className="text-xs font-mono p-3 rounded-md bg-black/30 border border-border overflow-x-auto">
                    {autoFixLog.join("\n")}
                  </pre>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
