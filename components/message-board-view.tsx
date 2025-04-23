"use client"

import { useEffect } from "react"
import Image from "next/image"

interface MessageBoardViewProps {
  onClose: () => void
}

export default function MessageBoardView({ onClose }: MessageBoardViewProps) {
  // Add keyboard handler for ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Remove ESC key handling
      // if (e.key === "Escape") {
      //   e.preventDefault() // Prevent the event from bubbling up
      //   e.stopPropagation() // Stop propagation to parent elements
      //   onClose()
      // }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50"
      onClick={(e) => {
        // Prevent clicks from bubbling to elements below
        e.stopPropagation()
      }}
    >
      <div className="relative bg-[#f8f0dd]/95 border-4 border-[#8b5a2b] p-6 rounded-sm shadow-lg max-w-4xl w-full">
        <div className="absolute inset-0 bg-[url('/aged-parchment.png')] opacity-10 pointer-events-none"></div>

        <button
          onClick={(e) => {
            e.stopPropagation() // Prevent event bubbling
            onClose()
          }}
          className="absolute top-4 right-4 bg-[#e6d2b3] hover:bg-[#d9c4a3] p-2 rounded-sm border-2 border-[#8b5a2b] transition-colors z-10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[#5c4033]"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <div className="relative w-full aspect-[16/9] border-2 border-[#8b5a2b] rounded-sm overflow-hidden">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/message%20board-9mTFFJ4TASpYefd9GPyGclKIHJlPpp.png"
            alt="Message Board"
            fill
            className="object-contain"
          />
        </div>
      </div>
    </div>
  )
}
