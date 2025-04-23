"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"

interface BullCharacterProps {
  position: { x: number; y: number }
}

export default function BullCharacter({ position }: BullCharacterProps) {
  // Use fixed position at 13,7 as requested
  const fixedPosition = { x: 13, y: 7 }

  const [suspicionLevel, setSuspicionLevel] = useState(0)
  const [showQuestionMark, setShowQuestionMark] = useState(false)
  const [showSuspicionAnimation, setShowSuspicionAnimation] = useState(false)
  const questionMarkTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Function to increase suspicion level
  const increaseSuspicion = () => {
    console.log("Bull increaseSuspicion called")
    setSuspicionLevel((prev) => {
      const newLevel = prev + 1
      console.log(`Bull suspicion increased to ${newLevel}`)
      return newLevel
    })

    // Show question mark with more visibility
    showQuestionMarkAboveBull()

    // Show suspicion animation with more intensity
    setShowSuspicionAnimation(true)
    setTimeout(() => setShowSuspicionAnimation(false), 800)
  }

  // Function to show question mark above bull
  const showQuestionMarkAboveBull = () => {
    console.log("Showing question mark above bull")

    // Clear any existing timeout
    if (questionMarkTimeoutRef.current) {
      clearTimeout(questionMarkTimeoutRef.current)
    }

    // Show the question mark
    setShowQuestionMark(true)

    // Hide it after 3 seconds
    questionMarkTimeoutRef.current = setTimeout(() => {
      setShowQuestionMark(false)
    }, 3000)
  }

  // Expose the increaseSuspicion function to the window object
  useEffect(() => {
    // @ts-ignore
    window.bullCharacter = {
      increaseSuspicion,
      showQuestionMarkAboveBull,
      getSuspicionLevel: () => suspicionLevel,
    }

    return () => {
      // @ts-ignore
      delete window.bullCharacter

      // Clear timeout on unmount
      if (questionMarkTimeoutRef.current) {
        clearTimeout(questionMarkTimeoutRef.current)
      }
    }
  }, [suspicionLevel])

  // Check if player should be ejected (3 strikes)
  useEffect(() => {
    if (suspicionLevel >= 3) {
      console.log("Bull is ejecting the player!")
      // Implement ejection logic here
      // This could be a function passed in as a prop or a global function

      // @ts-ignore
      if (window.gameState && typeof window.gameState.ejectPlayerFromRoom === "function") {
        // @ts-ignore
        window.gameState.ejectPlayerFromRoom()
      }

      // Reset suspicion after ejection
      setSuspicionLevel(0)
    }
  }, [suspicionLevel])

  return (
    <div
      className={`absolute transition-all duration-300 ${showSuspicionAnimation ? "scale-110" : "scale-100"}`}
      style={{
        left: `${(fixedPosition.x * window.innerWidth) / 16}px`,
        top: `${(fixedPosition.y * window.innerHeight) / 9}px`,
        transform: "translate(-50%, -50%) scale(3.4)", // Double the original 1.7 scale (1.7 * 2 = 3.4)
      }}
    >
      {/* Pixelated question mark bubble */}
      {showQuestionMark && (
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 animate-bounce">
          {/* Pixelated speech bubble with red question mark */}
          <div className="relative w-12 h-12">
            {/* White bubble background with pixelated edges */}
            <div
              className="absolute top-0 left-0 w-12 h-12 bg-white border-2 border-black"
              style={{
                clipPath:
                  "polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 50%, 100%, 50%, 85%, 40%, 100%, 25%, 100%, 0%, 75%, 0%, 25%)",
                imageRendering: "pixelated",
              }}
            ></div>

            {/* Red pixelated question mark */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="text-red-600 font-bold text-2xl"
                style={{
                  fontFamily: "monospace",
                  textShadow: "1px 1px 0 #000, -1px 1px 0 #000, 1px -1px 0 #000, -1px -1px 0 #000",
                  transform: "scale(1.2)",
                  imageRendering: "pixelated",
                }}
              >
                ?
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bull character */}
      <div className="relative">
        <Image
          src="/images/bull-character.png"
          alt="Bull Security Guard"
          width={100}
          height={150}
          className="object-contain"
        />

        {/* Vertical suspicion meter */}
        {suspicionLevel > 0 && (
          <div className="absolute -right-8 top-0 h-full w-4">
            <div className="bg-gray-800 border-2 border-black h-full w-full rounded-sm overflow-hidden flex flex-col-reverse">
              <div
                className="bg-red-500 w-full transition-all duration-500 rounded-sm"
                style={{ height: `${(suspicionLevel / 3) * 100}%` }}
              ></div>
            </div>
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold bg-red-500 text-white px-1 rounded-sm border border-black">
              ALERT
            </div>
            <div className="absolute bottom-0 left-full ml-1 text-xs font-bold text-white bg-black px-1 rounded-sm">
              {suspicionLevel}/3
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
