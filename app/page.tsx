"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowRight, Volume2, VolumeX } from "lucide-react"

interface Star {
  id: number
  x: number
  y: number
  size: number
  opacity: number
  duration: number
}

interface Cloud {
  id: number
  x: number
  y: number
  width: number
  opacity: number
  duration: number
  delay: number
}

export default function LandingPage() {
  const [stars, setStars] = useState<Star[]>([])
  const [clouds, setClouds] = useState<Cloud[]>([])
  const [mounted, setMounted] = useState(false)
  const [soundOn, setSoundOn] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [moonRotation, setMoonRotation] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)

    // Generate twinkling stars with staggered animation
    const newStars: Star[] = Array.from({ length: 200 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 70,
      size: Math.random() * 3 + 0.5,
      opacity: Math.random() * 0.7 + 0.3,
      duration: Math.random() * 4 + 2,
    }))
    setStars(newStars)

    // Generate clouds
    const newClouds: Cloud[] = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: 45 + Math.random() * 25,
      width: Math.random() * 250 + 150,
      opacity: Math.random() * 0.25 + 0.08,
      duration: Math.random() * 50 + 80,
      delay: Math.random() * 30,
    }))
    setClouds(newClouds)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })

      // Continuous moon rotation
      setMoonRotation((prev) => (prev + 0.5) % 360)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  if (!mounted) return null

  const moonOffsetX = (mousePos.x - window.innerWidth / 2) * 0.05
  const moonOffsetY = (mousePos.y - window.innerHeight / 2) * 0.05

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden bg-black text-slate-200">
      {/* Deep black night sky background - even darker */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black via-[#0a0e27] to-[#0f1535]" />

      {/* Animated starfield with parallax */}
      <div className="fixed inset-0 z-1 pointer-events-none">
        {stars.map((star) => (
          <div
            key={`star-${star.id}`}
            className="absolute rounded-full bg-white transition-all duration-75"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              left: `${star.x}%`,
              top: `${star.y}%`,
              opacity: star.opacity,
              boxShadow: `0 0 ${star.size * 2}px rgba(255,255,255,${star.opacity * 0.9}), 0 0 ${star.size * 4}px rgba(100,200,255,${star.opacity * 0.5})`,
              animation: `twinkle ${star.duration}s ease-in-out infinite`,
              transform: `translate(${(mousePos.x / window.innerWidth - 0.5) * star.size}px, ${(mousePos.y / window.innerHeight - 0.5) * star.size}px)`,
            }}
          />
        ))}
      </div>

      {/* Cloud layers for atmosphere */}
      <div className="fixed inset-0 z-2 pointer-events-none">
        {clouds.map((cloud) => (
          <div
            key={`cloud-${cloud.id}`}
            className="absolute transition-transform duration-150"
            style={{
              left: `${cloud.x}%`,
              top: `${cloud.y}%`,
              width: `${cloud.width}px`,
              height: "100px",
              opacity: cloud.opacity,
              animation: `drift ${cloud.duration}s linear infinite`,
              animationDelay: `${cloud.delay}s`,
              transform: `translateY(${(mousePos.y / window.innerHeight - 0.5) * 5}px)`,
            }}
          >
            {/* Cloud shape */}
            <div
              className="w-full h-full"
              style={{
                background: `radial-gradient(ellipse at 30% 50%, rgba(100, 150, 200, ${cloud.opacity * 1.8}), transparent 70%)`,
                borderRadius: "50%",
                filter: "blur(25px)",
              }}
            />
          </div>
        ))}
      </div>

      {/* Central moon with rotation and hover tracking */}
      <div
        className="fixed top-1/3 left-1/2 z-3 pointer-events-none transition-transform duration-75"
        style={{
          transform: `translate(calc(-50% + ${moonOffsetX}px), calc(-50% + ${moonOffsetY}px))`,
        }}
      >
        <div className="relative w-64 h-64 md:w-80 md:h-80">
          {/* Outer atmospheric glow - blue cast */}
          <div className="absolute -inset-20 rounded-full bg-gradient-radial from-cyan-400/30 to-transparent blur-3xl animate-pulse-glow" />

          {/* Moon glow ring - brighter */}
          <div
            className="absolute -inset-8 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(147, 197, 253, 0.4), transparent 70%)",
              filter: "blur(30px)",
            }}
          />

          {/* Main moon body with realistic gradient and rotation */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.98) 0%, rgba(220, 230, 255, 0.85) 12%, rgba(180, 200, 230, 0.65) 30%, rgba(100, 130, 180, 0.55) 50%, rgba(50, 80, 140, 0.75) 100%)`,
              boxShadow:
                "0 0 120px rgba(100, 200, 255, 0.7), 0 0 180px rgba(100, 150, 255, 0.4), inset -50px -50px 100px rgba(0, 0, 0, 0.4)",
              animation: `rotateMoon 60s linear infinite`,
            }}
          />

          {/* Crater details with rotation */}
          <div
            className="absolute inset-4 rounded-full"
            style={{
              background: `
                radial-gradient(circle at 25% 30%, rgba(150, 150, 180, 0.5) 0%, transparent 7%),
                radial-gradient(circle at 65% 45%, rgba(100, 120, 160, 0.4) 0%, transparent 14%),
                radial-gradient(circle at 40% 65%, rgba(120, 140, 180, 0.45) 0%, transparent 11%),
                radial-gradient(circle at 70% 70%, rgba(80, 100, 150, 0.4) 0%, transparent 10%),
                radial-gradient(circle at 20% 60%, rgba(130, 140, 170, 0.35) 0%, transparent 8%)
              `,
              animation: `rotateMoon 60s linear infinite`,
            }}
          />

          {/* Moon atmosphere rim highlight */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: "inset -3px -3px 30px rgba(0, 0, 0, 0.5), inset 3px 3px 25px rgba(255, 255, 255, 0.15)",
              animation: `rotateMoon 60s linear infinite`,
            }}
          />
        </div>
      </div>

      {/* Water shimmer effect at bottom - more pronounced */}
      <div className="fixed bottom-0 left-0 right-0 h-40 z-4 pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            background: `linear-gradient(to bottom, 
              rgba(30, 80, 180, 0.2) 0%,
              rgba(20, 60, 160, 0.3) 30%,
              rgba(10, 40, 140, 0.4) 60%,
              rgba(5, 20, 100, 0.5) 100%
            )`,
          }}
        />

        {/* Water shimmer with wave effect */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background: `linear-gradient(90deg, 
              transparent 0%,
              rgba(150, 200, 255, 0.4) 20%,
              transparent 40%,
              rgba(100, 180, 255, 0.3) 60%,
              transparent 80%,
              rgba(120, 190, 255, 0.35) 100%
            )`,
            animation: "shimmer 6s ease-in-out infinite",
          }}
        />

        {/* Wave lines effect */}
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 1200 400" preserveAspectRatio="none">
          <defs>
            <linearGradient id="waveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(100,200,255,0.4)" />
              <stop offset="100%" stopColor="rgba(50,100,200,0)" />
            </linearGradient>
          </defs>
          <path
            d="M0,100 Q300,50 600,100 T1200,100 L1200,400 L0,400 Z"
            fill="url(#waveGrad)"
            style={{
              animation: "wave 8s ease-in-out infinite",
            }}
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header with stylish Codeon branding */}
        <header className="border-b border-slate-900/50 backdrop-blur-md bg-black/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2 group cursor-pointer">
              <span className="text-3xl animate-bounce" style={{ animationDuration: "3s" }}>
                🌙
              </span>
              <span className="text-3xl font-black bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-400 bg-clip-text text-transparent tracking-wider">
                CODEON
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setSoundOn(!soundOn)}
                className="p-2 text-slate-400 hover:text-cyan-300 transition"
              >
                {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <Link
                href="/dashboard/chat"
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-black font-bold rounded-full hover:shadow-lg hover:shadow-cyan-500/50 transition duration-300"
              >
                Enter App
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-block mb-8 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-sm font-medium backdrop-blur-sm">
              ✨ AI-Powered Developer Intelligence OS
            </div>

            {/* Main heading */}
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black mb-8 leading-tight">
              <span className="block bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                Build Your Code
              </span>
              <span className="block text-slate-200 mt-2">Into Reality</span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-slate-300 mb-12 leading-relaxed max-w-3xl mx-auto">
              The elite developer command center. Chat with AI, execute code instantly, and generate beautiful UIs. All
              the power of ChatGPT, Replit, and Vercel in one unified platform.
            </p>

            {/* CTA Button */}
            <Link
              href="/dashboard/chat"
              className="group inline-flex px-10 py-5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-black font-bold rounded-full hover:shadow-2xl hover:shadow-cyan-500/60 transition duration-300 text-lg items-center gap-3"
            >
              Start Building
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </Link>

            {/* Feature tags */}
            <div className="flex flex-wrap gap-3 justify-center mt-16">
              {["AI Chat", "Live Execution", "UI Generation", "Smart Debugging", "Code Understanding"].map((tag, i) => (
                <span
                  key={i}
                  className="px-4 py-2 rounded-full bg-slate-900/40 border border-slate-800/50 text-sm text-slate-300 backdrop-blur-sm hover:border-cyan-500/50 hover:text-cyan-300 transition"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-900/50 backdrop-blur-md bg-black/40 py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500 text-sm">
            <p>© 2025 Codeon. Developer Intelligence OS. Building the future of code.</p>
          </div>
        </footer>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes twinkle {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes drift {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100vw);
          }
        }

        @keyframes shimmer {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes rotateMoon {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes wave {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.3;
            filter: blur(40px);
          }
          50% {
            opacity: 0.7;
            filter: blur(50px);
          }
        }
      `}</style>
    </div>
  )
}
