"use client"

import { useEffect, useState } from "react"

interface NotificationProps {
  message: string
  duration?: number
  onDismiss?: () => void
}

export default function Notification({ message, duration = 5000, onDismiss }: NotificationProps) {
  const [visible, setVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)

      // Add a small delay for the exit animation
      setTimeout(() => {
        setVisible(false)
        if (onDismiss) onDismiss()
      }, 500)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onDismiss])

  if (!visible) return null

  return (
    <div
      className={`fixed top-16 left-1/2 transform -translate-x-1/2 bg-[#f8f0dd]/95 border-2 border-[#8b5a2b] 
                px-6 py-3 rounded-sm shadow-lg z-50 transition-all duration-500 
                ${isExiting ? "opacity-0 translate-y-[-20px]" : "opacity-100 translate-y-0"}`}
    >
      <p className="text-[#5c4033] text-center font-mono uppercase tracking-wide text-sm">{message}</p>
    </div>
  )
}
