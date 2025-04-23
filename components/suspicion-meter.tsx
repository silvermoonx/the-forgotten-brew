"use client"

import type React from "react"

import { useState, useEffect } from "react"

interface SuspicionMeterProps {
  level: number
  maxLevel: number
  position?: { x: number; y: number }
}

export default function SuspicionMeter({ level, maxLevel = 3, position }: SuspicionMeterProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [prevLevel, setPrevLevel] = useState(level)

  // Animate when level changes
  useEffect(() => {
    if (level !== prevLevel) {
      setIsAnimating(true)
      const timeout = setTimeout(() => {
        setIsAnimating(false)
      }, 1000)
      setPrevLevel(level)

      return () => clearTimeout(timeout)
    }
  }, [level, prevLevel])

  // If position is provided, use it; otherwise, use fixed positioning
  const positionStyle = position
    ? { position: "absolute", left: `${position.x + 60}px`, top: `${position.y - 80}px` }
    : { position: "fixed", right: "20px", top: "50%", transform: "translateY(-50%)" }

  return (
    <div className="z-40 flex flex-col items-center" style={positionStyle as React.CSSProperties}>
      {/* Meter container - styled like dialogue box */}
      <div
        className={`bg-[#f0e6d2] p-2 rounded-md shadow-md border-2 border-[#8b5a2b] ${
          isAnimating ? "shadow-[0_0_12px_rgba(255,100,0,0.6)]" : ""
        }`}
        style={{
          boxShadow: "inset 0 0 10px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.1)",
          width: "40px",
        }}
      >
        {/* Label */}
        <div className="text-center mb-1">
          <span className="text-[#5c4033] font-pixel text-xs">ALERT</span>
        </div>

        {/* Vertical meter */}
        <div className="h-32 w-6 bg-[#e6d2b3] rounded-sm overflow-hidden border border-[#8b5a2b] flex flex-col-reverse mx-auto">
          {Array.from({ length: maxLevel }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 w-full transition-all duration-500 ${
                i < level ? "bg-gradient-to-t from-yellow-500 to-red-600" : ""
              }`}
              style={{
                borderTop: i > 0 ? "1px solid #8b5a2b" : "none",
                opacity: i < level ? (isAnimating && i === level - 1 ? "0.8" : "1") : "0",
                animation: isAnimating && i === level - 1 ? "pulse 1s" : "none",
              }}
            />
          ))}
        </div>

        {/* Level indicator */}
        <div className="text-center mt-1">
          <span className="text-[#5c4033] font-pixel text-xs">
            {level}/{maxLevel}
          </span>
        </div>
      </div>

      {/* Increased notification */}
      {isAnimating && level > 0 && (
        <div className="absolute -left-32 top-1/2 -translate-y-1/2 bg-[#f0e6d2] text-red-600 text-xs p-1 rounded border border-[#8b5a2b] whitespace-nowrap animate-fadeIn font-pixel">
          !
        </div>
      )}
    </div>
  )
}
