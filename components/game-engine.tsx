"use client"

import { useEffect, useRef, useState } from "react"
import DialogueBox from "./dialogue-box"
import KeyIndicator from "./key-indicator"
import CoordinateGrid from "./coordinate-grid"
import Room0 from "./rooms/room0"
import Room1 from "./rooms/room1"
import Room2 from "./rooms/room2"
import Room3 from "./rooms/room3"
import PositionMetric from "./position-metric"
import Notification from "./notification"
import Room4 from "./rooms/room4"
import DevRoomSelector from "./dev-room-selector"
import Room5 from "./rooms/room5"
import EscapeMenu from "./escape-menu"
import MainMenu from "./main-menu"
import Image from "next/image"

// Character names - easily changeable
export const CHARACTER_NAMES = {
  PLAYER: "Latte",
  PARTNER: "Mocha",
  GUARD1: "Bully",
  GUARD2: "Horns",
}

// Game states
export type GameState =
  | "MAIN_MENU" // Add main menu state
  | "INTRO"
  | "PLAYING"
  | "DIALOGUE"
  | "COMPLETE"
  | "GAME_OVER"
  | "ROOM0"
  | "ROOM2"
  | "ROOM3"
  | "ROOM4"
  | "ROOM5"
  | "CORN_SEQUENCE"
  | "MOCHA_WALKING"
  | "COLLECTIBLE_SELECTION"
  | "WAITING_FOR_INVENTORY_CHECK"
  | "DEV_ROOM_SELECTOR"
  | "ESCAPE_MENU" // New state for escape menu

// Character types
export type CharacterType = "BEAR" | "HAMSTER" | "BULL_GUARD"

// Item types
export type ItemType = "BULL_COSTUME" | "CORN"

// Position interface
export interface Position {
  x: number
  y: number
}

// Direction type
export type Direction = "up" | "down" | "left" | "right"

// Update the Character interface to track pure pixel position
export interface Character {
  type: CharacterType
  position: Position // Keep for compatibility with existing code
  direction: Direction
  asleep?: boolean
  visible?: boolean
  name: string
  fallingAsleep?: boolean
  inInventory?: boolean // New property to track if character is in inventory

  // Replace the old movement properties with pure pixel tracking
  pixelX: number // Actual pixel X position
  pixelY: number // Actual pixel Y position
  isMoving: boolean
  targetPixelX?: number // Target pixel X position
  targetPixelY?: number // Target pixel Y position
  nextDirection?: Direction // Track the next direction to move after current movement completes
  animationFrame: number
}

// Item interface
export interface Item {
  type: ItemType
  position: Position
  collected: boolean
  name: string
  description: string
}

// Collectible interface
export interface CollectibleItem {
  name: string
  description: boolean
  emoji: string
}

// Dialogue interface
export interface DialogueData {
  character: CharacterType
  text: string[]
  currentLine: number
  speakerName: string
  guardPosition?: Position // Store guard position for moving player back
  guardIndex?: number // Store guard index for corn interaction
  canGiveCorn?: boolean // Flag to indicate if player can give corn after dialogue
  showCornOption?: boolean // Flag to show corn option in dialogue
  preventAdvance?: boolean // Flag to prevent dialogue from advancing past corn option
  speakerNames?: string[] // Array of speaker names for each line
  movePlayerAfterDecline?: boolean // Flag to indicate if player should be moved after declining corn
  onComplete?: () => void // New callback for when dialogue completes
}

// Notification interface
export interface NotificationData {
  message: string
  duration?: number
}

// Movement constants
export const MOVEMENT_SPEED = 1.7 // Reduced from 2.4 for an even more relaxed walking pace
export const TILE_SIZE = 32 // pixels per tile

// Update the collision detection functions to use hardcoded bounding boxes instead of tile-based logic

// Add collision detection for the image layers
// Define collision zones for buildings, trees, and other obstacles
const COLLISIONS = [
  // Building collision zones
  { type: "building", x1: 4, y1: 4, x2: 8, y2: 9 }, // Main building (Bull.SH Coffee HQ)
  { type: "building", x1: 10, y1: 5, x2: 14, y2: 7 }, // Secondary building

  // Tree collision zones - add more as needed based on the image
  { type: "tree", x: 3, y: 7, radius: 1.0 }, // Left top tree
  { type: "tree", x: 5, y: 8, radius: 1.0 }, // Left middle tree
  { type: "tree", x: 7, y: 7, radius: 1.0 }, // Middle top tree
  { type: "tree", x: 9, y: 8, radius: 1.0 }, // Middle bottom tree
  { type: "tree", x: 11, y: 7, radius: 1.0 }, // Right top tree
  { type: "tree", x: 13, y: 8, radius: 1.0 }, // Right middle tree
  { type: "tree", x: 15, y: 7, radius: 1.0 }, // Far right tree
  { type: "tree", x: 2, y: 5, radius: 1.0 }, // Additional trees
  { type: "tree", x: 4, y: 2, radius: 1.0 },
  { type: "tree", x: 6, y: 1, radius: 1.0 },
  { type: "tree", x: 10, y: 2, radius: 1.0 },
  { type: "tree", x: 12, y: 1, radius: 1.0 },
  { type: "tree", x: 14, y: 3, radius: 1.0 },
  { type: "tree", x: 16, y: 3, radius: 1.0 }, // This tree was causing the Room4 teleport
]

// Update the isPositionInBuilding function to check against the building collision zone
const isPositionInBuilding = (pos: Position) => {
  return COLLISIONS.filter((zone) => zone.type === "building").some(
    (building) => pos.x >= building.x1 && pos.x <= building.x2 && pos.y >= building.y1 && pos.y <= building.y2,
  )
}

// Update the isPositionInHedge function to use the hedge collision zone
const isPositionInHedge = (pos: Position) => {
  return false // No hedge collisions
}

// Update the isPositionInCrate function to handle trees using circular collision
const isPositionInCrate = (pos: Position) => {
  return COLLISIONS.filter((zone) => zone.type === "tree").some((tree) => {
    const distance = Math.sqrt(Math.pow(pos.x - tree.x, 2) + Math.pow(pos.y - tree.y, 2))
    return distance < tree.radius
  })
}

// Update the isPositionInFountain function - remove if not needed
const isPositionInFountain = (pos: Position) => {
  // No fountain in the scene
  return false
}

// Update the isPositionInBox function - remove if not needed
const isPositionInBox = (pos: Position) => {
  // No boxes in the scene
  return false
}

export default function GameEngine() {
  // Game canvas ref
  const canvasRef = useRef(null)

  // Game state - changed initial state to MAIN_MENU
  const [gameState, setGameState] = useState<GameState>("MAIN_MENU")
  const [previousGameState, setPreviousGameState] = useState<GameState>("MAIN_MENU")

  // Set showDebug to false and remove the ability to toggle it
  const [showDebug, setShowDebug] = useState(false)

  // Replace the keysPressed state with a more direct direction-based system
  const [heldKeys, setHeldKeys] = useState({
    left: false,
    right: false,
    up: false,
    down: false,
  })

  // Track which movement keys are currently pressed
  const [keysPressed, setKeysPressed] = useState({
    w: false,
    a: false,
    s: false,
    d: false,
  })

  // Update player starting position to Pixel: (333.8, 241.3) facing right
  const [player, setPlayer] = useState({
    type: "BEAR",
    position: { x: Math.floor(333.8 / TILE_SIZE) + 1, y: Math.floor(241.3 / TILE_SIZE) + 1 },
    direction: "right", // Changed to face right toward Mocha
    visible: true,
    name: CHARACTER_NAMES.PLAYER,
    // Initialize with pure pixel position
    pixelX: 333.8,
    pixelY: 241.3,
    isMoving: false,
    animationFrame: 0,
  })

  // Add a global walkFrameCounter to the player state
  const [globalWalkCounter, setGlobalWalkCounter] = useState(0)

  // Disguise state
  const [hasDisguise, setHasDisguise] = useState(false)

  // Update Mocha's position to Pixel: (357.6, 241.3) facing left
  const [characters, setCharacters] = useState([
    {
      type: "HAMSTER",
      position: { x: Math.floor(357.6 / TILE_SIZE) + 1, y: Math.floor(241.3 / TILE_SIZE) + 1 },
      direction: "left", // Changed to face left toward Latte
      name: CHARACTER_NAMES.PARTNER,
      // Initialize with pure pixel position
      pixelX: 357.6,
      pixelY: 241.3,
      isMoving: false,
      animationFrame: 0,
      inInventory: false, // Initially not in inventory
    },
    {
      type: "BULL_GUARD",
      position: { x: Math.floor(259.0 / TILE_SIZE) + 1, y: Math.floor(52.6 / TILE_SIZE) + 1 }, // Bull 1 updated position
      direction: "up", // Face up toward the path
      asleep: false,
      name: CHARACTER_NAMES.GUARD1,
      // Initialize with pure pixel position
      pixelX: 259.0,
      pixelY: 52.6,
      isMoving: false,
      animationFrame: 0,
    },
    {
      type: "BULL_GUARD",
      position: { x: Math.floor(192.7 / TILE_SIZE) + 1, y: Math.floor(52.6 / TILE_SIZE) + 1 }, // Bull 2 updated position
      direction: "up", // Face up toward the path
      asleep: false,
      name: CHARACTER_NAMES.GUARD2,
      // Initialize with pure pixel position
      pixelX: 192.7,
      pixelY: 52.6,
      isMoving: false,
      animationFrame: 0,
    },
  ])

  // Animation frame ID for smooth movement
  const animationFrameId = useRef(null)

  // Debug ref to track player state between renders
  const playerStateRef = useRef(player)

  // Update items positions - move bull costume and corn to requested positions
  const [items, setItems] = useState([
    {
      type: "BULL_COSTUME",
      position: { x: Math.floor(508.9 / TILE_SIZE) + 1, y: Math.floor(130.8 / TILE_SIZE) + 1 }, // Updated position for bull costume
      collected: false,
      name: "Bull Costume",
      description:
        "A convincing bull costume that allows you to blend in with the bulls. They'll still ask for ID though.",
    },
    {
      type: "CORN",
      position: { x: Math.floor(495.3 / TILE_SIZE) + 1, y: Math.floor(33.9 / TILE_SIZE) + 1 }, // Updated position for corn
      collected: false,
      name: "Seasoned Sleeper Snacks",
      description:
        "Special corn laced with a sleeping agent. Bulls love corn and can't resist it. Will put them to sleep instantly.",
    },
  ])

  // Track if both items have been collected
  const [bothItemsCollected, setBothItemsCollected] = useState(false)

  // Track if Mocha's walking sequence has been triggered
  const [mochaWalkingTriggered, setMochaWalkingTriggered] = useState(false)

  // Collectible items
  const [collectibles, setCollectibles] = useState([
    {
      name: "Pocket Timer",
      description:
        "For when you want to stay present, not productive. A reminder that time is meant to be experienced, not just measured.",
      collected: false,
      emoji: "⏱️",
    },
    {
      name: "Hourglass",
      description: "Remember that time moves, even when you don't. The sands flow whether we acknowledge them or not.",
      collected: false,
      emoji: "⌛",
    },
    {
      name: "Daily To-Do Lists",
      description: "A reminder that progress doesn't have to be perfect. Small steps still move you forward.",
      collected: false,
      emoji: "📝",
    },
    {
      name: "No Meetings Postcard",
      description: "For the boundaries you set. A reminder that your time belongs to you first.",
      collected: false,
      emoji: "📮",
    },
    {
      name: "Later Stamp",
      description: "Not now. Not a priority in my life. Maybe not ever. Permission to postpone without guilt.",
      collected: false,
      emoji: "🔖",
    },
  ])

  // Selected collectible
  const [selectedCollectible, setSelectedCollectible] = useState(null)

  // Dialogue state
  const [dialogue, setDialogue] = useState(null)

  // Notification state
  const [notification, setNotification] = useState(null)

  // Interaction indicators
  const [nearInteractable, setNearTalkable] = useState(false)
  const [nearTalkable, setNearInteractable] = useState(false)
  const [canGiveCorn, setCanGiveCorn] = useState(false)

  // Current guard for corn interaction
  const [currentGuardIndex, setCurrentGuardIndex] = useState(null)

  // Coordinate grid visibility
  const [showCoordinates, setShowCoordinates] = useState(false)

  // Show arrow pointing to door
  const [showDoorArrow, setShowDoorArrow] = useState(false)

  // Remove the inventory-related state
  const [inventoryChecked, setInventoryChecked] = useState(false)

  // Store the next dialogue to show after inventory check
  const [pendingDialogue, setPendingDialogue] = useState(null)

  // Change the doorPosition variable to position the label between the bulls
  // Door position (for the arrow)
  const doorPosition = {
    x: 6 * TILE_SIZE, // Keep x at 6 (between the bulls at x=5 and x=7)
    y: 7 * TILE_SIZE, // Change from 5 to 7 as requested
  }

  // Keep playerStateRef in sync with player state
  useEffect(() => {
    playerStateRef.current = player
  }, [player])

  // Add a new ref to track movement input directly without state updates
  const movementInputRef = useRef({
    left: false,
    right: false,
    up: false,
    down: false,
    lastDirection: "right",
  })

  // Helper function to convert pixel position to grid position
  const pixelToGridPosition = (pixelX, pixelY) => {
    return {
      x: Math.floor(pixelX / TILE_SIZE) + 1, // +1 because our grid is 1-based
      y: Math.floor(pixelY / TILE_SIZE) + 1,
    }
  }

  // Convert exact position to grid position
  const exactToGridPosition = (exactX, exactY) => {
    return {
      x: Math.floor(exactX / TILE_SIZE) + 1, // +1 because our grid is 1-based
      y: Math.floor(exactY / TILE_SIZE) + 1,
    }
  }

  // Function to check if a move is valid (no collisions)
  // Updated to work with exact positions
  // Updated to work with exact positions
  const canMoveToPositionCheck = (exactX, exactY) => {
    // Convert exact position to grid position
    const gridPos = exactToGridPosition(exactX, exactY)

    // Check for collisions with characters (only with awake guards)
    const hasCollision = characters.some(
      (char) =>
        !char.inInventory && // Skip characters in inventory
        char.position.x === gridPos.x &&
        char.position.y === gridPos.y &&
        !char.asleep &&
        !char.fallingAsleep,
    )

    // Check for collisions with buildings
    const isInBuilding = isPositionInBuilding(gridPos)

    // Check for collisions with trees
    const isInTree = isPositionInCrate(gridPos)

    // Return true if there are no collisions
    return !hasCollision && !isInBuilding && !isInTree
  }

  // Fix the updateMovement function to ensure down movement works correctly
  // Completely rewrite the updateMovement function to use pure pixel positions
  const updateMovement = () => {
    // Skip movement updates if not in PLAYING state
    if (gameState !== "PLAYING" && gameState !== "WAITING_FOR_INVENTORY_CHECK") return

    // Log the movement input state for debugging
    console.log("Movement input:", movementInputRef.current)

    const moveStep = MOVEMENT_SPEED
    let moved = false
    let newPixelX = playerStateRef.current.pixelX
    let newPixelY = playerStateRef.current.pixelY
    let newDirection = playerStateRef.current.direction

    // Apply movement based on movement input ref (not state)
    // Use continuous collision checking by testing smaller increments
    const smallStep = moveStep / 4 // Use smaller steps for more precise collision detection

    // Try to move in the X direction
    if (movementInputRef.current.left) {
      for (let step = smallStep; step <= moveStep; step += smallStep) {
        const testX = newPixelX - step
        // Only move if there's no collision
        if (!wouldCollide(testX, newPixelY)) {
          newPixelX = testX
          newDirection = "left"
          moved = true
        } else {
          break // Stop at the first collision
        }
      }
    }
    if (movementInputRef.current.right) {
      for (let step = smallStep; step <= moveStep; step += smallStep) {
        const testX = newPixelX + step
        // Only move if there's no collision
        if (!wouldCollide(testX, newPixelY)) {
          newPixelX = testX
          newDirection = "right"
          moved = true
        } else {
          break // Stop at the first collision
        }
      }
    }

    // Try to move in the Y direction
    if (movementInputRef.current.up) {
      for (let step = smallStep; step <= moveStep; step += smallStep) {
        const testY = newPixelY + step
        // Only move if there's no collision
        if (!wouldCollide(newPixelX, testY)) {
          newPixelY = testY
          newDirection = "up"
          moved = true
        } else {
          break // Stop at the first collision
        }
      }
    }
    if (movementInputRef.current.down) {
      for (let step = smallStep; step <= moveStep; step += smallStep) {
        const testY = newPixelY - step
        // Only move if there's no collision
        if (!wouldCollide(newPixelX, testY)) {
          newPixelY = testY
          newDirection = "down"
          moved = true
        } else {
          break // Stop at the first collision
        }
      }
    }

    // Only update if we actually moved and the new position is valid
    if (moved) {
      // Update global walk counter for animation - directly tied to distance moved
      setGlobalWalkCounter((prev) => prev + moveStep)

      // Calculate the new grid position based on pixel position
      const newGridPos = pixelToGridPosition(newPixelX, newPixelY)

      // Update player state with new position and animation frame
      // Also update playerStateRef directly for immediate effect
      const newPlayerState = {
        ...playerStateRef.current,
        pixelX: newPixelX,
        pixelY: newPixelY,
        position: newGridPos,
        direction: newDirection,
        isMoving: true,
      }

      playerStateRef.current = newPlayerState
      setPlayer(newPlayerState)

      // Check for special tile interactions
      checkSpecialTileInteractions(newGridPos)
    } else if (!playerStateRef.current.isMoving) {
      // If we can't move but direction changed, update direction
      if (newDirection !== playerStateRef.current.direction) {
        const newPlayerState = {
          ...playerStateRef.current,
          direction: newDirection,
        }
        playerStateRef.current = newPlayerState
        setPlayer(newPlayerState)
      }
    }

    // Add this at the end of the updateMovement function, right before the closing brace
    // Reset movement flags after each update to make each key press move only once
    movementInputRef.current.left = false
    movementInputRef.current.right = false
    movementInputRef.current.up = false
    movementInputRef.current.down = false
    // Also update React state for UI updates
    setHeldKeys({
      left: false,
      right: false,
      up: false,
      down: false,
    })
  }

  // Add the wouldCollide function to check for collisions
  const wouldCollide = (pixelX: number, pixelY: number): boolean => {
    // Convert pixel position to grid position
    const gridPos = pixelToGridPosition(pixelX, pixelY)

    // Check for collisions with characters (only with awake guards)
    const hasCollision = characters.some(
      (char) =>
        !char.inInventory && // Skip characters in inventory
        char.position.x === gridPos.x &&
        char.position.y === gridPos.y &&
        !char.asleep &&
        !char.fallingAsleep,
    )

    // Check for collisions with buildings and trees
    const isInBuilding = isPositionInBuilding(gridPos)
    const isInTree = isPositionInCrate(gridPos)

    // Return true if there are any collisions
    return hasCollision || isInBuilding || isInTree
  }

  // Function to update Mocha's movement during the walking sequence
  const updateMochaMovement = () => {
    if (gameState !== "MOCHA_WALKING") return

    // Find Mocha in the characters array
    const mochaIndex = characters.findIndex((char) => char.type === "HAMSTER" && char.name === CHARACTER_NAMES.PARTNER)
    if (mochaIndex === -1 || characters[mochaIndex].inInventory) return

    const mocha = characters[mochaIndex]
    const player = playerStateRef.current

    // Calculate direction to player
    const dx = player.pixelX - mocha.pixelX
    const dy = player.pixelY - mocha.pixelY
    const distance = Math.sqrt(dx * dx + dy * dy)

    // If Mocha is close enough to the player, end the walking sequence
    if (distance < TILE_SIZE / 2) {
      // Add Mocha to inventory
      const newCharacters = [...characters]
      newCharacters[mochaIndex] = {
        ...newCharacters[mochaIndex],
        inInventory: true,
        isMoving: false, // Explicitly set isMoving to false
        visible: false, // Hide Mocha from the game world
      }
      setCharacters(newCharacters)

      // Show dialogue about Mocha joining Latte
      setDialogue({
        character: "HAMSTER",
        text: [
          "Remember, we need to get past those bull guards first.",
          "Use the corn to put them to sleep, then we can enter the building.",
        ],
        currentLine: 0,
        speakerName: "Mocha",
        onComplete: () => {
          // Return to playing state after dialogue
          setGameState("PLAYING")
        },
      })

      // Change game state to dialogue
      setGameState("DIALOGUE")
      return
    }

    // Determine movement direction
    let newDirection: Direction = mocha.direction
    if (Math.abs(dx) > Math.abs(dy)) {
      newDirection = dx > 0 ? "right" : "left"
    } else {
      newDirection = dy > 0 ? "up" : "down"
    }

    // Calculate new position with movement speed
    const moveStep = MOVEMENT_SPEED * 0.8 // Slightly slower than player
    const moveRatio = moveStep / distance
    const newPixelX = mocha.pixelX + dx * moveRatio
    const newPixelY = mocha.pixelY + dy * moveRatio

    // Update Mocha's position
    const newGridPos = pixelToGridPosition(newPixelX, newPixelY)
    const newCharacters = [...characters]
    newCharacters[mochaIndex] = {
      ...newCharacters[mochaIndex],
      pixelX: newPixelX,
      pixelY: newPixelY,
      position: newGridPos,
      direction: newDirection,
      isMoving: true, // Make sure isMoving is set to true during walking
    }
    setCharacters(newCharacters)

    // Update global walk counter for animation
    setGlobalWalkCounter((prev) => prev + moveStep)
  }

  // In the checkSpecialTileInteractions function, keep the original entrance position
  // Function to check for special tile interactions
  const checkSpecialTileInteractions = (position: Position) => {
    // Check if player is at a door tile (collision value 3)
    const gridX = Math.floor(position.x)
    const gridY = Math.floor(position.y)

    // This would need to be replaced with your actual collision checking logic
    const collisionValue = checkCollision(gridX, gridY)

    if (collisionValue === 3) {
      // Enter Room 2
      setGameState("ROOM2")
      return
    }

    // Check if player is entering the detection zone without a disguise
    if (isInDetectionZone(position) && !hasDisguise) {
      setDialogue({
        character: "BULL_GUARD",
        text: [
          "INTRUDER ALERT! Unauthorized personnel detected in restricted area!",
          "The headquarters is now in lockdown!",
        ],
        currentLine: 0,
        speakerName: "Security System",
      })
      setGameState("GAME_OVER")
      return
    }
  }

  // Add this function to check collision at a specific position
  const checkCollision = (x: number, y: number): number => {
    // This is a simplified version - you would need to implement the full collision map
    // based on the collision numbers.png

    // For now, just check if this is the door position
    if (x === 6 && y === 3) {
      return 3 // Door to Room 2
    }

    // Check for buildings (value 1)
    if (isPositionInBuilding({ x, y })) {
      return 1
    }

    // Check for trees (value 2)
    if (isPositionInCrate({ x, y })) {
      return 2
    }

    // Default to walkable
    return 0
  }

  // Function to check if player is in the detection zone
  const isInDetectionZone = (pos: Position) => {
    // Detection zone in front of the building
    return pos.y === 3 && pos.x >= 4 && pos.x <= 8
  }

  // Add state for Room0 position
  const [room0Position, setRoom0Position] = useState({ x: 12, y: 8 })

  // Typing state for dialogue
  const [isTyping, setIsTyping] = useState(false)

  // Add state to track Room4 state
  const [room4Position, setRoom4Position] = useState({ x: 0, y: 0 })
  const [room4Levers, setRoom4Levers] = useState({
    lever1: false,
    lever2: false,
    lever3: false,
    lever4: false,
    leverS: false,
  })
  const [room4DecoyLeverActivated, setRoom4DecoyLeverActivated] = useState(false)
  const [room4BoxOpened, setRoom4BoxOpened] = useState(false)

  // Add these new state variables to track Room3 state
  const [room3SpecialBlocksDeactivated, setRoom3SpecialBlocksDeactivated] = useState(false)
  const [room3VaultOpen, setRoom3VaultOpen] = useState(false)

  // Add state to track Room3 position
  const [room3Position, setRoom3Position] = useState({ x: 1, y: 2 })

  // Function to give corn to a guard
  const giveCornToGuard = (guardIndex: number) => {
    // Mark BOTH guards as falling asleep
    const newCharacters = [...characters]

    // Find both bull guards
    const guardIndices = characters
      .map((char, index) => (char.type === "BULL_GUARD" ? index : -1))
      .filter((index) => index !== -1)

    // Make both guards face the player and start falling asleep
    guardIndices.forEach((index) => {
      newCharacters[index] = {
        ...newCharacters[index],
        fallingAsleep: true,
        direction: getDirectionToPlayer(newCharacters[index].position, player.position),
      }
    })

    setCharacters(newCharacters)

    // KEEP corn in inventory (infinite corn)
    // We're not removing corn from inventory anymore

    // Change to CORN_SEQUENCE state - no dialogue box
    setGameState("CORN_SEQUENCE")
    setCanGiveCorn(false)
    setCurrentGuardIndex(null)

    // Set a timeout to put BOTH guards to sleep after a delay
    setTimeout(() => {
      const sleepyCharacters = [...characters]
      guardIndices.forEach((index) => {
        sleepyCharacters[index] = {
          ...sleepyCharacters[index],
          asleep: true,
          fallingAsleep: false,
        }
      })
      setCharacters(sleepyCharacters)

      // Show Mocha's dialogue after guards fall asleep
      setDialogue({
        character: "HAMSTER",
        text: [
          "Wow, that was fast! The seasoned sleeper snacks worked perfectly!",
          "Now you can go into the building. The entrance is right there.",
        ],
        currentLine: 0,
        speakerName: "Mocha",
        onComplete: () => {
          // Return to playing state after dialogue
          setGameState("PLAYING")
        },
      })

      // Show the arrow pointing to the door
      setShowDoorArrow(true)

      // Return to dialogue state
      setGameState("DIALOGUE")
    }, 3000) // 3 seconds delay for guards to fall asleep
  }

  // Add a function to determine which direction the guard should face to look at the player
  const getDirectionToPlayer = (guardPos: Position, playerPos: Position): Direction => {
    const dx = playerPos.x - guardPos.x
    const dy = playerPos.y - guardPos.y

    // Determine primary direction based on which axis has the larger difference
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? "right" : "left"
    } else {
      return dy > 0 ? "up" : "down" // Note: up is positive y in our new coordinate system
    }
  }

  // Function to start the game from the main menu
  const startGame = () => {
    // Start the game at Room 0
    setGameState("ROOM0")
  }

  // Update the handleRoomSelection function to use the new starting positions
  const handleRoomSelection = (room: string) => {
    console.log("Selected room:", room)

    // Reset player and game state for clean testing
    if (room === "PLAYING") {
      // For main world, reset player to starting position
      setPlayer({
        ...player,
        position: { x: Math.floor(333.8 / TILE_SIZE) + 1, y: Math.floor(241.3 / TILE_SIZE) + 1 },
        pixelX: 333.8,
        pixelY: 241.3,
        direction: "right", // Face right toward Mocha
        isMoving: false,
      })
    } else if (room === "ROOM0") {
      // For Room 0, place player at position (12, 8) instead of (3, 3)
      setPlayer({
        ...player,
        position: { x: 12, y: 8 },
        pixelX: 12 * TILE_SIZE,
        pixelY: 8 * TILE_SIZE,
        direction: "right",
        isMoving: false,
      })

      // Also update the room0Position state to match
      setRoom0Position({ x: 12, y: 8 })
    } else if (room === "ROOM2") {
      // For Room 2, place player in the middle
      setPlayer({
        ...player,
        position: { x: 8, y: 4 },
        pixelX: 8 * TILE_SIZE,
        pixelY: 4 * TILE_SIZE,
        direction: "up",
        isMoving: false,
      })
    } else if (room === "ROOM3") {
      // For Room 3, place player at the bottom middle
      setPlayer({
        ...player,
        position: { x: 8, y: 2 },
        pixelX: 8 * TILE_SIZE,
        pixelY: 2 * TILE_SIZE,
        direction: "up",
        isMoving: false,
      })
      // Reset Room3 position when selecting it from the menu
      setRoom3Position({ x: 1, y: 2 })
    } else if (room === "ROOM4") {
      // For Room 4, place player at maze start
      setPlayer({
        ...player,
        position: { x: 1, y: 1 },
        pixelX: 1 * TILE_SIZE,
        pixelY: 1 * TILE_SIZE,
        direction: "right",
        isMoving: false,
      })
    }

    // Update game state to selected room
    setGameState(room as GameState)
    console.log("Game state updated to:", room)
  }

  // Animation loop for player movement
  useEffect(() => {
    if (gameState !== "PLAYING" && gameState !== "WAITING_FOR_INVENTORY_CHECK") return

    let lastTime = 0
    const targetFPS = 60
    const frameInterval = 1000 / targetFPS

    const animate = (timestamp: number) => {
      const deltaTime = timestamp - lastTime

      if (deltaTime >= frameInterval) {
        lastTime = timestamp
        updateMovement()
      }

      animationFrameId.current = requestAnimationFrame(animate)
    }

    animationFrameId.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [gameState])

  // Animation loop for Mocha's walking sequence
  useEffect(() => {
    if (gameState !== "MOCHA_WALKING") return

    let lastTime = 0
    const targetFPS = 60
    const frameInterval = 1000 / targetFPS

    const animate = (timestamp: number) => {
      const deltaTime = timestamp - lastTime

      if (deltaTime >= frameInterval) {
        lastTime = timestamp
        updateMochaMovement()
      }

      animationFrameId.current = requestAnimationFrame(animate)
    }

    animationFrameId.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [gameState, characters])

  // Function to move player to a specific position
  const movePlayerToPosition = (position: Position) => {
    const newExactX = position.x * TILE_SIZE
    const newExactY = position.y * TILE_SIZE

    // Update player position
    setPlayer({
      ...playerStateRef.current,
      position: position,
      pixelX: newExactX,
      pixelY: newExactY,
      isMoving: false,
      targetPixelX: undefined,
      targetPixelY: undefined,
      animationFrame: 0,
    })

    // Update playerStateRef to match
    playerStateRef.current = {
      ...playerStateRef.current,
      position: position,
      pixelX: newExactX,
      pixelY: newExactY,
      isMoving: false,
      targetPixelX: undefined,
      targetPixelY: undefined,
    }
  }

  // Function to handle room transitions
  const handleRoomTransition = (fromRoom, toRoom) => {
    console.log(`Transitioning from ${fromRoom} to ${toRoom}`)

    // Set the game state to the target room
    if (toRoom === "ROOM3") {
      console.log("Setting game state to ROOM3")
      setGameState("ROOM3")
    } else if (toRoom === "ROOM4") {
      console.log("Setting game state to ROOM4")
      setGameState("ROOM4")
    } else if (toRoom === "ROOM5") {
      console.log("Setting game state to ROOM5")
      setGameState("ROOM5")
    } else if (toRoom === "ROOM2") {
      console.log("Setting game state to ROOM2")
      setGameState("ROOM2")
    } else {
      console.log(`Unknown room: ${toRoom}, defaulting to PLAYING`)
      setGameState("PLAYING")
    }
  }

  // Function to reset the game
  const resetGame = () => {
    // Reset to main menu
    setGameState("MAIN_MENU")
  }

  // Function to interact with items
  const interactWithItem = () => {
    // Check for nearby items with a more generous detection radius
    const nearbyItemIndex = items.findIndex(
      (item) =>
        !item.collected &&
        Math.abs(item.position.x - player.position.x) <= 2 && // Increased from 1 to 2
        Math.abs(item.position.y - player.position.y) <= 2, // Increased from 1 to 2
    )

    if (nearbyItemIndex !== -1) {
      const newItems = [...items]
      newItems[nearbyItemIndex] = {
        ...newItems[nearbyItemIndex],
        collected: true,
      }
      setItems(newItems)

      // If bull costume is collected
      if (newItems[nearbyItemIndex].type === "BULL_COSTUME") {
        setHasDisguise(true)
        setDialogue({
          character: "BEAR",
          text: [
            `You put on the ${newItems[nearbyItemIndex].name}. Now you look like a bull!`,
            "Try not to stand out too much.",
            "The guards will still ask for ID if they see you.",
            "You'll need to put them to sleep with the corn to get past.",
          ],
          currentLine: 0,
          speakerName: "Latte",
          speakerNames: ["Latte", "Mocha", "Mocha", "Mocha"],
        })
        setGameState("DIALOGUE")

        // Check if both items are collected
        checkBothItemsCollected(newItems)
      }

      // If corn is collected
      if (newItems[nearbyItemIndex].type === "CORN") {
        setDialogue({
          character: "BEAR",
          text: [
            `You picked up the ${newItems[nearbyItemIndex].name}.`,
            "Seasoned sleeper snacks. This corn is laced and ready.",
            "It will put the guards to sleep when you get close to them.",
            "Use it to sneak past them after you've put on your disguise.",
            "This is magical corn - you'll never run out of it!",
          ],
          currentLine: 0,
          speakerName: "Latte",
          speakerNames: ["Latte", "Mocha", "Mocha", "Mocha", "Mocha"],
        })
        setGameState("DIALOGUE")

        // Check if both items are collected
        checkBothItemsCollected(newItems)
      }
      return
    }
  }

  // Function to check if both items are collected
  const checkBothItemsCollected = (updatedItems) => {
    const hasBullCostume = updatedItems.some((item) => item.type === "BULL_COSTUME" && item.collected)
    const hasCorn = updatedItems.some((item) => item.type === "CORN" && item.collected)

    if (hasBullCostume && hasCorn && !bothItemsCollected && !mochaWalkingTriggered) {
      setBothItemsCollected(true)
      setMochaWalkingTriggered(true)

      // Set a timeout to start Mocha's walking sequence after current dialogue ends
      setTimeout(() => {
        // Show dialogue about Mocha coming to join Latte
        setDialogue({
          character: "HAMSTER",
          text: ["Great! You've got everything we need.", "Let me come over to you so I can hide in your bag."],
          currentLine: 0,
          speakerName: "Mocha",
          onComplete: () => {
            // Start Mocha's walking sequence
            setGameState("MOCHA_WALKING")
          },
        })
        setGameState("DIALOGUE")
      }, 500) // Short delay to ensure current dialogue completes first
    }
  }

  // Function to talk to characters
  const talkToCharacter = () => {
    // Implementation of talkToCharacter function
  }

  // Function to advance dialogue
  const advanceDialogue = () => {
    if (!dialogue || isTyping) return

    if (dialogue.currentLine < dialogue.text.length - 1) {
      // Check if we're at the line that should trigger the collectible selector
      if (
        dialogue.text[dialogue.currentLine].includes("Choose one tool inspired by time wealth") ||
        dialogue.text[dialogue.currentLine].includes("Which item do you want to bring")
      ) {
        setGameState("COLLECTIBLE_SELECTION")
        return
      }

      // Update the speaker name if we have a speakerNames array
      const nextLine = dialogue.currentLine + 1
      const nextSpeakerName =
        dialogue.speakerNames && dialogue.speakerNames[nextLine]
          ? dialogue.speakerNames[nextLine]
          : dialogue.speakerName

      // If we're at the corn question line, show the corn option
      if (dialogue.text[dialogue.currentLine].includes("Would you share some with us?")) {
        setDialogue({
          ...dialogue,
          currentLine: nextLine,
          speakerName: nextSpeakerName,
          showCornOption: true,
        })
      } else {
        setDialogue({
          ...dialogue,
          currentLine: nextLine,
          speakerName: nextSpeakerName,
        })
      }
    } else {
      // Store the onComplete callback before clearing dialogue
      const onCompleteCallback = dialogue?.onComplete

      // Clear dialogue first
      setDialogue(null)

      // Call the onComplete callback if it exists
      if (onCompleteCallback) {
        onCompleteCallback()
      } else {
        // Return to playing state if no callback
        setGameState("PLAYING")
      }
    }
  }

  // Add a notification state
  const [showNotification, setShowNotification] = useState(null)

  // Function to handle collectible selection
  const handleCollectibleSelection = (collectibleName: string) => {
    // Implementation of handleCollectibleSelection function
  }

  const isInConeOfSight = () => {
    // Implementation of isInConeOfSight function
    return false
  }

  const isBehindHedge = () => {
    // Implementation of isBehindHedge function
    return false
  }

  const isAtHedgeLine = () => {
    // Implementation of isAtHedgeLine function
    return false
  }

  return (
    <div className="relative w-full h-screen">
      {gameState === "MAIN_MENU" ? (
        <MainMenu onStartGame={startGame} />
      ) : gameState === "DEV_ROOM_SELECTOR" ? (
        <DevRoomSelector onSelectRoom={handleRoomSelection} />
      ) : gameState === "ROOM0" ? (
        <Room0 onExit={() => setGameState("ROOM2")} savedPosition={room0Position} onPositionChange={setRoom0Position} />
      ) : gameState === "ROOM2" ? (
        <Room2
          onExit={() => {
            console.log("Room2 exit callback called")
            handleRoomTransition("ROOM2", "ROOM3")
          }}
        />
      ) : gameState === "ROOM3" ? (
        <Room3
          onExit={() => setGameState("ROOM4")}
          onUnlockVault={() => {
            setNotification({
              message: "Vault unlocked! You can now enter the bean vault.",
              duration: 3000,
            })
            // Save the vault state when it's unlocked
            setRoom3SpecialBlocksDeactivated(true)
            setRoom3VaultOpen(true)
          }}
          savedPosition={room3Position}
          onPositionChange={setRoom3Position}
          specialBlocksDeactivated={room3SpecialBlocksDeactivated}
          vaultOpen={room3VaultOpen}
        />
      ) : gameState === "ROOM4" ? (
        <Room4
          onExit={() => setGameState("ROOM5")}
          savedPosition={room4Position}
          onPositionChange={setRoom4Position}
          savedLevers={room4Levers}
          onLeversChange={setRoom4Levers}
          savedDecoyLeverActivated={room4DecoyLeverActivated}
          onDecoyLeverChange={setRoom4DecoyLeverActivated}
          savedBoxOpened={room4BoxOpened}
          onBoxOpenedChange={setRoom4BoxOpened}
        />
      ) : gameState === "ROOM5" ? (
        <Room5
          onExit={() => {
            // After completing Room5, we should show a game completion message
            setDialogue({
              character: "HAMSTER",
              text: [
                "We did it! We changed the filter!",
                "Now people can choose what kind of wealth they want to pursue.",
                "Financial wealth, social wealth, time wealth, mental wealth, physical wealth...",
                "Thank you for helping us restore freedom of choice to the coffee drinkers of the world!",
              ],
              currentLine: 0,
              speakerName: "Mocha",
              speakerNames: ["Mocha", "Mocha", "Latte", "Mocha", "Mocha"],
              onComplete: () => {
                // Set game to complete state
                setGameState("COMPLETE")
              },
            })
            setGameState("DIALOGUE")
          }}
        />
      ) : (
        <div
          className="relative w-full h-screen"
          tabIndex={0}
          style={{ outline: "none" }}
          ref={(el) => {
            // Focus the container when it's mounted
            if (el) el.focus()
          }}
          onKeyDown={(e) => {
            // Prevent default to avoid scrolling
            if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(e.key.toLowerCase())) {
              e.preventDefault()

              // Update movement directly
              const key = e.key.toLowerCase()
              if (key === "w" || key === "arrowup") {
                movementInputRef.current.up = true
              }
              if (key === "s" || key === "arrowdown") {
                movementInputRef.current.down = true
              }
              if (key === "a" || key === "arrowleft") {
                movementInputRef.current.left = true
              }
              if (key === "d" || key === "arrowright") {
                movementInputRef.current.right = true
              }

              console.log("Direct key handler:", key, movementInputRef.current)
            }
          }}
          onKeyUp={(e) => {
            const key = e.key.toLowerCase()
            if (key === "w" || key === "arrowup") {
              movementInputRef.current.up = false
            }
            if (key === "s" || key === "arrowdown") {
              movementInputRef.current.down = false
            }
            if (key === "a" || key === "arrowleft") {
              movementInputRef.current.left = false
            }
            if (key === "d" || key === "arrowright") {
              movementInputRef.current.right = false
            }
          }}
        >
          <Room1
            canvasRef={canvasRef}
            player={player}
            characters={characters}
            items={items}
            hasDisguise={hasDisguise}
            isInConeOfSight={isInConeOfSight}
            isBehindHedge={isBehindHedge}
            isAtHedgeLine={isAtHedgeLine}
          />
        </div>
      )}

      {gameState === "ESCAPE_MENU" && (
        <EscapeMenu
          onResume={() => setGameState(previousGameState)}
          onRestart={() => {
            // Reset the current room
            if (previousGameState === "ROOM0") {
              setRoom0Position({ x: 12, y: 8 })
              setPlayer({
                ...player,
                position: { x: 12, y: 8 },
                pixelX: 12 * TILE_SIZE,
                pixelY: 8 * TILE_SIZE,
                direction: "right",
                isMoving: false,
              })
            } else if (previousGameState === "ROOM2") {
              setPlayer({
                ...player,
                position: { x: 8, y: 4 },
                pixelX: 8 * TILE_SIZE,
                pixelY: 4 * TILE_SIZE,
                direction: "up",
                isMoving: false,
              })
            } else if (previousGameState === "ROOM3") {
              setRoom3Position({ x: 1, y: 2 })
              setPlayer({
                ...player,
                position: { x: 8, y: 2 },
                pixelX: 8 * TILE_SIZE,
                pixelY: 2 * TILE_SIZE,
                direction: "up",
                isMoving: false,
              })
            } else if (previousGameState === "ROOM4") {
              setRoom4Position({ x: 1, y: 1 })
              setPlayer({
                ...player,
                position: { x: 1, y: 1 },
                pixelX: 1 * TILE_SIZE,
                pixelY: 1 * TILE_SIZE,
                direction: "right",
                isMoving: false,
              })
            } else if (previousGameState === "PLAYING") {
              setPlayer({
                ...player,
                position: { x: Math.floor(333.8 / TILE_SIZE) + 1, y: Math.floor(241.3 / TILE_SIZE) + 1 },
                pixelX: 333.8,
                pixelY: 241.3,
                direction: "right",
                isMoving: false,
              })
            }
            setGameState(previousGameState)
          }}
          onMainMenu={() => {
            setGameState("MAIN_MENU")
          }}
        />
      )}

      {/* Game completion screen */}
      {gameState === "COMPLETE" && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/90 z-50">
          <div className="bg-[#f8f0dd]/95 border-4 border-[#8b5a2b] p-8 rounded-sm max-w-2xl w-full text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/aged-parchment.png')] opacity-10 pointer-events-none"></div>
            <h1 className="text-4xl font-pixel text-[#8b5a2b] mb-6">The Forgotten Brew</h1>
            <h2 className="text-2xl font-pixel text-[#5c4033] mb-8">Mission Complete!</h2>

            <p className="text-lg font-mono text-[#5c4033] mb-6">
              You've successfully restored freedom of choice to the coffee drinkers of the world!
            </p>

            <div className="flex justify-center space-x-8 mb-8">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-2 relative">
                  <Image
                    src="/images/latte_right_standing.png"
                    alt="Latte"
                    width={96}
                    height={96}
                    className="object-contain"
                  />
                </div>
                <p className="font-pixel text-[#5c4033]">Latte</p>
              </div>

              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-2 relative">
                  <Image
                    src="/images/Mocha_left_standing.png"
                    alt="Mocha"
                    width={96}
                    height={96}
                    className="object-contain"
                  />
                </div>
                <p className="font-pixel text-[#5c4033]">Mocha</p>
              </div>
            </div>

            <button
              onClick={resetGame}
              className="px-8 py-3 bg-[#8b5a2b] text-[#f8f0dd] font-pixel text-xl uppercase tracking-wide hover:bg-[#6d4522] transition-colors"
            >
              Return to Main Menu
            </button>
          </div>
        </div>
      )}

      {/* Game over screen */}
      {gameState === "GAME_OVER" && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/90 z-50">
          <div className="bg-[#f8f0dd]/95 border-4 border-[#8b5a2b] p-8 rounded-sm max-w-2xl w-full text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/aged-parchment.png')] opacity-10 pointer-events-none"></div>
            <h1 className="text-4xl font-pixel text-[#c94e4e] mb-6">Game Over</h1>

            <p className="text-lg font-mono text-[#5c4033] mb-6">You've been caught by the Bull.SH security system!</p>

            <button
              onClick={resetGame}
              className="px-8 py-3 bg-[#c94e4e] text-[#f8f0dd] font-pixel text-xl uppercase tracking-wide hover:bg-[#b93e3e] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Rest of the UI components */}

      {/* Coordinate Grid */}
      {showCoordinates && <CoordinateGrid visible={showCoordinates} />}

      {/* Position Metric - only show when coordinates are visible */}
      {showCoordinates && (
        <PositionMetric gridPosition={player.position} pixelPosition={{ x: player.pixelX, y: player.pixelY }} />
      )}

      {/* UI Indicators - Always visible except during escape menu */}
      {gameState !== "ESCAPE_MENU" &&
        gameState !== "MAIN_MENU" &&
        gameState !== "COMPLETE" &&
        gameState !== "GAME_OVER" && (
          <div className="absolute top-4 right-4 flex gap-2">
            <KeyIndicator keyLabel="WASD" text="Move" />
            {(gameState === "PLAYING" || gameState === "WAITING_FOR_INVENTORY_CHECK") && nearTalkable && (
              <KeyIndicator keyLabel="T" text="Talk" />
            )}
            {(gameState === "PLAYING" || gameState === "WAITING_FOR_INVENTORY_CHECK" || gameState === "ROOM4") &&
              nearInteractable && <KeyIndicator keyLabel="E" text="Interact" />}
            {(gameState === "PLAYING" || gameState === "WAITING_FOR_INVENTORY_CHECK") && canGiveCorn && (
              <KeyIndicator keyLabel="E" text="Give Corn" />
            )}
            {(gameState === "PLAYING" || gameState === "WAITING_FOR_INVENTORY_CHECK") && (
              <KeyIndicator keyLabel="G" text="Toggle Grid" />
            )}
            <KeyIndicator keyLabel="ESC" text="Menu" />
          </div>
        )}

      {/* Dialogue Box - only show during DIALOGUE state */}
      {gameState === "DIALOGUE" && dialogue && (
        <DialogueBox
          character={dialogue.character}
          text={dialogue.text[dialogue.currentLine]}
          speakerName={dialogue.speakerNames ? dialogue.speakerNames[dialogue.currentLine] : dialogue.speakerName}
          showCornOption={dialogue.showCornOption}
          onGiveCorn={() => dialogue.guardIndex !== undefined && giveCornToGuard(dialogue.guardIndex)}
          isTyping={isTyping}
          setIsTyping={setIsTyping}
          onAdvanceDialogue={advanceDialogue}
        />
      )}

      {/* Notification */}
      {notification || showNotification ? (
        <Notification
          message={notification?.message || showNotification?.message || ""}
          duration={notification?.duration || showNotification?.duration}
          onDismiss={() => {
            setNotification(null)
            setShowNotification(null)
          }}
        />
      ) : null}
    </div>
  )
}
