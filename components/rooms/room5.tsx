"use client"

import { useRef, useEffect, useState } from "react"
import KeyIndicator from "../key-indicator"
import DialogueBox from "../dialogue-box"
import Image from "next/image"
import QuestSelectionUI from "../quest-selection-ui"

interface Room5Props {
  onExit?: () => void
}

export default function Room5({ onExit }: Room5Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [showDialogue, setShowDialogue] = useState(true)
  const [isTyping, setIsTyping] = useState(true)
  const [showQuestSelection, setShowQuestSelection] = useState(false)
  const [dialogueData, setDialogueData] = useState({
    character: "BULL_GUARD" as "BEAR" | "HAMSTER" | "BULL_GUARD",
    text: [
      "You know, most people knock before entering. But hats off to the both of you for making it this far.",
      "We need to change the filter.",
      "You know how many people rely on our coffee? The productivity numbers speak for themselves.",
      "That's exactly the problem.",
      "Problem? Millions depend on BULL.SH coffee to get through their day.",
      "They depend on it because they've forgotten what coffee was supposed to be about.",
      "And what's that?",
      "Taking a moment. Being present. Actually connecting with someone.",
      "Because your filter cuts out everything else. It's been a year since people had a real choice.",
      "This filter was designed to give people what they asked for - more productive hours, better focus, higher earnings.",
      "But at what cost? When's the last time you actually enjoyed your coffee?",
      "It's not about enjoyment. It's about results.",
      "It can be about both. We just need to change the filter.",
      "And if they continue to choose productivity?",
      "Then let them make that choice consciously. Without a filter forcing it on them.",
      "You know what? Do what you want.",
      "It won't change anything. People have chosen financial wealth.",
      "We think they'll choose differently when they remember there are other options.",
      "Watch what happens when people get to choose for themselves.",
      "Okay, fine. Show me you're so convinced everyone misses this, and I'll let you leave.",
    ],
    currentLine: 0,
    speakerName: "El Capitaurus",
    speakerNames: [
      "El Capitaurus",
      "Latte",
      "El Capitaurus",
      "Mocha",
      "El Capitaurus",
      "Latte",
      "El Capitaurus",
      "Mocha",
      "Latte",
      "El Capitaurus",
      "Mocha",
      "El Capitaurus",
      "Latte",
      "El Capitaurus",
      "Mocha",
      "El Capitaurus",
      "El Capitaurus",
      "Latte",
      "Latte",
      "El Capitaurus",
    ],
  })

  // Update dimensions on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })

      const handleResize = () => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        })
      }

      window.addEventListener("resize", handleResize)
      return () => window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Handle key presses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle dialogue advancement
      if (showDialogue && !isTyping && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault()
        advanceDialogue()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showDialogue, isTyping])

  // Function to advance dialogue
  const advanceDialogue = () => {
    // Only allow advancing if not currently typing
    if (isTyping) return

    if (dialogueData.currentLine < dialogueData.text.length - 1) {
      // Update the speaker name if we have a speakerNames array
      const nextLine = dialogueData.currentLine + 1
      const nextSpeakerName =
        dialogueData.speakerNames && dialogueData.speakerNames[nextLine]
          ? dialogueData.speakerNames[nextLine]
          : dialogueData.speakerName

      setDialogueData({
        ...dialogueData,
        currentLine: nextLine,
        speakerName: nextSpeakerName,
      })
      setIsTyping(true)
    } else {
      // End dialogue and show quest selection
      setShowDialogue(false)
      setShowQuestSelection(true)
    }
  }

  // Get character image based on speaker
  const getCharacterImage = () => {
    const speaker = dialogueData.speakerNames[dialogueData.currentLine]

    if (speaker === "El Capitaurus") {
      return "/images/el-capitaurus-dialogue.png"
    } else if (speaker === "Latte") {
      return "/images/Latte_smile_dialogue.png"
    } else if (speaker === "Mocha") {
      return "/images/Mocha_Narrator_Neutral.png"
    }

    return null
  }

  return (
    <div className="relative w-full h-screen">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/images/background-final-room.png"
          alt="Secret Filter Chamber"
          layout="fill"
          objectFit="cover"
          priority
        />
      </div>

      {/* Global UI Controls */}
      <div className="absolute top-4 right-4 flex gap-2">
        <KeyIndicator keyLabel="SPACE" text="Continue" />
      </div>

      {/* Dialogue Box */}
      {showDialogue && (
        <DialogueBox
          character={dialogueData.character}
          text={dialogueData.text[dialogueData.currentLine]}
          speakerName={dialogueData.speakerName}
          isTyping={isTyping}
          setIsTyping={setIsTyping}
          onAdvanceDialogue={advanceDialogue}
        />
      )}

      {/* Quest Selection UI */}
      {showQuestSelection && (
        <QuestSelectionUI
          onClose={() => {
            if (onExit) onExit()
          }}
        />
      )}
    </div>
  )
}
