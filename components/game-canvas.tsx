"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import type { Character, Item, Position } from "./rpg-game"

// Import the animation logic
import {
  getLatteAnimationFrame,
  ANIMATION_LOCK_MODE,
  initAnimationState,
  updateAnimationState,
  type AnimationState,
} from "../animation/latteAnimator"

// Import Mocha's animation logic
import { getMochaAnimationFrame } from "../animation/mochaAnimator"

interface GameCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>
  player: Character
  characters: Character[]
  items: Item[]
  hasDisguise: boolean
  isLineOfSightBlocked: (guardPos: Position, playerPos: Position, direction: string) => boolean
  isBehindHedge: (pos: Position) => boolean
  isAtHedgeLine: (y: number) => boolean
}

interface GameAsset {
  image: HTMLImageElement
  loaded: boolean
}

// Global counter for walking animation
let globalWalkCounter = 0

export default function GameCanvas({
  canvasRef,
  player,
  characters,
  items,
  hasDisguise,
  isLineOfSightBlocked,
  isBehindHedge,
  isAtHedgeLine,
}: GameCanvasProps) {
  // Update the canvas dimensions to fill the screen
  const canvasWidth = window.innerWidth
  const canvasHeight = window.innerHeight

  // Grid size - 16x9 grid (adjust cell size based on screen dimensions)
  const cellWidth = canvasWidth / 16
  const cellHeight = canvasHeight / 9

  // Animation frame ref
  const animationFrameRef = useRef<number>()

  // Game assets
  const [assets, setAssets] = useState<Record<string, GameAsset>>({
    baseLayer: { image: new Image(), loaded: false },
    bullHQ: { image: new Image(), loaded: false },
    trees: { image: new Image(), loaded: false },
    bullGuard: { image: new Image(), loaded: false },
    bear: { image: new Image(), loaded: false },
    hamster: { image: new Image(), loaded: false },
    corn: { image: new Image(), loaded: false },
    bullCostume: { image: new Image(), loaded: false },
    hamsterLeft: { image: new Image(), loaded: false },
    hamsterRight: { image: new Image(), loaded: false },
    hamsterUp: { image: new Image(), loaded: false },
    hamsterDown: { image: new Image(), loaded: false },
    bearLeft: { image: new Image(), loaded: false },
    bearRight: { image: new Image(), loaded: false },
    bearUp: { image: new Image(), loaded: false },
    bearDown: { image: new Image(), loaded: false },
    // Add walking animation frames for Latte
    bearLeftWalk1: { image: new Image(), loaded: false },
    bearLeftWalk2: { image: new Image(), loaded: false },
    bearRightWalk1: { image: new Image(), loaded: false },
    bearRightWalk2: { image: new Image(), loaded: false },
    bearUpWalk1: { image: new Image(), loaded: false },
    bearUpWalk2: { image: new Image(), loaded: false },
    bearDownWalk1: { image: new Image(), loaded: false },
    bearDownWalk2: { image: new Image(), loaded: false },
    // Add walking animation frames for Mocha
    hamsterLeftWalk1: { image: new Image(), loaded: false },
    hamsterLeftWalk2: { image: new Image(), loaded: false },
    hamsterRightWalk1: { image: new Image(), loaded: false },
    hamsterRightWalk2: { image: new Image(), loaded: false },
    hamsterUpWalk1: { image: new Image(), loaded: false },
    hamsterUpWalk2: { image: new Image(), loaded: false },
    hamsterDownWalk1: { image: new Image(), loaded: false },
    hamsterDownWalk2: { image: new Image(), loaded: false },
  })

  const [playerAnimState, setPlayerAnimState] = useState<AnimationState>(
    initAnimationState(player, hasDisguise ? "BULL_DISGUISE" : "NONE"),
  )

  // Add this to track previous position for distance calculation
  const prevPlayerPosition = useRef({ pixelX: player.pixelX, pixelY: player.pixelY })

  // Load assets
  useEffect(() => {
    const newAssets = { ...assets }
    const loadedAssets = new Set()

    // Create a function to load an asset
    const loadAsset = (key: string, url: string) => {
      if (loadedAssets.has(url)) return

      loadedAssets.add(url)
      newAssets[key].image.src = url
      newAssets[key].image.crossOrigin = "anonymous" // Add this to avoid CORS issues
      newAssets[key].image.onload = () => {
        newAssets[key].loaded = true
        setAssets({ ...newAssets })
      }
      newAssets[key].image.onerror = (e) => {
        console.warn(`Failed to load asset ${key} from ${url}`, e)
      }
    }

    // Load essential assets first with the direct URLs
    loadAsset(
      "baseLayer",
      "/images/Scene1-GroundMap.png", // Scene1-GroundMap.png
    )
    loadAsset(
      "trees",
      "/images/Scene1-Trees.png", // Scene1-Trees.png
    )
    loadAsset(
      "bullHQ",
      "/images/Scene1-BullSH-HQ.png", // Scene1-BullSH-HQ.png
    )

    // Load character assets
    loadAsset("bearDown", "/images/latte_down_standing.png")
    loadAsset("bearLeft", "/images/latte_left_standing.png")
    loadAsset("bearRight", "/images/latte_right_standing.png")
    loadAsset("bearUp", "/images/latte_up_standing.png")

    // Load remaining assets
    loadAsset("bearLeftWalk1", "/images/latte_left_walking1.png")
    loadAsset("bearLeftWalk2", "/images/latte_left_walking2.png")
    loadAsset("bearRightWalk1", "/images/latte_right_walking1.png")
    loadAsset("bearRightWalk2", "/images/latte_right_walking2.png")
    loadAsset("bearUpWalk1", "/images/latte_up_walking1.png")
    loadAsset("bearUpWalk2", "/images/latte_up_walking2.png")
    loadAsset("bearDownWalk1", "/images/latte_down_walking1.png")
    loadAsset("bearDownWalk2", "/images/latte_down_walking2.png")

    loadAsset("hamsterLeft", "/images/Mocha_left_standing.png")
    loadAsset("hamsterRight", "/images/Mocha_right_standing.png")
    loadAsset("hamsterUp", "/images/Mocha_up_standing.png")
    loadAsset("hamsterDown", "/images/mocha_down_standing.png")

    // Load Mocha's walking animation frames
    loadAsset("hamsterLeftWalk1", "/images/Mocha_left_walking1.png")
    loadAsset("hamsterLeftWalk2", "/images/Mocha_left_walking2.png")
    loadAsset("hamsterRightWalk1", "/images/Mocha_right_walking1.png")
    loadAsset("hamsterRightWalk2", "/images/Mocha_right_walking2.png")
    loadAsset("hamsterUpWalk1", "/images/Mocha_up_walking1.png")
    loadAsset("hamsterUpWalk2", "/images/Mocha_up_walking2.png")
    loadAsset("hamsterDownWalk1", "/images/Mocha_down_walking1.png")
    loadAsset("hamsterDownWalk2", "/images/Mocha_down_walking2.png")

    loadAsset("bullGuard", "/images/bull-character.png")
    loadAsset("corn", "/images/corn_new.png")
    loadAsset("bullCostume", "/images/bull-costume-new.png")

    // Handle window resize
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth
        canvasRef.current.height = window.innerHeight
      }
    }

    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => {
      Object.values(newAssets).forEach((asset) => {
        if (asset.image) {
          asset.image.onload = null
          asset.image.onerror = null
        }
      })
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Helper function to convert game coordinates to canvas coordinates
  // Updated to use offsetX and offsetY directly
  const gameToCanvasCoords = (pos: Position, offsetX = 0, offsetY = 0) => {
    // Convert from 1-based bottom-left origin to canvas coordinates
    // Include pixel offsets for smooth movement
    const x = (pos.x - 1) * cellWidth + offsetX
    const y = canvasHeight - pos.y * cellHeight + offsetY
    return { x, y }
  }

  // Draw the game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas dimensions to fill the screen
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Function to render the game
    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvasWidth, canvasHeight)

      // Draw base layer
      drawBaseLayer(ctx)

      // Draw line of sight for guards
      characters.forEach((character) => {
        if (character.type === "BULL_GUARD" && !character.asleep && !character.fallingAsleep) {
          drawLineOfSight(ctx, character)
        }
      })

      // Draw items
      items.forEach((item) => {
        if (!item.collected) {
          drawItem(ctx, item)
        }
      })

      // Draw characters
      characters.forEach((character) => {
        drawCharacter(ctx, character)
      })

      // Draw player
      drawPlayer(ctx, player, hasDisguise)

      // Increment global walk counter
      globalWalkCounter++
    }

    // Render once
    render()

    // Set up animation frame
    animationFrameRef.current = requestAnimationFrame(function loop() {
      render()

      // Update animation state based on player movement
      if (player.isMoving) {
        const newAnimState = updateAnimationState(player, prevPlayerPosition.current, playerAnimState)
        setPlayerAnimState(newAnimState)
      }

      // Update previous position reference
      prevPlayerPosition.current = { pixelX: player.pixelX, pixelY: player.pixelY }

      animationFrameRef.current = requestAnimationFrame(loop)
    })

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [
    canvasRef,
    player,
    characters,
    items,
    hasDisguise,
    isLineOfSightBlocked,
    isBehindHedge,
    isAtHedgeLine,
    assets,
    canvasWidth,
    canvasHeight,
    playerAnimState,
  ])

  // Draw base layer
  const drawBaseLayer = (ctx: CanvasRenderingContext2D) => {
    // Draw the three layers in order: ground, building, trees

    // 1. Draw the ground layer first
    if (assets.baseLayer.loaded) {
      ctx.drawImage(assets.baseLayer.image, 0, 0, canvasWidth, canvasHeight)
    } else {
      // Fallback if image not loaded
      ctx.fillStyle = "#D2B48C" // Sandy/dirt color
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    }

    // 2. Draw the Bull HQ building
    if (assets.bullHQ.loaded) {
      ctx.drawImage(assets.bullHQ.image, 0, 0, canvasWidth, canvasHeight)
    }

    // 3. Draw the trees layer
    if (assets.trees.loaded) {
      ctx.drawImage(assets.trees.image, 0, 0, canvasWidth, canvasHeight)
    }

    // Draw subtle grid lines if needed for debugging
    const showDebug = false
    if (showDebug) {
      ctx.strokeStyle = "rgba(0, 0, 0, 0.05)"
      ctx.lineWidth = 0.5

      // Draw grid lines
      for (let i = 0; i <= 16; i++) {
        const posX = i * cellWidth

        // Vertical lines
        ctx.beginPath()
        ctx.moveTo(posX, 0)
        ctx.lineTo(posX, canvasHeight)
        ctx.stroke()
      }

      for (let i = 0; i <= 9; i++) {
        const posY = i * cellHeight

        // Horizontal lines
        ctx.beginPath()
        ctx.moveTo(0, posY)
        ctx.lineTo(canvasWidth, posY)
        ctx.stroke()
      }
    }
  }

  // Draw character
  const drawCharacter = (ctx: CanvasRenderingContext2D, character: Character) => {
    // Skip rendering characters that are in inventory or not visible
    // Skip rendering characters that are in inventory (they'll be shown in the inventory UI instead)
    if (character.inInventory) {
      return
    }

    // Calculate canvas coordinates directly from pixel position
    const TILE_SIZE = 32
    const x = (character.pixelX / TILE_SIZE - 1) * cellWidth
    const y = canvasHeight - (character.pixelY / TILE_SIZE) * cellHeight

    if (character.type === "HAMSTER") {
      // Use the getMochaAnimationFrame function to get the correct sprite
      // Pass the actual walkDistance for proper animation
      const assetKey = getMochaAnimationFrame(character.direction, character.isMoving, globalWalkCounter)

      if (assets[assetKey] && assets[assetKey].loaded) {
        // Draw the appropriate directional hamster image
        ctx.drawImage(assets[assetKey].image, x, y, cellWidth, cellHeight)
      } else {
        // Fallback if image not loaded
        // Hamster body
        ctx.fillStyle = "#F5DEB3" // Wheat color
        ctx.beginPath()
        ctx.ellipse(x + cellWidth / 2, y + cellHeight / 2, cellWidth * 0.4, cellHeight * 0.3, 0, 0, Math.PI * 2)
        ctx.fill()

        // Hamster face
        ctx.fillStyle = "#FFE4B5" // Moccasin
        ctx.beginPath()
        ctx.arc(x + cellWidth * 0.6, y + cellHeight * 0.4, cellWidth * 0.2, 0, Math.PI * 2)
        ctx.fill()

        // Hamster ears
        ctx.fillStyle = "#D2B48C" // Tan
        ctx.beginPath()
        ctx.ellipse(x + cellWidth * 0.4, y + cellHeight * 0.3, cellWidth * 0.1, cellHeight * 0.15, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.ellipse(x + cellWidth * 0.6, y + cellHeight * 0.3, cellWidth * 0.1, cellHeight * 0.15, 0, 0, Math.PI * 2)
        ctx.fill()

        // Eyes
        ctx.fillStyle = "#000"
        ctx.beginPath()
        ctx.arc(x + cellWidth * 0.5, y + cellHeight * 0.4, cellWidth * 0.05, 0, Math.PI * 2)
        ctx.arc(x + cellWidth * 0.7, y + cellHeight * 0.4, cellWidth * 0.05, 0, Math.PI * 2)
        ctx.fill()
      }

      // Label
      ctx.fillStyle = "#000"
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      ctx.fillText(character.name, x + cellWidth / 2, y - 5)
    } else if (character.type === "BULL_GUARD") {
      // Bull guard drawing logic remains the same
      if (assets.bullGuard.loaded) {
        // Draw bull guard image
        ctx.drawImage(assets.bullGuard.image, x, y, cellWidth, cellHeight)

        // Add Z's if asleep
        if (character.asleep) {
          ctx.fillStyle = "#fff"
          ctx.font = "16px Arial"
          ctx.textAlign = "center"
          ctx.fillText("Z", x + cellWidth * 0.6, y + cellHeight * 0.3)
          ctx.fillText("Z", x + cellWidth * 0.7, y + cellHeight * 0.2)
        }
      } else {
        // Fallback if image not loaded
        // Bull body
        ctx.fillStyle = character.asleep ? "#8B4513" : "#5D4037" // Brown, lighter if asleep
        ctx.fillRect(x + cellWidth * 0.2, y + cellHeight * 0.2, cellWidth * 0.6, cellHeight * 0.6)

        // Bull horns
        ctx.fillStyle = "#F5F5DC" // Beige
        ctx.beginPath()
        ctx.moveTo(x + cellWidth * 0.2, y + cellHeight * 0.3)
        ctx.lineTo(x + cellWidth * 0.1, y + cellHeight * 0.2)
        ctx.lineTo(x + cellWidth * 0.3, y + cellHeight * 0.3)
        ctx.fill()

        ctx.beginPath()
        ctx.moveTo(x + cellWidth * 0.8, y + cellHeight * 0.3)
        ctx.lineTo(x + cellWidth * 0.9, y + cellHeight * 0.2)
        ctx.lineTo(x + cellWidth * 0.7, y + cellHeight * 0.3)
        ctx.fill()

        // Face or Z's if asleep
        if (character.asleep) {
          ctx.fillStyle = "#fff"
          ctx.font = "12px Arial"
          ctx.textAlign = "center"
          ctx.fillText("Z", x + cellWidth * 0.6, y + cellHeight * 0.3)
          ctx.fillText("Z", x + cellWidth * 0.7, y + cellHeight * 0.2)
        } else {
          // Eyes
          ctx.fillStyle = "#fff"
          ctx.beginPath()
          ctx.arc(x + cellWidth * 0.3, y + cellHeight * 0.4, cellWidth * 0.05, 0, Math.PI * 2)
          ctx.arc(x + cellWidth * 0.7, y + cellHeight * 0.4, cellWidth * 0.05, 0, Math.PI * 2)
          ctx.fill()

          // Pupils
          ctx.fillStyle = "#000"
          ctx.beginPath()
          ctx.arc(x + cellWidth * 0.3, y + cellHeight * 0.4, cellWidth * 0.02, 0, Math.PI * 2)
          ctx.arc(x + cellWidth * 0.7, y + cellHeight * 0.4, cellWidth * 0.02, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
  }

  // Draw player
  const drawPlayer = (ctx: CanvasRenderingContext2D, player: Character, hasDisguise: boolean) => {
    // Calculate canvas coordinates directly from pixel position
    const TILE_SIZE = 32
    const x = (player.pixelX / TILE_SIZE - 1) * cellWidth
    const y = canvasHeight - (player.pixelY / TILE_SIZE) * cellHeight

    // Ensure player is within canvas bounds
    const boundedX = Math.max(0, Math.min(x, canvasWidth - cellWidth))
    const boundedY = Math.max(0, Math.min(y, canvasHeight - cellHeight))

    if (hasDisguise) {
      // Player with bull costume
      if (assets.bullGuard.loaded) {
        // Draw bull guard image for disguised player
        ctx.drawImage(assets.bullGuard.image, boundedX, boundedY, cellWidth, cellHeight)
      } else {
        // Fallback if image not loaded
        // Bull body
        ctx.fillStyle = "#8B4513" // Brown
        ctx.fillRect(boundedX + cellWidth * 0.2, boundedY + cellHeight * 0.2, cellWidth * 0.6, cellHeight * 0.6)

        // Bull horns
        ctx.fillStyle = "#F5F5DC" // Beige
        ctx.beginPath()
        ctx.moveTo(boundedX + cellWidth * 0.2, boundedY + cellHeight * 0.3)
        ctx.lineTo(boundedX + cellWidth * 0.1, boundedY + cellHeight * 0.2)
        ctx.lineTo(boundedX + cellWidth * 0.3, boundedY + cellHeight * 0.3)
        ctx.fill()

        ctx.beginPath()
        ctx.moveTo(boundedX + cellWidth * 0.8, boundedY + cellHeight * 0.3)
        ctx.lineTo(boundedX + cellWidth * 0.9, boundedY + cellHeight * 0.2)
        ctx.lineTo(boundedX + cellWidth * 0.7, boundedY + cellHeight * 0.3)
        ctx.fill()
      }
    } else {
      // Bear character - use directional sprites with walking animation
      // Use our extracted animation logic to get the sprite key
      const assetKey = ANIMATION_LOCK_MODE
        ? getLatteAnimationFrame(player.direction, player.isMoving, globalWalkCounter)
        : getOriginalAnimationFrame(player, globalWalkCounter)

      if (assets[assetKey] && assets[assetKey].loaded) {
        // Draw the appropriate directional bear image with scaling
        // Scale up by 50% (1.5 scale factor) - larger than before
        const scaleFactor = 1.5
        const scaledWidth = cellWidth * scaleFactor
        const scaledHeight = cellHeight * scaleFactor

        // Calculate offset to center the scaled sprite in the cell
        const offsetX = (cellWidth - scaledWidth) / 2
        const offsetY = (cellHeight - scaledHeight) / 2

        // Use Math.floor for pixel-perfect rendering (avoid sub-pixel blur)
        const drawX = Math.floor(boundedX + offsetX)
        const drawY = Math.floor(boundedY + offsetY)

        ctx.drawImage(assets[assetKey].image, drawX, drawY, scaledWidth, scaledHeight)
      } else {
        // Fallback if image not loaded (also scaled)
        const scaleFactor = 1.25
        const centerX = boundedX + cellWidth / 2
        const centerY = boundedY + cellHeight / 2
        const scaledRadius = cellWidth * 0.4 * scaleFactor

        // Bear body (scaled)
        ctx.fillStyle = "#FFF" // White
        ctx.beginPath()
        ctx.ellipse(centerX, centerY, scaledRadius, scaledRadius * 0.75, 0, 0, Math.PI * 2)
        ctx.fill()

        // Bear face
        ctx.fillStyle = "#FFF" // White
        ctx.beginPath()
        ctx.arc(boundedX + cellWidth * 0.6, boundedY + cellHeight * 0.4, cellWidth * 0.2, 0, Math.PI * 2)
        ctx.fill()

        // Bear ears
        ctx.fillStyle = "#FFF" // White
        ctx.beginPath()
        ctx.arc(boundedX + cellWidth * 0.4, boundedY + cellHeight * 0.3, cellWidth * 0.1, 0, Math.PI * 2)
        ctx.arc(boundedX + cellWidth * 0.6, boundedY + cellHeight * 0.3, cellWidth * 0.1, 0, Math.PI * 2)
        ctx.fill()

        // Eyes
        ctx.fillStyle = "#000"
        ctx.beginPath()
        ctx.arc(boundedX + cellWidth * 0.5, boundedY + cellHeight * 0.4, cellWidth * 0.05, 0, Math.PI * 2)
        ctx.arc(boundedX + cellWidth * 0.7, boundedY + cellHeight * 0.4, cellWidth * 0.05, 0, Math.PI * 2)
        ctx.fill()

        // Orange shirt
        ctx.fillStyle = "#FFA500" // Orange
        ctx.fillRect(boundedX + cellWidth * 0.3, boundedY + cellHeight * 0.5, cellWidth * 0.4, cellHeight * 0.3)
      }
    }

    // Label
    ctx.fillStyle = "#000"
    ctx.font = "12px Arial"
    ctx.textAlign = "center"
    ctx.fillText(player.name, boundedX + cellWidth / 2, boundedY - 5)
  }

  // Keep the original animation logic as a fallback
  function getOriginalAnimationFrame(player: Character, globalWalkCounter: number): string {
    // Sync walking animation to distance traveled
    const stridePhase = Math.floor((globalWalkCounter % 32) / 16)
    const walkFrame = stridePhase + 1

    // Determine which sprite to use based on direction and movement state
    if (player.isMoving) {
      // Use walkFrame for walking animation
      switch (player.direction) {
        case "left":
          return `bearLeftWalk${walkFrame}`
        case "right":
          return `bearRightWalk${walkFrame}`
        case "up":
          return `bearUpWalk${walkFrame}`
        case "down":
          return `bearDownWalk${walkFrame}`
      }
    } else {
      // Standing sprite - only show when completely stopped
      switch (player.direction) {
        case "left":
          return "bearLeft"
        case "right":
          return "bearRight"
        case "up":
          return "bearUp"
        case "down":
          return "bearDown"
      }
    }

    // Default fallback
    return "bearDown"
  }

  // Draw item
  const drawItem = (ctx: CanvasRenderingContext2D, item: Item) => {
    const { x, y } = gameToCanvasCoords(item.position)

    if (item.type === "BULL_COSTUME") {
      if (assets.bullCostume.loaded) {
        // Draw bull costume image
        ctx.drawImage(assets.bullCostume.image, x, y, cellWidth, cellHeight)
      } else {
        // Fallback if image not loaded
        // Bull costume (red circle with text)
        ctx.fillStyle = "#FF6B6B" // Red
        ctx.beginPath()
        ctx.arc(x + cellWidth / 2, y + cellHeight / 2, cellWidth * 0.4, 0, Math.PI * 2)
        ctx.fill()

        // Text
        ctx.fillStyle = "#000"
        ctx.font = "bold 12px Arial"
        ctx.textAlign = "center"
        ctx.fillText("BULL", x + cellWidth / 2, y + cellHeight / 2 - 5)
        ctx.fillText("COSTUME", x + cellWidth / 2, y + cellHeight / 2 + 10)
      }
    } else if (item.type === "CORN") {
      if (assets.corn.loaded) {
        // Draw corn image
        ctx.drawImage(assets.corn.image, x, y, cellWidth, cellHeight)
      } else {
        // Fallback if image not loaded
        // Corn cob
        ctx.fillStyle = "#FFD700" // Gold
        ctx.beginPath()
        ctx.ellipse(x + cellWidth / 2, y + cellHeight / 2, cellWidth * 0.2, cellHeight * 0.4, 0, 0, Math.PI * 2)
        ctx.fill()

        // Corn husk
        ctx.fillStyle = "#32CD32" // Lime green
        ctx.beginPath()
        ctx.moveTo(x + cellWidth * 0.3, y + cellHeight * 0.2)
        ctx.lineTo(x + cellWidth * 0.2, y + cellHeight * 0.1)
        ctx.lineTo(x + cellWidth * 0.4, y + cellHeight * 0.3)
        ctx.fill()
      }
    }
  }

  // Draw line of sight for guards
  const drawLineOfSight = (ctx: CanvasRenderingContext2D, character: Character) => {
    if (character.type !== "BULL_GUARD" || character.asleep || character.fallingAsleep) return

    const { x, y } = gameToCanvasCoords(character.position)
    const centerX = x + cellWidth / 2
    const centerY = y + cellHeight / 2

    // Define cone properties - consistent for all guards
    const coneLength = 4 * cellWidth // Fixed cone length of 4 cells for all guards
    const coneAngle = Math.PI / 2 // 90 degrees in radians (45 degrees on each side)
    const hedgeY = gameToCanvasCoords({ x: 1, y: 3 }).y // Y position of the hedge line

    // Set direction angle based on character direction
    let directionAngle
    switch (character.direction) {
      case "up":
        directionAngle = -Math.PI / 2 // -90 degrees
        break
      case "down":
        directionAngle = Math.PI / 2 // 90 degrees
        break
      case "left":
        directionAngle = Math.PI // 180 degrees
        break
      case "right":
        directionAngle = 0 // 0 degrees
        break
    }

    // Calculate cone points
    const startAngle = directionAngle - coneAngle / 2
    const endAngle = directionAngle + coneAngle / 2

    // Draw the cone that stops at the hedge line
    ctx.fillStyle = "rgba(200, 200, 200, 0.3)" // Light grey for line of sight
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)

    // Draw the cone with consistent behavior for all guards
    // First, draw a basic cone
    ctx.arc(centerX, centerY, coneLength, startAngle, endAngle)
    ctx.closePath()
    ctx.fill()

    // If the guard's vision is blocked by the hedge, draw a clipping mask
    if (
      (character.position.y < 3 && character.direction === "up") ||
      (character.position.y > 3 && character.direction === "down")
    ) {
      // Create a clipping region for the hedge
      ctx.save()
      ctx.beginPath()

      // Define the hedge area (from x=7 to x=14 at y=3)
      const hedgeStartX = gameToCanvasCoords({ x: 7, y: 3 }).x
      const hedgeEndX = gameToCanvasCoords({ x: 14, y: 3 }).x

      // If guard is above hedge and looking down
      if (character.position.y > 3 && character.direction === "down") {
        ctx.rect(0, 0, hedgeStartX, canvasHeight) // Left of hedge
        ctx.rect(hedgeEndX, 0, canvasWidth - hedgeEndX, canvasHeight) // Right of hedge
        ctx.rect(0, hedgeY, canvasWidth, canvasHeight - hedgeY) // Below hedge
      }
      // If guard is below hedge and looking up
      else if (character.position.y < 3 && character.direction === "up") {
        ctx.rect(0, 0, hedgeStartX, canvasHeight) // Left of hedge
        ctx.rect(hedgeEndX, 0, canvasWidth - hedgeEndX, canvasHeight) // Right of hedge
        ctx.rect(0, 0, canvasWidth, hedgeY) // Above hedge
      }

      ctx.clip()

      // Redraw the cone with clipping applied
      ctx.fillStyle = "rgba(200, 200, 200, 0.3)"
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, coneLength, startAngle, endAngle)
      ctx.closePath()
      ctx.fill()

      ctx.restore()
    }
  }

  return <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} className="w-full h-full" />
}
