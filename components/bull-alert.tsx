"use client"

import { useEffect, useState } from "react"

interface BullAlertProps {
  position: {
    x: number
    y: number
  }
  visible: boolean
  onAnimationComplete: () => void
}

export default function BullAlert({ position, visible, onAnimationComplete }: BullAlertProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (visible) {
      setIsVisible(true)

      // Auto-hide after 1.5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false)
        onAnimationComplete()
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [visible, onAnimationComplete])

  if (!isVisible) return null

  return (
    <div
      className="absolute z-50 animate-scale-in animate-bounce-subtle"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 40}px`, // Position above the bull's head
      }}
    >
      {/* Pokémon-style "?" bubble */}
      <div className="relative">
        <div className="bg-white text-black rounded-full w-10 h-10 flex items-center justify-center border-2 border-black shadow-md">
          <span className="text-2xl font-bold">?</span>
        </div>
        {/* Small triangle pointer at bottom */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white"></div>
      </div>
    </div>
  )
}
