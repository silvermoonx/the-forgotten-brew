"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import type { Character, Item, Position } from "../game-engine"

// Import animation functions
import { getLatteAnimationFrame, ANIMATION_LOCK_MODE } from "../../animation/latteAnimator"

// Import Mocha animation function
import { getMochaAnimationFrame } from "../../animation/mochaAnimator"

// Update the Room1Props interface to include the new props
interface Room1Props {
  canvasRef: React.RefObject<HTMLCanvasElement>
  player: Character
  characters: Character[]
  items: Item[]
  hasDisguise: boolean
  isInConeOfSight: (guardPos: Position, playerPos: Position, direction: string) => boolean
  isBehindHedge: (pos: Position) => boolean
  isAtHedgeLine: (y: number) => boolean
  // Add these new props to handle room transitions
  onRoomChange?: (roomId: string) => void
  updatePlayerPosition?: (x: number, y: number) => void
}

interface GameAsset {
  image: HTMLImageElement
  loaded: boolean
}

// Global counter for walking animation
let globalWalkCounter = 0

// Update the showDebug constant to make it toggleable with Ctrl+H
// Replace the existing showDebug constant with this
// Initialize showDebug state outside the component to avoid conditional hook call
const initialShowDebug = false

export default function Room1({
  canvasRef,
  player,
  characters,
  items,
  hasDisguise,
  isInConeOfSight,
  isBehindHedge,
  isAtHedgeLine,
  onRoomChange,
  updatePlayerPosition,
}: Room1Props) {
  const [showDebug, setShowDebug] = useState(initialShowDebug)
  // Add a new state variable for showing the collision grid
  const [showCollisionGrid, setShowCollisionGrid] = useState(false)
  // Add a state variable for the color scheme
  const [colorScheme, setColorScheme] = useState(0)
  // Add a state variable to track if edit mode is enabled
  const [editMode, setEditMode] = useState(false)

  // Add this useEffect to handle the Ctrl+H toggle for debug mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "h" && e.ctrlKey) {
        setShowDebug((prev) => !prev)
        e.preventDefault()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Add this useEffect to handle the "c" key toggle for collision grid
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "c") {
        setShowCollisionGrid((prev) => !prev)
        e.preventDefault()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Add this useEffect to handle the number keys for changing color schemes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Number keys 1-4 to change color schemes
      if (e.key >= "1" && e.key <= "4") {
        const schemeNumber = Number.parseInt(e.key) - 1
        setColorScheme(schemeNumber)
        e.preventDefault()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Add this useEffect to handle the "e" key toggle for edit mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "e") {
        setEditMode((prev) => !prev)
        // If enabling edit mode, also enable collision grid
        if (!showCollisionGrid) {
          setShowCollisionGrid(true)
        }
        e.preventDefault()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showCollisionGrid])

  // Add this useEffect to handle the "s" key to save/export the collision map
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "s" && e.ctrlKey && editMode) {
        e.preventDefault()
        exportCollisionMap()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [editMode])

  // Add the new collision map after the debug flag

  // Replace the existing COLLISION_MAP with this updated version that matches the reference images
  const COLLISION_MAP = [
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 2, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [2, 2, 2, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 2, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 2, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [2, 2, 2, 0, 1, 1, 1, 1, 1, 0, 0, 0, 2, 0, 2, 0],
    [0, 2, 0, 0, 1, 1, 3, 1, 1, 0, 0, 2, 2, 0, 2, 2],
    [0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 2, 0, 2, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ]

  // Add this function to convert pixel coordinates to collision map coordinates
  // Update the pixelToCollisionCoords function to correctly map pixel coordinates to collision grid
  const pixelToCollisionCoords = (pixelX: number, pixelY: number) => {
    // The TILE_SIZE (32) represents your tile size in pixels
    const gridX = Math.floor(pixelX / 32)
    // Fix the Y coordinate calculation - the original formula was incorrect
    const gridY = Math.floor(8 - pixelY / 32) // Adjust to match the 9-row grid (0-8)
    return { gridX, gridY }
  }

  // Update the checkCollision function to use the new collision map
  const checkCollision = (x: number, y: number): number => {
    // Make sure we're within the bounds of the collision map
    if (x < 0 || y < 0 || x >= COLLISION_MAP[0].length || y >= COLLISION_MAP.length) {
      return 1 // Default to solid if out of bounds
    }

    return COLLISION_MAP[y][x]
  }

  // Update the canMoveToPosition function to use the new collision map
  // Update the canMoveToPosition function to properly check collisions
  const canMoveToPosition = (x: number, y: number, onRoomChange?: (roomId: string) => void): boolean => {
    // Convert from game coordinates to collision map coordinates
    const { gridX, gridY } = pixelToCollisionCoords(x, y)

    // Add debug logging if showDebug is enabled
    if (showDebug) {
      console.log(`Checking position (${x}, ${y}) -> Grid: (${gridX}, ${gridY})`)
      console.log(`Collision value: ${checkCollision(gridX, gridY)}`)
    }

    // Get the collision value at this position
    const collisionValue = checkCollision(gridX, gridY)

    // Check if this is a door (value 3) - we can move there, but it will trigger a room change
    if (collisionValue === 3) {
      // If we have the onRoomChange callback, trigger it
      if (onRoomChange) {
        // Use setTimeout to ensure the move completes before changing rooms
        setTimeout(() => {
          onRoomChange("ROOM2")
        }, 100)
      }
      return true
    }

    // Return true if the position is walkable (value 0)
    // Return false for walls (value 1) and trees (value 2)
    return collisionValue === 0
  }

  // Add a new function to check if a move would result in a collision
  // This will be used for continuous collision checking
  // Fix the wouldCollide function to properly check for collisions with walls and trees
  // This function is used for continuous collision checking

  const wouldCollide = (pixelX: number, pixelY: number): boolean => {
    // Get the collision value at this position
    const { gridX, gridY } = pixelToCollisionCoords(pixelX, pixelY)
    const collisionValue = checkCollision(gridX, gridY)

    // Return true if there would be a collision (not walkable and not a door)
    // Values 1 (walls) and 2 (trees) should block movement
    return collisionValue === 1 || collisionValue === 2
  }

  // Remove the checkCollision function since we're not using it anymore

  // Add this useEffect to ensure the canvas gets focus
  useEffect(() => {
    // Focus the canvas when Room1 mounts
    if (canvasRef.current) {
      canvasRef.current.focus()

      // Add tabIndex to make the canvas focusable
      canvasRef.current.tabIndex = 0
    }
  }, [canvasRef])

  // Update the canvas dimensions to fill the screen
  const canvasWidth = window.innerWidth
  const canvasHeight = window.innerHeight

  // Grid size - 16x9 grid (adjust cell size based on screen dimensions)
  const cellWidth = canvasWidth / 16
  const cellHeight = canvasHeight / 9

  // Animation frame ref
  const animationFrameRef = useRef<number>()

  // Update the game assets state to include all the necessary sprites
  // Find the game assets state declaration and update it

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
    // Add bull costume overlay assets
    bullCostumeDown: { image: new Image(), loaded: false },
    bullCostumeUp: { image: new Image(), loaded: false },
    bullCostumeLeft: { image: new Image(), loaded: false },
    bullCostumeRight: { image: new Image(), loaded: false },
  })

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

    // Load walking animation frames
    loadAsset("bearLeftWalk1", "/images/latte_left_walking1.png")
    loadAsset("bearLeftWalk2", "/images/latte_left_walking2.png")
    loadAsset("bearRightWalk1", "/images/latte_right_walking1.png")
    loadAsset("bearRightWalk2", "/images/latte_right_walking2.png")
    loadAsset("bearUpWalk1", "/images/latte_up_walking1.png")
    loadAsset("bearUpWalk2", "/images/latte_up_walking2.png")
    loadAsset("bearDownWalk1", "/images/latte_down_walking1.png")
    loadAsset("bearDownWalk2", "/images/latte_down_walking2.png")

    // Load Mocha sprites
    loadAsset("hamsterLeft", "/images/Mocha_left_standing.png")
    loadAsset("hamsterRight", "/images/Mocha_right_standing.png")
    loadAsset("hamsterUp", "/images/Mocha_up_standing.png")
    loadAsset("hamsterDown", "/images/mocha_down_standing.png")

    // Load Mocha walking animation frames
    loadAsset("hamsterLeftWalk1", "/images/Mocha_left_walking1.png")
    loadAsset("hamsterLeftWalk2", "/images/Mocha_left_walking2.png")
    loadAsset("hamsterRightWalk1", "/images/Mocha_right_walking1.png")
    loadAsset("hamsterRightWalk2", "/images/Mocha_right_walking2.png")
    loadAsset("hamsterUpWalk1", "/images/Mocha_up_walking1.png")
    loadAsset("hamsterUpWalk2", "/images/Mocha_up_walking2.png")
    loadAsset("hamsterDownWalk1", "/images/Mocha_down_walking1.png")
    loadAsset("hamsterDownWalk2", "/images/Mocha_down_walking2.png")

    // Load other character and item assets
    loadAsset("bullGuard", "/images/bull-character.png")
    loadAsset("corn", "/images/corn_new.png")
    loadAsset("bullCostume", "/images/bull-costume-new.png")

    // Load bull costume overlay assets
    loadAsset("bullCostumeDown", "/images/bull_costume_down.png")
    loadAsset("bullCostumeUp", "/images/bull_costume_up.png")
    loadAsset("bullCostumeLeft", "/images/bull_costume_left.png")
    loadAsset("bullCostumeRight", "/images/bull_costume_right.png")

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

  // Add this function to check collision at a specific position
  // Update the canMoveToPosition function to use the collision map

  // Add this function to handle canvas clicks for editing tiles
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editMode || !showCollisionGrid) return

    const canvas = canvasRef.current
    if (!canvas) return

    // Get click coordinates relative to canvas
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Convert to grid coordinates
    const gridX = Math.floor(x / cellWidth)
    const gridY = Math.floor(y / cellHeight)

    // Make sure we're within the bounds of the collision map
    if (gridX < 0 || gridY < 0 || gridX >= COLLISION_MAP[0].length || gridY >= COLLISION_MAP.length) {
      return
    }

    // Create a copy of the collision map
    const newCollisionMap = [...COLLISION_MAP]

    // Cycle through collision values (0 -> 1 -> 2 -> 3 -> 0)
    newCollisionMap[gridY][gridX] = (newCollisionMap[gridY][gridX] + 1) % 4

    // Update the collision map
    COLLISION_MAP[gridY][gridX] = newCollisionMap[gridY][gridX]

    // Force a re-render
    setEditMode(editMode)
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
      drawPlayer(ctx, hasDisguise)

      // In the render function, add this after drawPlayer:
      // Draw collision grid overlay if enabled
      if (showCollisionGrid) {
        drawCollisionGrid(ctx)
      }

      // Add this line to draw the debug collision box
      drawDebugCollisionBox(ctx)

      // Increment global walk counter
      globalWalkCounter++
    }

    // Render once
    render()

    // Set up animation frame
    animationFrameRef.current = requestAnimationFrame(function loop() {
      render()

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
    isInConeOfSight,
    isBehindHedge,
    isAtHedgeLine,
    assets,
    canvasWidth,
    canvasHeight,
    onRoomChange,
    showDebug,
    showCollisionGrid, // Add this
    colorScheme,
    editMode,
  ])

  // Update the drawBaseLayer function to use the single background image
  const drawBaseLayer = (ctx: CanvasRenderingContext2D) => {
    // Draw the single background image
    if (assets.baseLayer.loaded) {
      ctx.drawImage(assets.baseLayer.image, 0, 0, canvasWidth, canvasHeight)
    } else {
      // Fallback if image not loaded
      ctx.fillStyle = "#D2B48C" // Sandy/dirt color
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    }

    // Draw subtle grid lines if needed for debugging
    if (showDebug) {
      // Draw collision map overlay
      for (let y = 0; y < COLLISION_MAP.length; y++) {
        for (let x = 0; x < COLLISION_MAP[0].length; x++) {
          const value = COLLISION_MAP[y][x]

          // Different colors for different collision types
          let color = "rgba(0, 255, 0, 0.2)" // Walkable (0) - green
          if (value === 1) color = "rgba(255, 0, 0, 0.3)" // Solid building (1) - red
          if (value === 2) color = "rgba(0, 0, 255, 0.3)" // Solid tree (2) - blue
          if (value === 3) color = "rgba(255, 255, 0, 0.3)" // Door (3) - yellow

          // Calculate screen position (invert Y since collision map is top-down but game is bottom-up)
          const screenX = x * cellWidth
          const screenY = y * cellHeight

          ctx.fillStyle = color
          ctx.fillRect(screenX, screenY, cellWidth, cellHeight)

          // Show collision values
          ctx.fillStyle = "black"
          ctx.font = "10px Arial"
          ctx.textAlign = "center"
          ctx.fillText(value.toString(), screenX + cellWidth / 2, screenY + cellHeight / 2)
        }
      }

      // Draw grid lines
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

  // Modify the drawCollisionGrid function to use different color schemes
  const drawCollisionGrid = (ctx: CanvasRenderingContext2D) => {
    // Define different color schemes
    const colorSchemes = [
      // Default scheme
      {
        walkable: "rgba(0, 255, 0, 0.3)", // Green
        wall: "rgba(255, 0, 0, 0.4)", // Red
        special: "rgba(0, 0, 255, 0.4)", // Blue
        door: "rgba(255, 255, 0, 0.5)", // Yellow
        name: "Default",
      },
      // High contrast scheme
      {
        walkable: "rgba(0, 0, 0, 0.1)", // Nearly transparent black
        wall: "rgba(255, 0, 0, 0.7)", // Bright red
        special: "rgba(0, 0, 255, 0.7)", // Bright blue
        door: "rgba(255, 255, 0, 0.7)", // Bright yellow
        name: "High Contrast",
      },
      // Pastel scheme
      {
        walkable: "rgba(173, 255, 173, 0.4)", // Light green
        wall: "rgba(255, 173, 173, 0.5)", // Light red
        special: "rgba(173, 173, 255, 0.5)", // Light blue
        door: "rgba(255, 255, 173, 0.6)", // Light yellow
        name: "Pastel",
      },
      // Grayscale scheme
      {
        walkable: "rgba(255, 255, 255, 0.2)", // Light gray
        wall: "rgba(0, 0, 0, 0.7)", // Black
        special: "rgba(100, 100, 100, 0.5)", // Medium gray
        door: "rgba(200, 200, 200, 0.6)", // Dark gray
        name: "Grayscale",
      },
    ]

    // Get the current color scheme
    const scheme = colorSchemes[colorScheme % colorSchemes.length]

    // Draw collision map overlay with semi-transparent colors
    for (let y = 0; y < COLLISION_MAP.length; y++) {
      for (let x = 0; x < COLLISION_MAP[0].length; x++) {
        const value = COLLISION_MAP[y][x]

        // Different colors for different collision types
        let color = scheme.walkable // Walkable (0)
        if (value === 1) color = scheme.wall // Solid building (1)
        if (value === 2) color = scheme.special // Solid tree (2)
        if (value === 3) color = scheme.door // Door (3)

        // Calculate screen position
        const screenX = x * cellWidth
        const screenY = y * cellHeight

        ctx.fillStyle = color
        ctx.fillRect(screenX, screenY, cellWidth, cellHeight)

        // Show collision values
        ctx.fillStyle = "white"
        ctx.font = "bold 12px Arial"
        ctx.textAlign = "center"
        ctx.fillText(value.toString(), screenX + cellWidth / 2, screenY + cellHeight / 2)

        // Draw grid lines
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"
        ctx.lineWidth = 1
        ctx.strokeRect(screenX, screenY, cellWidth, cellHeight)
      }
    }

    // Add a legend in the top-right corner
    const legendX = canvasWidth - 150
    const legendY = 20
    const legendWidth = 130
    const legendHeight = editMode ? 160 : 140

    // Legend background
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight)
    ctx.strokeStyle = "white"
    ctx.strokeRect(legendX, legendY, legendWidth, legendHeight)

    // Legend title
    ctx.fillStyle = "white"
    ctx.font = "bold 12px Arial"
    ctx.textAlign = "center"
    ctx.fillText(`Collision Map (${scheme.name})`, legendX + legendWidth / 2, legendY + 15)

    // Edit mode indicator
    if (editMode) {
      ctx.fillStyle = "rgba(255, 100, 100, 0.7)"
      ctx.fillRect(legendX + 10, legendY + 25, legendWidth - 20, 18)
      ctx.fillStyle = "white"
      ctx.font = "bold 12px Arial"
      ctx.textAlign = "center"
      ctx.fillText("EDIT MODE ON", legendX + legendWidth / 2, legendY + 38)
    }

    // Legend items
    const items = [
      { color: scheme.walkable, text: "0: Walkable" },
      { color: scheme.wall, text: "1: Wall/Building" },
      { color: scheme.special, text: "2: Tree/Special" },
      { color: scheme.door, text: "3: Door" },
    ]

    ctx.textAlign = "left"
    ctx.font = "12px Arial"
    items.forEach((item, index) => {
      const itemY = legendY + (editMode ? 55 : 35) + index * 20

      // Color box
      ctx.fillStyle = item.color
      ctx.fillRect(legendX + 10, itemY - 10, 15, 15)
      ctx.strokeStyle = "white"
      ctx.strokeRect(legendX + 10, itemY - 10, 15, 15)

      // Text
      ctx.fillStyle = "white"
      ctx.fillText(item.text, legendX + 35, itemY)
    })

    // Add toggle instruction
    ctx.fillStyle = "white"
    ctx.font = "10px Arial"
    ctx.fillText("Press 'C' to toggle", legendX + legendWidth / 2, legendY + legendHeight - 35)
    ctx.fillText("Press 1-4 to change colors", legendX + legendWidth / 2, legendY + legendHeight - 20)
    ctx.fillText(
      editMode ? "Press 'E' to exit edit mode" : "Press 'E' to edit tiles",
      legendX + legendWidth / 2,
      legendY + legendHeight - 5,
    )
  }

  // Add a function to export the collision map
  const exportCollisionMap = () => {
    const mapString = JSON.stringify(COLLISION_MAP)
    console.log("Collision Map:", mapString)

    // Create a blob and download link
    const blob = new Blob([mapString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "collision_map.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Add a visual debug function to show the player's collision box
  const drawDebugCollisionBox = (ctx: CanvasRenderingContext2D) => {
    if (!showDebug && !showCollisionGrid) return

    // Calculate the player's collision box
    const TILE_SIZE = 32
    const playerGridX = Math.floor(player.pixelX / TILE_SIZE)
    const playerGridY = Math.floor(8 - player.pixelY / TILE_SIZE)

    // Draw the player's current grid cell
    const cellX = playerGridX * cellWidth
    const cellY = playerGridY * cellHeight

    // Draw a highlighted box around the player's current grid cell
    ctx.strokeStyle = "rgba(255, 255, 0, 0.8)"
    ctx.lineWidth = 3
    ctx.strokeRect(cellX, cellY, cellWidth, cellHeight)

    // Add text showing the player's exact position
    ctx.fillStyle = "rgba(255, 255, 0, 0.9)"
    ctx.font = "12px Arial"
    ctx.textAlign = "center"
    ctx.fillText(`Player: (${player.pixelX.toFixed(1)}, ${player.pixelY.toFixed(1)})`, cellX + cellWidth / 2, cellY - 5)
    ctx.fillText(`Grid: (${playerGridX}, ${playerGridY})`, cellX + cellWidth / 2, cellY - 20)

    // Check and display the collision value
    const collisionValue = checkCollision(playerGridX, playerGridY)
    ctx.fillStyle =
      collisionValue === 0
        ? "rgba(0, 255, 0, 0.9)"
        : collisionValue === 3
          ? "rgba(255, 255, 0, 0.9)"
          : "rgba(255, 0, 0, 0.9)"
    ctx.fillText(`Collision: ${collisionValue}`, cellX + cellWidth / 2, cellY - 35)
  }

  // Remove the unused functions that were drawing individual elements
  // since we're now using a single background image
  // Remove: drawBuildings, drawFountain, drawCrates, drawBoxes, drawHedges, drawTrees

  // Draw character
  const drawCharacter = (ctx: CanvasRenderingContext2D, character: Character) => {
    // Skip rendering characters that are in inventory or not visible
    if (character.inInventory || character.visible === false) {
      return
    }

    // Calculate canvas coordinates directly from pixel position
    const TILE_SIZE = 32
    const x = (character.pixelX / TILE_SIZE - 1) * cellWidth
    const y = canvasHeight - (character.pixelY / TILE_SIZE) * cellHeight

    if (character.type === "HAMSTER") {
      // Use the getMochaAnimationFrame function to get the correct sprite
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
  const drawPlayer = (ctx: CanvasRenderingContext2D, hasDisguise: boolean) => {
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
        // Scale up by 25% (1.25 scale factor) - moderately larger than bull guards
        const scaleFactor = 1.25
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

  // Add the getOriginalAnimationFrame function if it doesn't exist
  // This should be placed after the drawPlayer function

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

  // Remove or comment out this section if it exists
  /*
    <div className="absolute top-4 right-4 flex gap-2">
      <KeyIndicator keyLabel="WASD" text="Move" />
      ...other indicators...
    </div>
    */

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      onClick={handleCanvasClick}
      style={{ background: "black" }}
    />
  )
}
