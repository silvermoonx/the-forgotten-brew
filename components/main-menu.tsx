"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

interface MainMenuProps {
  onStartGame: () => void
}

export default function MainMenu({ onStartGame }: MainMenuProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const [showCredits, setShowCredits] = useState(false)

  // Handle button press animation
  const handleMouseDown = () => setIsPressed(true)
  const handleMouseUp = () => {
    setIsPressed(false)
    onStartGame()
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        setIsPressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        setIsPressed(false)
        onStartGame()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [onStartGame])

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/home%20background-nJF3kFPX1SYronGwJ8mqa8liA404ni.png"
          alt="The Forgotten Brew - Game Title Screen"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Start Button - Pixelated and retro styled */}
      <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-10">
        <button
          onClick={onStartGame}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => {
            setIsHovering(false)
            setIsPressed(false)
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          className={`
            relative px-16 py-6 
            font-pixel text-4xl uppercase tracking-wider
            transition-all duration-100
            focus:outline-none focus:ring-4 focus:ring-yellow-500/50
            ${isPressed ? "translate-y-1 scale-95" : ""}
          `}
        >
          {/* Button background with pixelated border */}
          <div
            className={`
              absolute inset-0 bg-[#c94e4e] border-4 border-[#8b2e2e]
              ${isHovering ? "bg-[#d95e5e]" : ""}
              ${isPressed ? "bg-[#b93e3e]" : ""}
            `}
            style={{
              boxShadow: isPressed ? "inset 0 4px 0 #8b2e2e" : "inset 0 -4px 0 #8b2e2e, 0 4px 0 #8b2e2e",
            }}
          />

          {/* Button text with pixel-perfect shadow */}
          <span
            className="relative text-[#ffe8c3] uppercase"
            style={{
              textShadow: "2px 2px 0 #8b2e2e, -2px 2px 0 #8b2e2e, 2px -2px 0 #8b2e2e, -2px -2px 0 #8b2e2e",
            }}
          >
            Start
          </span>
        </button>
      </div>

      {/* Credits button */}
      <div className="absolute bottom-4 right-4 z-10">
        <button
          onClick={() => setShowCredits(!showCredits)}
          className="px-3 py-1 bg-[#8b2e2e]/80 text-[#ffe8c3] font-pixel text-sm hover:bg-[#8b2e2e] transition-colors"
        >
          Credits
        </button>
      </div>

      {/* Credits panel */}
      {showCredits && (
        <div className="absolute bottom-12 right-4 p-4 bg-[#8b2e2e]/90 text-[#ffe8c3] font-pixel text-sm z-20 max-w-xs">
          <h3 className="text-lg mb-2 border-b border-[#ffe8c3]/50 pb-1">The Forgotten Brew</h3>
          <p className="mb-2">A game about a hamster, a bear, and a plan to call BULL.SH.</p>
          <p className="text-xs opacity-80">© 2025 Pixel Brew Studios</p>
          <button
            onClick={() => setShowCredits(false)}
            className="absolute top-1 right-1 text-[#ffe8c3] hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
