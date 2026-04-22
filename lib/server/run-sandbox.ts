import { inspect } from "node:util"
import vm from "node:vm"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)

export type RunSandboxResult = {
  success: boolean
  stdout: string[]
  stderr: string[]
  durationMs: number
}

function formatArgs(args: unknown[]) {
  return args
    .map((arg) => {
      if (typeof arg === "string") {
        return arg
      }
      return inspect(arg, { depth: 3, breakLength: 120 })
    })
    .join(" ")
}

export function runJavaScriptSandbox(code: string, timeoutMs = 2500): RunSandboxResult {
  const started = Date.now()
  const stdout: string[] = []
  const stderr: string[] = []

  const sandbox = {
    console: {
      log: (...args: unknown[]) => stdout.push(formatArgs(args)),
      info: (...args: unknown[]) => stdout.push(formatArgs(args)),
      warn: (...args: unknown[]) => stderr.push(`Warning: ${formatArgs(args)}`),
      error: (...args: unknown[]) => stderr.push(formatArgs(args)),
    },
    Math,
    Date,
    JSON,
    Number,
    String,
    Boolean,
    Array,
    Object,
    parseInt,
    parseFloat,
    isNaN,
    Infinity,
    NaN,
    undefined,
  }

  const context = vm.createContext(sandbox)
  const script = new vm.Script(code)

  try {
    const result = script.runInContext(context, { timeout: timeoutMs })
    if (typeof result !== "undefined") {
      stdout.push(inspect(result, { depth: 2 }))
    }
  } catch (executionError) {
    stderr.push(executionError instanceof Error ? executionError.message : "Unknown runtime error")
  }

  return {
    success: stderr.length === 0,
    stdout,
    stderr,
    durationMs: Date.now() - started,
  }
}

async function resolvePythonCommand() {
  const candidates = [
    { command: "python", args: ["--version"] },
    { command: "py", args: ["-3", "--version"] },
  ]

  for (const candidate of candidates) {
    try {
      await execFileAsync(candidate.command, candidate.args, { timeout: 2000 })
      return candidate.command
    } catch {
      // Try next candidate.
    }
  }

  return null
}

export async function runPythonSandbox(code: string, timeoutMs = 3000): Promise<RunSandboxResult> {
  const started = Date.now()
  const pythonCommand = await resolvePythonCommand()

  if (!pythonCommand) {
    return {
      success: false,
      stdout: [],
      stderr: ["Python runtime was not found on this machine."],
      durationMs: Date.now() - started,
    }
  }

  try {
    const args = pythonCommand === "py" ? ["-3", "-c", code] : ["-c", code]
    const { stdout, stderr } = await execFileAsync(pythonCommand, args, {
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024,
    })

    return {
      success: !stderr,
      stdout: stdout ? stdout.trim().split(/\r?\n/).filter(Boolean) : [],
      stderr: stderr ? stderr.trim().split(/\r?\n/).filter(Boolean) : [],
      durationMs: Date.now() - started,
    }
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string; message?: string; killed?: boolean }
    const stderr = err.stderr?.trim() || err.message || "Python execution failed"
    const stdout = err.stdout?.trim() || ""
    return {
      success: false,
      stdout: stdout ? stdout.split(/\r?\n/).filter(Boolean) : [],
      stderr: stderr.split(/\r?\n/).filter(Boolean),
      durationMs: Date.now() - started,
    }
  }
}
