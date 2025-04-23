"use client"

import { useState, useEffect } from "react"
import Player from "./player"
import BullCharacter from "./bull-character"
import Ipad from "./ipad"
import { toast } from "@/components/ui/use-toast"

export default function RoomTwo() {
  const [showIpadModal, setShowIpadModal] = useState(false)
  const [playerPosition, setPlayerPosition] = useState({ x: 100, y: 300 })
  const [ipadInteractionZone, setIpadInteractionZone] = useState({
    x: 400,
    y: 200,
    width: 50,
    height: 50,
  })
  const [bullPosition] = useState({ x: 600, y: 250 })

  // Function to check if player is in iPad interaction zone
  const isPlayerInIpadZone = () => {
    return (
      playerPosition.x > ipadInteractionZone.x - 30 &&
      playerPosition.x < ipadInteractionZone.x + ipadInteractionZone.width + 30 &&
      playerPosition.y > ipadInteractionZone.y - 30 &&
      playerPosition.y < ipadInteractionZone.y + ipadInteractionZone.height + 30
    )
  }

  // Handle player movement
  const handlePlayerMove = (newPosition: { x: number; y: number }) => {
    setPlayerPosition(newPosition)

    // Check if player is in iPad interaction zone
    if (isPlayerInIpadZone()) {
      // Show interaction hint
      // This could be a visual indicator or text prompt
    }
  }

  // Handle player interaction (e.g., pressing 'E' key)
  const handlePlayerInteract = () => {
    if (isPlayerInIpadZone()) {
      console.log("Opening iPad modal")
      setShowIpadModal(true)
    }
  }

  // Handle correct code entered
  const handleCorrectCode = () => {
    // Implement what happens when the correct code is entered
    toast({
      title: "Success!",
      description: "You've unlocked the door!",
    })

    // Close the modal after a delay
    setTimeout(() => {
      setShowIpadModal(false)
    }, 2000)
  }

  // Handle incorrect code entered
  const handleIncorrectCode = () => {
    console.log("Incorrect code entered, increasing bull suspicion")

    // Trigger bull suspicion
    // @ts-ignore
    if (window.bullCharacter && typeof window.bullCharacter.increaseSuspicion === "function") {
      // @ts-ignore
      window.bullCharacter.increaseSuspicion()
      console.log("Bull suspicion increased")
    } else {
      console.error("Bull character or increaseSuspicion function not found")
    }
  }

  // Set up keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 'E' key for interaction
      if (e.key === "e" || e.key === "E") {
        handlePlayerInteract()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    // Expose ejectPlayerFromRoom function to window
    // @ts-ignore
    window.gameState = {
      ...(window.gameState || {}),
      ejectPlayerFromRoom: () => {
        toast({
          title: "Ejected!",
          description: "The security guard has kicked you out for suspicious behavior!",
          variant: "destructive",
        })

        // Implement ejection logic (teleport player, fade out, etc.)
        setPlayerPosition({ x: 100, y: 300 }) // Reset to starting position
      },
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown)

      // @ts-ignore
      if (window.gameState) {
        // @ts-ignore
        delete window.gameState.ejectPlayerFromRoom
      }
    }
  }, [])

  return (
    <div className="relative w-full h-screen bg-gray-200 overflow-hidden">
      {/* Room background */}
      <div className="absolute inset-0 bg-[#f0f0f0]">{/* Room elements like walls, furniture, etc. */}</div>

      {/* iPad interaction zone (invisible) */}
      <div
        className="absolute bg-blue-500 opacity-10 cursor-pointer"
        style={{
          left: `${ipadInteractionZone.x}px`,
          top: `${ipadInteractionZone.y}px`,
          width: `${ipadInteractionZone.width}px`,
          height: `${ipadInteractionZone.height}px`,
        }}
      >
        {/* This is just a visual indicator for development */}
      </div>

      {/* iPad visual (optional) */}
      <div
        className="absolute cursor-pointer"
        style={{
          left: `${ipadInteractionZone.x}px`,
          top: `${ipadInteractionZone.y}px`,
        }}
      >
        <div className="bg-gray-800 rounded-md p-1 transform rotate-15">
          <div className="bg-black w-10 h-14 rounded-sm"></div>
        </div>
      </div>

      {/* Bull character */}
      <BullCharacter position={bullPosition} />

      {/* Player character */}
      <Player position={playerPosition} onMove={handlePlayerMove} />

      {/* iPad modal */}
      {showIpadModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <Ipad
            onCorrectCode={handleCorrectCode}
            onClose={() => setShowIpadModal(false)}
            onIncorrectCode={handleIncorrectCode}
          />
        </div>
      )}

      {/* Interaction hint */}
      {isPlayerInIpadZone() && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-md">
          Press E to interact with iPad
        </div>
      )}
    </div>
  )
}
