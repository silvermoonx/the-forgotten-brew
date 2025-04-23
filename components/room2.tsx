"use client"

import { useRef, useEffect, useState } from "react"
import BullAlert from "./bull-alert"
import SuspicionMeter from "./suspicion-meter"

export default function Room2({
  setPlayerPosition,
  setMochaDroppedOff,
  suspicionLevel,
  setSuspicionLevel,
  setSelectedBracelet,
  setPuzzleCompleted,
  setSecurityDoorUnlocked,
  setTodoList,
  todoList,
  setShowIpadModal,
  setCodeAttempts,
  setShowSuspicionWarning,
  setNotification,
  bullGuardScreenPos,
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showBullAlert, setShowBullAlert] = useState(false)

  // Canvas dimensions
  const canvasWidth = window.innerWidth
  const canvasHeight = window.innerHeight

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas dimensions to fill the screen
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    // Draw a completely blank room
    drawBlankRoom(ctx)

    // Handle window resize
    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        drawBlankRoom(ctx)
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [canvasWidth, canvasHeight])

  // Draw a blank room with just walls and floor
  const drawBlankRoom = (ctx: CanvasRenderingContext2D) => {
    // Floor
    ctx.fillStyle = "#8B4513" // Brown
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // Floor tiles
    ctx.strokeStyle = "#6B3E26"
    ctx.lineWidth = 1

    const tileSize = 50
    for (let x = 0; x < canvasWidth; x += tileSize) {
      for (let y = 0; y < canvasHeight; y += tileSize) {
        ctx.strokeRect(x, y, tileSize, tileSize)
      }
    }

    // Walls
    ctx.fillStyle = "#A0522D" // Sienna

    // Top wall
    ctx.fillRect(0, 0, canvasWidth, 20)

    // Left wall
    ctx.fillRect(0, 0, 20, canvasHeight)

    // Right wall
    ctx.fillRect(canvasWidth - 20, 0, 20, canvasHeight)

    // Bottom wall
    ctx.fillRect(0, canvasHeight - 20, canvasWidth, 20)

    // Door (where player entered)
    ctx.fillStyle = "#8B4513" // Brown
    ctx.fillRect(canvasWidth / 2 - 30, canvasHeight - 20, 60, 20)

    // Room label
    ctx.fillStyle = "#FFF"
    ctx.font = "20px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Room 2: Inside Bull.SH Coffee HQ", canvasWidth / 2, 50)

    // Player spawn point indicator (just a small circle in the middle)
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)"
    ctx.beginPath()
    ctx.arc(canvasWidth / 2, canvasHeight / 2, 20, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // Function to handle iPad failure
  const handleIpadFailure = () => {
    // Increase suspicion and show bull alert
    increaseSuspicion()
    setShowBullAlert(true)

    // Reset code attempts
    setCodeAttempts(0)

    // Close the modal
    setShowIpadModal(false)
  }

  // Function to increase suspicion level
  const increaseSuspicion = () => {
    setSuspicionLevel((prev) => {
      const newLevel = prev + 1

      // If suspicion reaches max, reset the room
      if (newLevel >= 3) {
        // Game over - restart room
        setNotification("You've been caught! Restarting room...")
        setTimeout(() => {
          // Reset room state
          setPlayerPosition({ x: 400, y: 750 }) // Updated y position to match our new anchor point
          setMochaDroppedOff(false)
          setSuspicionLevel(0)
          setSelectedBracelet(null)
          setPuzzleCompleted(false)
          setSecurityDoorUnlocked(false)
          setTodoList(todoList.map((item) => ({ ...item, completed: false })))
          setNotification(null)
        }, 3000)
      }

      return newLevel
    })
  }

  return (
    <div className="relative w-full h-screen">
      <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} className="w-full h-full" />
      <div className="absolute top-4 left-4 bg-black/70 text-white p-2 rounded">
        <p>Room 2: Inside Bull.SH Coffee HQ</p>
        <p className="text-xs text-gray-300">You made it inside! Press ESC to return to menu.</p>
      </div>

      {/* Suspicion Meter - positioned next to the bull */}
      <SuspicionMeter
        level={suspicionLevel}
        maxLevel={3}
        position={
          bullGuardScreenPos
            ? {
                x: bullGuardScreenPos.x,
                y: bullGuardScreenPos.y,
              }
            : undefined
        }
      />

      {/* Bull Alert Animation */}
      <BullAlert
        position={{
          x: bullGuardScreenPos.x + 16,
          y: bullGuardScreenPos.y,
        }}
        visible={showBullAlert}
        onAnimationComplete={() => setShowBullAlert(false)}
      />
    </div>
  )
}
