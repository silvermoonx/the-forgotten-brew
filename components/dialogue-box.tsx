"use client"

import { useState, useEffect, useRef } from "react"
import type { CharacterType } from "./rpg-game"
import Image from "next/image"

interface DialogueBoxProps {
  character: CharacterType
  text: string
  speakerName: string
  onGiveCorn?: () => void
  showCornOption?: boolean
  isTyping: boolean
  setIsTyping: (isTyping: boolean) => void
  onShowCollectibleSelector?: () => void
  onAdvanceDialogue?: () => void
}

export default function DialogueBox({
  character,
  text,
  speakerName,
  onGiveCorn,
  showCornOption,
  isTyping,
  setIsTyping,
  onShowCollectibleSelector,
  onAdvanceDialogue,
}: DialogueBoxProps) {
  // Check if this is a narrator dialogue
  const isNarrator = speakerName === "NARRATOR"
  const isBothGuards = speakerName === "Both Guards"

  // State for typewriter effect
  const [displayedText, setDisplayedText] = useState("")
  const [canAdvance, setCanAdvance] = useState(false)
  const [typingSound, setTypingSound] = useState<HTMLAudioElement | null>(null)

  // Ref for the text container
  const textRef = useRef<HTMLParagraphElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Create typing sound effect
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sound = new Audio("/typewriter-key.mp3")
      sound.volume = 0.2
      setTypingSound(sound)

      return () => {
        sound.pause()
        sound.currentTime = 0
      }
    }
  }, [])

  // Typewriter effect
  useEffect(() => {
    // Reset state
    setDisplayedText("")
    setIsTyping(true)
    setCanAdvance(false) // Start with canAdvance as false

    // Create an array of characters from the text
    const characters = text.split("")
    let currentIndex = 0

    const startTyping = () => {
      timerRef.current = setInterval(() => {
        if (currentIndex < characters.length) {
          // Build the string character by character
          setDisplayedText(characters.slice(0, currentIndex + 1).join(""))

          // Play typing sound for non-space characters
          if (characters[currentIndex] !== " " && typingSound) {
            // Clone the audio to allow overlapping sounds
            const soundClone = typingSound.cloneNode() as HTMLAudioElement
            soundClone.volume = 0.1
            soundClone.play().catch((e) => console.log("Audio play error:", e))
          }

          currentIndex++
        } else {
          setIsTyping(false)
          // Only set canAdvance to true when typing is completely finished
          setCanAdvance(true)

          if (timerRef.current) clearInterval(timerRef.current)

          // If this is the collectible selection dialogue, show the selector
          if (
            text.includes("Choose one tool inspired by time wealth") ||
            text.includes("Which item do you want to bring")
          ) {
            onShowCollectibleSelector?.()
          }
        }
      }, 30) // Speed of typing
    }

    startTyping()

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [text, setIsTyping, onShowCollectibleSelector, typingSound])

  // Handle key press to advance dialogue only when typing is complete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only allow advancing dialogue when typing is COMPLETELY finished
      if (!isTyping && canAdvance && (e.key === " " || e.key === "Enter") && onAdvanceDialogue) {
        onAdvanceDialogue()
      }

      // Prevent advancing dialogue while typing is in progress
      if (isTyping && (e.key === " " || e.key === "Enter")) {
        e.preventDefault() // Prevent any default behavior
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isTyping, canAdvance, onAdvanceDialogue])

  // Get character image based on character type and speaker name
  const getCharacterImage = () => {
    // Only show character image for non-narrator dialogue
    if (isNarrator) return null

    // Check for Latte (Bear) character
    if (speakerName === "Latte") {
      // Determine which emotion to show based on text content
      if (
        text.includes("!") ||
        text.includes("?") ||
        text.toLowerCase().includes("what") ||
        text.toLowerCase().includes("how")
      ) {
        return "/images/Latte_shocked_dialogue.png"
      } else {
        return "/images/Latte_smile_dialogue.png"
      }
    }
    // Check for Mocha character
    else if (speakerName === "Mocha") {
      // Determine which emotion to show based on text content
      if (
        text.includes("!") ||
        text.includes("?") ||
        text.toLowerCase().includes("what") ||
        text.toLowerCase().includes("how")
      ) {
        return "/images/Mocha_Narrator_Shocked.png"
      } else {
        return "/images/Mocha_Narrator_Neutral.png"
      }
    }
    // Check for El Capitaurus character
    else if (speakerName === "El Capitaurus") {
      return "/images/el-capitaurus-dialogue.png"
    }
    // Check for Bull Guard character
    else if (character === "BULL_GUARD") {
      return "/images/bull-character.png"
    }

    return null
  }

  const characterImage = getCharacterImage()

  return (
    <div className="absolute left-0 right-0 mx-auto flex flex-col items-center z-50" style={{ top: "40%" }}>
      {/* Main dialogue box - Typewriter style */}
      <div className="w-[80%] max-w-[800px] relative animate-fadeIn">
        {/* Character portrait */}
        {characterImage && (
          <div className="absolute -top-[130px] left-6 z-10 animate-bounce-subtle">
            <Image
              src={characterImage || "/placeholder.svg"}
              alt={speakerName}
              width={speakerName === "El Capitaurus" ? 180 : 130}
              height={speakerName === "El Capitaurus" ? 180 : 130}
              className="object-contain"
            />
          </div>
        )}

        {/* Speaker name tag */}
        {!isNarrator && (
          <div className="absolute -top-8 left-[140px] z-20 bg-[#f8f0dd]/95 backdrop-blur-sm border-2 border-[#8b5a2b] px-4 py-1 rounded-t-sm shadow-md">
            <span className="text-[#5c4033] font-mono uppercase tracking-wide font-bold">{speakerName}</span>
          </div>
        )}

        {/* Dialogue box */}
        <div className="bg-[#f8f0dd]/95 backdrop-blur-sm border-4 border-[#8b5a2b] rounded-sm p-6 shadow-lg font-mono min-h-[150px] flex flex-col justify-center transition-all duration-300 relative overflow-hidden">
          {/* Paper texture overlay */}
          <div className="absolute inset-0 bg-[url('/aged-parchment.png')] opacity-10 pointer-events-none"></div>

          {/* Dialogue content */}
          <p
            ref={textRef}
            className="text-[#5c4033] leading-relaxed px-4 py-1 text-lg font-mono tracking-wide relative"
            style={{
              lineHeight: "1.6",
              textShadow: "0.5px 0.5px 0px rgba(0,0,0,0.1)",
            }}
          >
            {displayedText}
            {isTyping ? (
              <span className="inline-block w-2 h-4 bg-[#5c4033] ml-1 animate-blink"></span>
            ) : (
              <span className="animate-bounce inline-block ml-1 text-2xl">▼</span>
            )}
          </p>
        </div>
      </div>

      {/* Corn option buttons - shown in a separate box below */}
      {showCornOption && (
        <div className="w-[80%] max-w-[800px] mt-4 animate-fadeIn">
          <div className="bg-[#f8f0dd]/95 backdrop-blur-sm border-4 border-[#8b5a2b] rounded-sm p-4 shadow-lg relative overflow-hidden">
            {/* Paper texture overlay */}
            <div className="absolute inset-0 bg-[url('/aged-parchment.png')] opacity-10 pointer-events-none"></div>

            {/* Options content */}
            <div className="flex flex-col items-center">
              <div className="text-center mb-3 text-[#5c4033] font-mono uppercase tracking-wide font-bold">
                {isBothGuards ? "Both guards are waiting for your corn!" : "The guard is waiting for your corn!"}
              </div>

              <div className="flex gap-8 justify-center">
                <button
                  onClick={onGiveCorn}
                  className="bg-[#e6d2b3] hover:bg-[#d9c4a3] text-[#5c4033] py-2 px-6 rounded-sm border-2 border-[#8b5a2b] transition-colors flex items-center shadow-md hover:shadow-lg transform hover:scale-105 transition-transform"
                >
                  <span className="mr-2 text-xl">🌽</span>
                  <span className="font-mono uppercase tracking-wide font-bold">GIVE CORN</span>
                  <span className="text-sm ml-2 text-[#5c4033] bg-[#f8f0dd] px-2 py-1 rounded-sm font-mono">E</span>
                </button>

                <button
                  onClick={() => {}} // This will be handled by the N key
                  className="bg-[#e6d2b3] hover:bg-[#d9c4a3] text-[#5c4033] py-2 px-6 rounded-sm border-2 border-[#8b5a2b] transition-colors flex items-center shadow-md hover:shadow-lg transform hover:scale-105 transition-transform"
                >
                  <span className="font-mono uppercase tracking-wide font-bold">DECLINE</span>
                  <span className="text-sm ml-2 text-[#5c4033] bg-[#f8f0dd] px-2 py-1 rounded-sm font-mono">N</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Space/Enter to continue indicator - only shown when typing is complete and can advance */}
      {!isTyping && canAdvance && !showCornOption && (
        <div className="mt-3 px-3 py-1 bg-[#8b5a2b]/70 text-[#f8f0dd] rounded-sm text-xs font-mono tracking-wide shadow-sm animate-pulse">
          Press <span className="font-bold mx-1">Space</span> or <span className="font-bold mx-1">Enter</span> to
          continue
        </div>
      )}
    </div>
  )
}
