"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageSquare, Play, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    { href: "/dashboard/chat", label: "AI Chat", icon: MessageSquare },
    { href: "/dashboard/run", label: "Run Code", icon: Play },
    { href: "/dashboard/build", label: "Build UI", icon: Zap },
  ]

  return (
    <nav className="w-full border-b border-slate-800/50 bg-black/40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition">
            <span className="text-sm font-bold text-black">C</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
            CODEON
          </span>
        </Link>

        {/* Navigation tabs */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium",
                  isActive
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30",
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Exit button */}
        <Link
          href="/"
          className="px-4 py-2 text-sm text-slate-400 hover:text-cyan-300 transition-colors rounded-lg hover:bg-slate-800/30"
        >
          Exit
        </Link>
      </div>
    </nav>
  )
}
