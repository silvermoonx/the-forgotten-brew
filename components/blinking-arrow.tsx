"use client"

import { useEffect, useState } from "react"

interface BlinkingArrowProps {
  x: number
  y: number
  direction?: "up" | "down" | "left" | "right"
  color?: string
}

export default function BlinkingArrow({ x, y, direction = "down", color = "red-600" }: BlinkingArrowProps) {
  const [visible, setVisible] = useState(true)

  // Blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible((prev) => !prev)
    }, 500) // Blink every 500ms

    return () => clearInterval(interval)
  }, [])

  // Arrow styles based on direction
  const getArrowStyles = () => {
    switch (direction) {
      case "up":
        return `border-l-[15px] border-r-[15px] border-b-[30px] border-l-transparent border-r-transparent border-b-${color}`
      case "down":
        return `border-l-[15px] border-r-[15px] border-t-[30px] border-l-transparent border-r-transparent border-t-${color}`
      case "left":
        return `border-t-[15px] border-b-[15px] border-r-[30px] border-t-transparent border-b-transparent border-r-${color}`
      case "right":
        return `border-t-[15px] border-b-[15px] border-l-[30px] border-t-transparent border-b-transparent border-l-${color}`
    }
  }

  if (!visible) return null

  // Make sure the arrow is rendered as a purely visual element with pointer-events-none
  // This ensures it doesn't interfere with player movement or collision detection
  return (
    <div
      className="absolute z-50 filter drop-shadow-lg animate-bounce pointer-events-none"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      <div className={`w-0 h-0 ${getArrowStyles()}`}></div>
    </div>
  )
}
