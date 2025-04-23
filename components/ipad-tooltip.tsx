"use client"

import { useState, useEffect } from "react"

interface IpadTooltipProps {
  visible: boolean
  position: { x: number; y: number }
}

export default function IpadTooltip({ visible, position }: IpadTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (visible) {
      // Add a slight delay before showing the tooltip for better UX
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 300)

      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [visible])

  if (!isVisible) return null

  return (
    <div
      className="absolute z-30 bg-black/80 text-white px-3 py-1.5 rounded-md text-sm shadow-lg animate-fade-in"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 40}px`,
        transform: "translateX(-50%)",
        pointerEvents: "none", // Make sure tooltip doesn't block interactions
      }}
    >
      <div className="flex items-center gap-2">
        <span className="bg-white text-black px-1.5 rounded font-mono text-xs">E</span>
        <span>Interact with iPad</span>
      </div>
      <div className="absolute bottom-0 left-1/2 transform translate-y-1/2 -translate-x-1/2 rotate-45 w-3 h-3 bg-black/80"></div>
    </div>
  )
}
