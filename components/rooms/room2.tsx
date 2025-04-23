"use client"

import { useRef, useEffect, useState } from "react"
import KeyIndicator from "../key-indicator"
import DialogueBox from "../dialogue-box"
import Image from "next/image"
import BlinkingArrow from "../blinking-arrow"
import Notification from "../notification"
import IpadTooltip from "../ipad-tooltip"
import IpadModal from "../ipad-modal"
import BullAlert from "../bull-alert"
import Inventory from "../inventory"
import BraceletSelectorModal from "../bracelet-selector-modal"
import type { Character, Item } from "../rpg-game"

// Define types for the bracelet options
interface Bracelet {
  id: string
  name: string
  description: string
  selected?: boolean
}

// Define types for the puzzle tiles
interface PuzzleTile {
  id: number
  currentPosition: number
  correctPosition: number
  imageUrl: string
}

// Update the collision tile type to include the new purple type (4)
type CollisionTile = 0 | 1 | 2 | 3 | 4 // 0: walkable, 1: wall/obstacle, 2: interactive (immovable), 3: special area, 4: interactive (movable)
type CollisionMap = CollisionTile[][]

export default function Room2({ onExit }: { onExit?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showDialogue, setShowDialogue] = useState(true)
  const [isTyping, setIsTyping] = useState(true)
  const [dialogueData, setDialogueData] = useState({
    character: "HAMSTER" as "BEAR" | "HAMSTER" | "BULL_GUARD",
    text: [
      "Vent's just behind the coffee machine. Time to drop me off.",
      "But hey, this place lives on distraction.",
      "Every wrong guess draws attention from Mr. Two Horns over there.",
      "Just think like a bull and you'll figure it out.",
    ],
    currentLine: 0,
    speakerName: "Mocha",
    speakerNames: ["Mocha", "Mocha", "Mocha", "Mocha"],
  })

  // Canvas dimensions
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  // Update the initial player position to spawn at 7,8 which is a walkable area
  // Player position state - using a walkable position
  const [playerPosition, setPlayerPosition] = useState({ x: 700, y: 750 }) // Changed from (5,9) to (7,8)
  const [playerDirection, setPlayerDirection] = useState<"up" | "down" | "left" | "right">("up")
  const [isPlayerMoving, setIsPlayerMoving] = useState(false)
  const keysPressed = useRef<Record<string, boolean>>({})

  // Bull guard state
  const [bullGuardPosition, setBullGuardPosition] = useState({ x: 13, y: 5 }) // Bull guard position

  // Game state
  const [mochaDroppedOff, setMochaDroppedOff] = useState(false)
  const [showDropoffAnimation, setShowDropoffAnimation] = useState(false)
  const [dropoffAnimationFrame, setDropoffAnimationFrame] = useState(0)
  const [showSuspicionWarning, setShowSuspicionWarning] = useState(false)
  const [todoList, setTodoList] = useState([
    { text: "Drop off Mocha", completed: false },
    { text: "Collect one friendship bracelet", completed: false },
    { text: "Access the security room without raising suspicion", completed: false },
  ])

  // UI state
  const [showBraceletSelector, setShowBraceletSelector] = useState(false)
  const [showIpadScreen, setShowIpadScreen] = useState(false)
  const [showPuzzle, setShowPuzzle] = useState(false)
  const [showCodeEntry, setShowCodeEntry] = useState(false)
  const [codeInput, setCodeInput] = useState("")
  const [codeError, setCodeError] = useState(false)
  const [selectedBracelet, setSelectedBracelet] = useState<Bracelet | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [showSecurityDoorArrow, setShowSecurityDoorArrow] = useState(false)
  // Add state for toggling the to-do list
  const [showTodoList, setShowTodoList] = useState(false)
  const [showInventory, setShowInventory] = useState(false)
  const [showBraceletPoster, setShowBraceletPoster] = useState(false)
  const [showBraceletTooltip, setShowBraceletTooltip] = useState(false)

  // Interaction state
  const [nearPoster, setNearPoster] = useState(false)
  const [nearItemsBox, setNearItemsBox] = useState(false)
  const [nearIpad, setNearIpad] = useState(false)
  const [nearSecurityDoor, setNearSecurityDoor] = useState(false)
  const [securityDoorUnlocked, setSecurityDoorUnlocked] = useState(false)
  const [puzzleCompleted, setPuzzleCompleted] = useState(false)
  const [ipadScrollComplete, setIpadScrollComplete] = useState(false)

  // Add these new state variables after the existing state declarations
  const [showSuspicionBubble, setShowSuspicionBubble] = useState(false)
  const [suspicionTimer, setSuspicionTimer] = useState<NodeJS.Timeout | null>(null)
  const [suspicionLevel, setSuspicionLevel] = useState(0)
  const [suspicionBarVisible, setShowSuspicionBar] = useState(false)
  const [showIpadTooltip, setShowIpadTooltip] = useState(false)
  const [showIpadModal, setShowIpadModal] = useState(false)
  const [codeAttempts, setCodeAttempts] = useState(0)
  const [showBullAlert, setShowBullAlert] = useState(false)
  const [mochaCharacter, setMochaCharacter] = useState<Character>({
    type: "HAMSTER",
    position: { x: 2, y: 7 },
    direction: "left",
    name: "Mocha",
    pixelX: 2 * 32,
    pixelY: 7 * 32,
    isMoving: false,
    animationFrame: 0,
    inInventory: true, // Initially in inventory
  })
  const [showDropoffTooltip, setShowDropoffTooltip] = useState(false)
  const [dropoffAnimationStep, setDropoffAnimationStep] = useState(0)
  const [inventoryItems, setInventoryItems] = useState<Item[]>([
    {
      type: "BULL_COSTUME",
      position: { x: 0, y: 0 },
      collected: false,
      name: "Bull Costume",
      description: "A convincing bull costume that allows you to blend in with the bulls.",
    },
  ])

  // Bracelet options
  const [bracelets, setBracelets] = useState<Bracelet[]>([
    {
      id: "growing",
      name: "Growing Together",
      description: "Growing together means supporting each other's changes and growth",
    },
    {
      id: "space",
      name: "Dark Hour Friends",
      description: "Sometimes all it takes is one person to be there in the dark hours with you.",
    },
    {
      id: "quality",
      name: "Quality > Quantity",
      description: "Quality presence beats endless distracted hours together.",
    },
    {
      id: "busy",
      name: "Never Too Busy",
      description: "The right people always make time, not excuses.",
    },
    {
      id: "showedUp",
      name: "Showed Up",
      description: "Be the friend you once needed by showing up when others walk away",
    },
  ])

  // Puzzle state
  const [puzzleTiles, setPuzzleTiles] = useState<PuzzleTile[]>([])
  const [emptyTileIndex, setEmptyTileIndex] = useState(15) // Bottom right tile is initially empty for 4x4 puzzle

  // Canvas dimensions
  // const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  // Add these state variables in the Room2 component
  const [showCollisionMap] = useState(false)
  const [playerColliding, setPlayerColliding] = useState(false)

  // Add a new state variable to track if this is the first time entering Room 2
  // const [isFirstEntry, setIsFirstEntry] = useState(true)

  // Additional UI states
  const [showComputerScreen, setShowComputerScreen] = useState(false)
  const [showMessageBoard, setShowMessageBoard] = useState(false)
  const [showCollectibleSelector, setShowCollectibleSelector] = useState(false)
  const [showVaultControls, setShowVaultControls] = useState(false)

  // Add a debug toggle at the top of the component
  const [showDebug, setShowDebug] = useState(true)

  // Create a collision map for the room based on feedback
  const [collisionMap, setCollisionMap] = useState<CollisionMap>([])

  // Initialize the collision map
  useEffect(() => {
    // Create a 16x9 grid to match the screen aspect ratio
    const rows = 9
    const cols = 16
    const map: CollisionMap = Array(rows)
      .fill(0)
      .map(() => Array(cols).fill(1)) // Start with everything as walls (1)

    // Set rows 6, 7, 8 as walkable (except borders)
    for (let y = 6; y <= 8; y++) {
      for (let x = 1; x < cols - 1; x++) {
        map[y][x] = 0 // Walkable
      }
    }

    // Set borders as walls
    for (let y = 0; y < rows; y++) {
      map[y][0] = 1 // Left wall
      map[y][cols - 1] = 1 // Right wall
    }
    for (let x = 0; x < cols; x++) {
      map[0][x] = 1 // Top wall
      map[rows - 1][x] = 1 // Bottom wall
    }

    // Make the entire row 8 impassable except for the entrance at position 7
    for (let x = 0; x < cols; x++) {
      if (x === 7 || x === 8) {
        // Make positions 7,8 and 8,8 walkable
        map[8][x] = 0
      } else {
        // Make all other positions in row 8 impassable
        map[8][x] = 1
      }
    }

    // IMMOVABLE AREAS (RED/TYPE 1)
    // Coffee station - immovable
    map[6][2] = 2 // Changed from 1 to 2 - Set as interactive object
    map[6][3] = 2 // Changed from 1 to 2 - Set as interactive object

    // INTERACTIVE + IMMOVABLE AREAS (BLUE/TYPE 2)
    // iPad area - immovable but interactive
    map[5][8] = 2 // Set as interactive object

    // Unwanted items - immovable but interactive
    map[7][12] = 2 // Set as interactive object

    // INTERACTIVE + WALKABLE AREAS (PURPLE/TYPE 4)
    // Coffee station - walkable and interactive
    map[7][2] = 4 // Set as interactive walkable
    map[7][3] = 4 // Set as interactive walkable

    // iPad area - walkable and interactive
    map[6][8] = 4 // Set as interactive walkable
    map[6][9] = 4 // Set as interactive walkable

    // Unwanted items area - walkable and interactive
    map[7][11] = 4 // Set as interactive walkable
    map[7][13] = 4 // Set as interactive walkable

    // Bracelet poster area - interactive
    map[5][4] = 1 // Changed from 4 to 1 - Set as wall/obstacle instead of interactive walkable

    // Security door - initially impassable (1)
    map[4][10] = 1 // Door cell (10,4)
    map[5][10] = 1 // Door cell (10,5)

    // Make cells (10,6), (11,6), and (12,6) walkable
    map[6][10] = 0 // Walkable
    map[6][11] = 0 // Walkable
    map[6][12] = 0 // Walkable

    // Add bull guard position as obstacle
    map[5][13] = 1 // Adjusted bull guard position

    setCollisionMap(map)
  }, [dimensions])

  // Initialize puzzle tiles for a 4x4 puzzle
  useEffect(() => {
    const tiles: PuzzleTile[] = []
    for (let i = 0; i < 16; i++) {
      tiles.push({
        id: i,
        currentPosition: i,
        correctPosition: i,
        imageUrl: `/images/puzzle/tile_${i}.png`,
      })
    }
    setPuzzleTiles(tiles)
  }, [])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    // Set initial dimensions
    handleResize()

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Add this useEffect after the dimensions are set
  useEffect(() => {
    // Set player position to grid 7,8 (which is walkable)
    setPlayerPosition({
      x: (7 * dimensions.width) / 16,
      y: (8 * dimensions.height) / 9,
    })
  }, [dimensions]) // Only run when dimensions are updated

  // Update the interaction zones to better match the image and feedback
  const interactionZones = {
    ventArea: { x: 230, y: 650, width: 100, height: 100 }, // Vent area for Mocha dropoff
    braceletBox: { x: 1000, y: 700, width: 150, height: 150 }, // Bracelet box (updated position)
    ipad: { x: 800, y: 600, width: 80, height: 80 }, // iPad on the small table
    securityDoor: { x: 960, y: 400, width: 120, height: 200 }, // Security room door
    braceletPoster: { x: 400, y: 500, width: 80, height: 80 }, // Bracelet poster
  }

  // Convert screen coordinates to grid coordinates
  const screenToGrid = (x: number, y: number) => {
    // Convert screen coordinates to grid coordinates
    // Since the player's anchor point is at the feet (bottom center),
    // we need to adjust the y coordinate to account for this
    const gridX = Math.floor(x / (dimensions.width / 16))

    // For y, we need to be more careful since the player's anchor point is at the feet
    // This means the actual grid position is where the feet are, not the center of the sprite
    const gridY = Math.floor(y / (dimensions.height / 9))

    console.log("Screen to grid conversion:", { x, y, gridX, gridY })

    return { gridX, gridY }
  }

  // Check if a position is walkable
  const isWalkable = (x: number, y: number) => {
    const { gridX, gridY } = screenToGrid(x, y)

    // Debug logging
    console.log("Checking walkable at:", { x, y, gridX, gridY })

    // Check if position is within bounds
    if (gridX < 0 || gridX >= 16 || gridY < 0 || gridY >= 9) {
      return false
    }

    // Make sure the collision map is initialized and the indices exist
    if (!collisionMap || !collisionMap[gridY] || collisionMap[gridY][gridX] === undefined) {
      console.log("Collision map not initialized or indices don't exist")
      return true // Default to walkable if collision map isn't ready
    }

    // Check if position is walkable (0) or movable interactive cells (4)
    const cellType = collisionMap[gridY][gridX]
    const isWalkableCell = cellType === 0 || cellType === 4

    console.log("Cell type:", cellType, "Is walkable:", isWalkableCell)

    return isWalkableCell
  }

  // Handle key presses for player movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Log key presses to help with debugging
      console.log("Key pressed:", e.key.toLowerCase())

      // Always update the keysPressed ref regardless of UI state
      keysPressed.current[e.key.toLowerCase()] = true

      // Handle dialogue advancement
      if (showDialogue && !isTyping && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault()
        advanceDialogue()
        return
      }

      // Handle interaction with E key
      if (e.key.toLowerCase() === "e") {
        console.log("E key pressed", {
          nearPoster,
          nearItemsBox,
          nearIpad,
          nearSecurityDoor,
          showDialogue,
          showBraceletSelector,
          showIpadScreen,
          showDropoffAnimation,
          showCodeEntry,
          showIpadModal,
        })

        // Only handle interaction if no UI elements are open
        if (
          !showDialogue &&
          !showBraceletSelector &&
          !showIpadScreen &&
          !showDropoffAnimation &&
          !showCodeEntry &&
          !showIpadModal
        ) {
          e.preventDefault() // Prevent default behavior
          handleInteraction()
        }
      }

      // Removed collision map toggle functionality

      // Handle escape key
      if (e.key === "Escape") {
        if (showBraceletSelector) {
          setShowBraceletSelector(false)
        } else if (showIpadScreen) {
          setShowIpadScreen(false)
        } else if (showCodeEntry) {
          setShowCodeEntry(false)
        } else if (showIpadModal) {
          setShowIpadModal(false)
        } else if (onExit) {
          onExit()
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      // Always update the keysPressed ref
      keysPressed.current[e.key.toLowerCase()] = false
      console.log("Key released:", e.key.toLowerCase())
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    // Reset all keys when component mounts or dependencies change
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)

      // Clear all keys when unmounting
      Object.keys(keysPressed.current).forEach((key) => {
        keysPressed.current[key] = false
      })
    }
  }, [
    showDialogue,
    isTyping,
    nearPoster,
    nearItemsBox,
    nearIpad,
    nearSecurityDoor,
    showBraceletSelector,
    showIpadScreen,
    showCodeEntry,
    showIpadModal,
    onExit,
    mochaDroppedOff,
    selectedBracelet,
  ])

  // Handle inventory key press
  useEffect(() => {
    const handleInventoryKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "i") {
        // Toggle inventory
        setShowInventory((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleInventoryKey)
    return () => {
      window.removeEventListener("keydown", handleInventoryKey)
    }
  }, [])

  // Player movement function
  const movePlayer = () => {
    // Add debug logging
    console.log("movePlayer called", {
      playerPosition,
      isPlayerMoving,
      keysPressed: { ...keysPressed.current },
      showDialogue,
      showBraceletSelector,
      showIpadScreen,
      showDropoffAnimation,
      showCodeEntry,
      showIpadModal,
      showBraceletPoster,
      showMessageBoard,
      showComputerScreen,
      showVaultControls,
      showCollectibleSelector,
      showInventory,
    })

    // Skip movement if any UI element is open
    if (
      showComputerScreen ||
      showMessageBoard ||
      showCollectibleSelector ||
      showVaultControls ||
      showIpadModal ||
      showBraceletSelector ||
      showInventory ||
      showDialogue ||
      showDropoffAnimation ||
      showCodeEntry ||
      showBraceletPoster
    ) {
      return
    }

    let newX = playerPosition.x
    let newY = playerPosition.y
    let newDirection = playerDirection
    let isMoving = false

    const moveSpeed = 5

    // Store potential new position
    let potentialX = newX
    let potentialY = newY

    if (keysPressed.current["w"] || keysPressed.current["arrowup"]) {
      potentialY = newY - moveSpeed
      newDirection = "up"
      isMoving = true
    }
    if (keysPressed.current["s"] || keysPressed.current["arrowdown"]) {
      potentialY = newY + moveSpeed
      newDirection = "down"
      isMoving = true
    }
    if (keysPressed.current["a"] || keysPressed.current["arrowleft"]) {
      potentialX = newX - moveSpeed
      newDirection = "left"
      isMoving = true
    }
    if (keysPressed.current["d"] || keysPressed.current["arrowright"]) {
      potentialX = newX + moveSpeed
      newDirection = "right"
      isMoving = true
    }

    // Always update direction even if we can't move
    if (newDirection !== playerDirection) {
      setPlayerDirection(newDirection)
    }

    // Always update isMoving state
    setIsPlayerMoving(isMoving)

    // Check boundaries - keep player within the room
    potentialX = Math.max(50, Math.min(dimensions.width - 50, potentialX))
    potentialY = Math.max(50, Math.min(dimensions.height - 50, potentialY))

    // Check if the collision map is initialized before checking collisions
    if (collisionMap.length > 0) {
      // Check multiple points around the player's feet for more accurate collision detection
      const playerWidth = 16 // Width of collision area at feet
      const playerHeight = 8 // Small height for feet area

      // Since our anchor point is at the feet, we mainly need to check points at and slightly above the feet
      const bottomLeft = !isWalkable(potentialX - playerWidth / 2, potentialY)
      const bottomRight = !isWalkable(potentialX + playerWidth / 2, potentialY)
      const bottomCenter = !isWalkable(potentialX, potentialY)
      const slightlyAbove = !isWalkable(potentialX, potentialY - playerHeight)

      // Combine the results
      const isColliding = bottomLeft || bottomRight || bottomCenter || slightlyAbove
      setPlayerColliding(isColliding)

      // Only update position if not colliding
      if (!isColliding) {
        newX = potentialX
        newY = potentialY
      } else {
        // Try to slide along walls by checking if we can move in just one direction
        const canMoveX = !bottomLeft && !bottomRight && isWalkable(potentialX, newY)
        const canMoveY = !bottomLeft && !bottomRight && isWalkable(newX, potentialY)

        if (canMoveX) {
          newX = potentialX
        } else if (canMoveY) {
          newY = potentialY
        }

        // Player is colliding, but we still want to update direction
        isMoving = canMoveX || canMoveY
        setIsPlayerMoving(isMoving)
      }
    } else {
      // If collision map isn't initialized yet, just update position
      newX = potentialX
      newY = potentialY
    }

    // Check for interaction zones
    checkInteractionZones(newX, newY)

    // Check bull proximity
    checkBullProximity(newX, newY)

    // Update player position and direction
    setPlayerPosition({ x: newX, y: newY })

    // Log the final position after movement
    console.log("Player position updated:", { x: newX, y: newY, isMoving })
  }

  // Player movement loop
  useEffect(() => {
    // Only allow movement when not in dialogue or UI screens
    if (
      showDialogue ||
      showBraceletSelector ||
      showIpadScreen ||
      showDropoffAnimation ||
      showCodeEntry ||
      showInventory ||
      showIpadModal ||
      showBraceletPoster ||
      showMessageBoard ||
      showComputerScreen ||
      showVaultControls ||
      showCollectibleSelector
    ) {
      // If any UI is open, make sure player is not moving
      setIsPlayerMoving(false)
      return
    }

    console.log("Setting up movement interval")
    const interval = setInterval(movePlayer, 16)
    return () => {
      console.log("Clearing movement interval")
      clearInterval(interval)
    }
  }, [
    playerPosition,
    playerDirection,
    showDialogue,
    showBraceletSelector,
    showIpadScreen,
    showDropoffAnimation,
    showCodeEntry,
    showInventory,
    showIpadModal,
    showBraceletPoster,
    showMessageBoard,
    showComputerScreen,
    showVaultControls,
    showCollectibleSelector,
    dimensions,
    collisionMap,
  ])

  // Check if player is near interactive objects
  const checkInteractionZones = (x: number, y: number) => {
    // Convert screen coordinates to grid coordinates
    const { gridX, gridY } = screenToGrid(x, y)

    // Debug logging
    console.log("Player position:", { x, y, gridX, gridY })
    console.log("Checking interaction zones at:", { gridX, gridY })

    // Check if grid coordinates are within bounds of the collision map
    if (gridX < 0 || gridX >= 16 || gridY < 0 || gridY >= 9) {
      // Reset all interaction states if out of bounds
      setNearPoster(false)
      setNearItemsBox(false)
      setNearIpad(false)
      setNearSecurityDoor(false)
      setShowIpadTooltip(false)
      setShowBraceletPoster(false)
      return
    }

    // Check if player is near the coffee station (where Mocha jumps out)
    // This includes both the immovable (2,6 and 3,6) and walkable interactive areas (2,7 and 3,7)
    const isNearVent = (gridX === 2 || gridX === 3) && gridY === 7
    setNearPoster(isNearVent)
    setShowDropoffTooltip(isNearVent && !mochaDroppedOff)

    // Check if player is near the bracelet poster
    const isNearBraceletPoster = gridX === 4 && gridY === 5
    setShowBraceletPoster(isNearBraceletPoster)
    setShowBraceletTooltip(isNearBraceletPoster && !selectedBracelet)

    // Check if player is near the unwanted items area
    setNearItemsBox((gridX === 11 || gridX === 12 || gridX === 13) && gridY === 7)

    // IMPORTANT: Expanded iPad detection area - check a wider area around the iPad
    // This is the key fix for the iPad interaction issue
    const isNearIpad =
      // Check the iPad tile itself
      (gridX === 8 && gridY === 5) ||
      // Check adjacent tiles (cardinal directions)
      (gridX === 7 && gridY === 5) || // Left
      (gridX === 9 && gridY === 5) || // Right
      (gridX === 8 && gridY === 4) || // Above
      (gridX === 8 && gridY === 6) // Below

    console.log("Is near iPad:", isNearIpad)
    setNearIpad(isNearIpad)

    // Show iPad tooltip when near iPad and conditions are met
    setShowIpadTooltip(isNearIpad && !showIpadModal && mochaDroppedOff)

    // Check if player is near the security door
    setNearSecurityDoor(
      // Check if player is adjacent to the security door area
      (gridX === 9 && gridY >= 3 && gridY <= 6) || // Left of door
        (gridX === 13 && gridY >= 3 && gridY <= 6) || // Right of door
        (gridX >= 10 && gridX <= 12 && gridY === 2) || // Above door
        (gridX >= 10 && gridX <= 12 && gridY === 7), // Below door
    )
  }

  // Function to check if player is too close to the bull guard
  const checkBullProximity = (x: number, y: number) => {
    // Convert screen coordinates to grid coordinates
    const { gridX, gridY } = screenToGrid(x, y)

    // Calculate distance to bull guard
    const distanceX = Math.abs(gridX - bullGuardPosition.x)
    const distanceY = Math.abs(gridY - bullGuardPosition.y)

    // Check if player is within 1 tile of the bull guard
    const isTooClose = distanceX <= 1 && distanceY <= 1

    // If player is too close, start suspicion timer
    if (isTooClose && !suspicionTimer) {
      // Show suspicion bubble immediately
      setShowSuspicionBubble(true)

      // Start suspicion timer
      const timer = setTimeout(() => {
        // Increase suspicion level after 2 seconds
        increaseSuspicion("The bull guard is suspicious of your behavior!")
        // Reset timer
        setSuspicionTimer(null)
      }, 2000)

      setSuspicionTimer(timer)
      setShowSuspicionBar(true)
    } else if (!isTooClose && suspicionTimer) {
      // If player moves away, clear suspicion timer
      clearTimeout(suspicionTimer)
      setSuspicionTimer(null)
      setShowSuspicionBubble(false)

      // Hide suspicion bar after a delay
      setTimeout(() => {
        setShowSuspicionBar(false)
      }, 1000)
    }

    // Update iPad tooltip visibility
    const isNearIpad =
      (gridX === 7 && gridY === 5) || // Left of iPad
      (gridX === 9 && gridY === 5) || // Right of iPad
      (gridX === 8 && gridY === 4) || // Above iPad
      (gridX === 8 && gridY === 6) // Below iPad

    setShowIpadTooltip(isNearIpad && !showCodeEntry && !showIpadScreen)
  }

  // Function to unlock the security door
  const unlockSecurityDoor = () => {
    // Make the security door cells special (3) instead of impassable (1)
    const newMap = [...collisionMap]
    newMap[4][10] = 3 // Door cell (10,4) becomes special (transition to Room 3)
    newMap[5][10] = 3 // Door cell (10,5) becomes special (transition to Room 3)

    // Update the collision map
    setCollisionMap(newMap)
    setSecurityDoorUnlocked(true)
    setNotification("Security door unlocked! You can now proceed to Room 3.")
    setTimeout(() => setNotification(null), 3000)

    // Update todo list
    const updatedTodoList = [...todoList]
    updatedTodoList[2].completed = true
    setTodoList(updatedTodoList)

    // Show arrow pointing to the security door
    setShowSecurityDoorArrow(true)
  }

  // Handle interactions with objects
  const handleInteraction = () => {
    console.log("Interaction triggered", {
      nearPoster,
      nearItemsBox,
      nearIpad,
      nearSecurityDoor,
      mochaDroppedOff,
      selectedBracelet,
      playerPosition,
      gridPosition: screenToGrid(playerPosition.x, playerPosition.y),
    })

    if (nearPoster && !mochaDroppedOff) {
      // Check if player is specifically at the walkable interactive area (2,7 or 3,7)
      const { gridX, gridY } = screenToGrid(playerPosition.x, playerPosition.y)
      if ((gridX === 2 || gridX === 3) && gridY === 7) {
        // Start Mocha dropoff animation
        setShowDropoffAnimation(true)

        // Update Mocha character state to be visible in the world
        setMochaCharacter((prev) => ({
          ...prev,
          inInventory: false,
          position: { x: gridX, y: gridY },
          pixelX: gridX * 32,
          pixelY: gridY * 32,
          direction: "left",
        }))

        // Start animation sequence
        setDropoffAnimationStep(1)

        // Animation sequence timing
        const animationSteps = [
          { step: 2, delay: 500 }, // Start walking
          { step: 3, delay: 1500 }, // Continue walking
          { step: 4, delay: 2500 }, // Enter vent
          { step: 0, delay: 3000 }, // Complete animation
        ]

        // Execute animation steps with delays
        animationSteps.forEach(({ step, delay }) => {
          setTimeout(() => {
            setDropoffAnimationStep(step)

            // Final step - complete the animation
            if (step === 0) {
              setMochaDroppedOff(true)
              setShowDropoffAnimation(false)

              // Update todo list
              const updatedTodoList = [...todoList]
              updatedTodoList[0].completed = true
              setTodoList(updatedTodoList)

              // Show notification
              setNotification("Mocha has been dropped off at the vent!")
              setTimeout(() => setNotification(null), 3000)
            }
          }, delay)
        })
      } else {
        // If player is at the immovable part (2,6 or 3,6), show a hint
        setNotification("Move closer to the coffee station to drop off Mocha.")
        setTimeout(() => setNotification(null), 3000)
      }
    } else if (showBraceletPoster && !selectedBracelet && mochaDroppedOff) {
      // Show bracelet selector modal only if Mocha has been dropped off
      setShowBraceletSelector(true)
    } else if (showBraceletPoster && !mochaDroppedOff) {
      // Show notification that Mocha needs to be dropped off at the vent first
      setNotification("You need to drop off Mocha at the vent first.")
      setTimeout(() => setNotification(null), 3000)
    } else if (nearItemsBox && mochaDroppedOff && !selectedBracelet) {
      // Show bracelet selector
      setShowBraceletSelector(true)
    } else if (nearItemsBox && !mochaDroppedOff) {
      // Show notification that Mocha needs to be dropped off first
      setNotification("You need to drop off Mocha at the vent first.")
      setTimeout(() => setNotification(null), 3000)
    }
    // IMPORTANT: Improved iPad interaction logic
    else if (nearIpad && mochaDroppedOff) {
      console.log("iPad interaction triggered")
      if (!selectedBracelet) {
        // Increase suspicion if trying to use iPad before getting bracelet
        increaseSuspicion("You should get a bracelet first!")
      } else {
        // Show iPad modal - this is the key part that should be triggered
        console.log("Opening iPad modal")
        setShowIpadModal(true)
        setShowIpadTooltip(false)
      }
    } else if (nearSecurityDoor) {
      if (securityDoorUnlocked) {
        // Transition to next room
        if (onExit) {
          onExit()
        }
      } else if (puzzleCompleted) {
        // Unlock security door
        unlockSecurityDoor()
        setShowSecurityDoorArrow(true)
      } else {
        // Increase suspicion if trying to enter before completing puzzle
        increaseSuspicion("The security door is locked. You need to complete the puzzle first.")
      }
    } else {
      // If not near any interactive object, show a generic message
      console.log("Nothing to interact with here")
      setNotification("Nothing to interact with here.")
      setTimeout(() => setNotification(null), 1500)
    }
  }

  // Function to handle bracelet selection
  const handleBraceletSelection = (bracelet: Bracelet) => {
    console.log("handleBraceletSelection called with:", bracelet.name)

    // Set the selected bracelet
    setSelectedBracelet(bracelet)
    console.log("selectedBracelet set to:", bracelet.name)

    // Close the bracelet selector modal
    setShowBraceletSelector(false)
    console.log("Modal closed")

    // Add bracelet to inventory
    const newBraceletItem: Item = {
      type: "BRACELET" as any, // Type assertion since BRACELET isn't in the original ItemType
      position: { x: 0, y: 0 },
      collected: true,
      name: `${bracelet.name} Bracelet`,
      description: bracelet.description,
    }

    setInventoryItems((prev) => {
      console.log("Adding bracelet to inventory:", newBraceletItem.name)
      return [...prev, newBraceletItem]
    })

    // Update todo list
    const updatedTodoList = [...todoList]
    updatedTodoList[1].completed = true
    setTodoList(updatedTodoList)
    console.log("Todo list updated, item 1 completed")

    // Show notification with more prominent styling
    setNotification(`✅ ${bracelet.name} Bracelet added to your inventory!`)
    console.log("Notification shown")
    setTimeout(() => setNotification(null), 3000)

    // Suggest checking inventory
    setTimeout(() => {
      setNotification("Press I to view your inventory")
      setTimeout(() => setNotification(null), 2000)
    }, 3500)
  }

  // Function to handle code input
  const handleCodeSubmit = () => {
    if (codeInput === "2477") {
      // Correct code
      setShowCodeEntry(false)
      setShowIpadScreen(true)
      setShowPuzzle(true)
      setNotification("Code accepted! Complete the puzzle to unlock the security door.")
      setTimeout(() => setNotification(null), 3000)

      // Initialize and shuffle the puzzle
      shufflePuzzle()
    } else {
      // Incorrect code
      setCodeError(true)
      setTimeout(() => setCodeError(false), 1000)
      increaseSuspicion("Incorrect code! Security alert triggered.")
    }
  }

  // Function to increase suspicion level
  const increaseSuspicion = (message: string) => {
    setSuspicionLevel((prev) => {
      const newLevel = prev + 1

      // Show notification
      setNotification(message)
      setTimeout(() => setNotification(null), 3000)

      // Show warning based on suspicion level
      if (newLevel === 1) {
        setShowSuspicionWarning(true)
        setTimeout(() => setShowSuspicionWarning(false), 2000)
      } else if (newLevel === 2) {
        setShowSuspicionWarning(true)
        setTimeout(() => setShowSuspicionWarning(false), 2000)
      } else if (newLevel === 3) {
        setShowSuspicionWarning(true)
        setTimeout(() => setShowSuspicionWarning(false), 2000)
      } else if (newLevel >= 4) {
        // Game over - restart room
        setNotification("You've been caught! Restarting room...")
        setTimeout(() => {
          // Reset room state
          setPlayerPosition({ x: 400, y: 750 }) // Use the original y position
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

  // Function to handle puzzle tile click
  const handleTileClick = (index: number) => {
    // Check if the clicked tile is adjacent to the empty tile
    const row = Math.floor(index / 4) // For 4x4 puzzle
    const col = index % 4
    const emptyRow = Math.floor(emptyTileIndex / 4)
    const emptyCol = emptyTileIndex % 4

    // Check if the clicked tile is adjacent to the empty tile
    if ((row === emptyRow && Math.abs(col - emptyCol) === 1) || (col === emptyCol && Math.abs(row - emptyRow) === 1)) {
      // Swap the clicked tile with the empty tile
      const newTiles = [...puzzleTiles]
      const temp = newTiles[index].currentPosition
      newTiles[index].currentPosition = newTiles[emptyTileIndex].currentPosition
      newTiles[emptyTileIndex].currentPosition = temp
      setPuzzleTiles(newTiles)
      setEmptyTileIndex(index)

      // Check if puzzle is solved
      const isComplete = newTiles.every((tile) => tile.currentPosition === tile.correctPosition)
      if (isComplete) {
        // Immediately notify completion and transition
        const onComplete = () => {
          checkPuzzleCompletionTransition(newTiles)
        }
        if (onComplete) {
          // Call onComplete immediately when puzzle is solved
          setTimeout(() => {
            onComplete()
          }, 500) // Short delay for visual feedback
        }
      }
    }
  }

  // Function to check if puzzle is completed
  const checkPuzzleCompletion = (tiles: PuzzleTile[]) => {
    const isComplete = tiles.every((tile) => tile.currentPosition === tile.correctPosition)

    if (isComplete) {
      setPuzzleCompleted(true)
      setShowIpadScreen(false)

      // Show success notification
      setNotification("Puzzle solved! Proceeding to the next room...")

      // Immediately transition to the next room after a short delay
      setTimeout(() => {
        if (onExit) {
          onExit() // This will trigger the transition to Room 3
        }
      }, 1500) // Short delay for the notification to be visible
    }
  }

  // Function to shuffle puzzle tiles
  const shufflePuzzle = () => {
    // Create a copy of the tiles
    const newTiles = [...puzzleTiles]

    // Shuffle the tiles (ensure it's solvable)
    for (let i = 0; i < 100; i++) {
      // Get adjacent tiles to the empty tile
      const emptyRow = Math.floor(emptyTileIndex / 4)
      const emptyCol = emptyTileIndex % 4
      const adjacentIndices = []

      // Check up
      if (emptyRow > 0) {
        adjacentIndices.push(emptyTileIndex - 4)
      }
      // Check down
      if (emptyRow < 3) {
        adjacentIndices.push(emptyTileIndex + 4)
      }
      // Check left
      if (emptyCol > 0) {
        adjacentIndices.push(emptyTileIndex - 1)
      }
      // Check right
      if (emptyCol < 3) {
        adjacentIndices.push(emptyTileIndex + 1)
      }

      // Randomly select an adjacent tile
      const randomIndex = Math.floor(Math.random() * adjacentIndices.length)
      const tileToSwap = adjacentIndices[randomIndex]

      // Swap the tiles
      const temp = newTiles[tileToSwap].currentPosition
      newTiles[tileToSwap].currentPosition = newTiles[emptyTileIndex].currentPosition
      newTiles[emptyTileIndex].currentPosition = temp
      setEmptyTileIndex(tileToSwap)
    }

    setPuzzleTiles(newTiles)
  }

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
      // End dialogue
      setShowDialogue(false)
    }
  }

  const handleScrollComplete = () => {
    setIpadScrollComplete(true)
  }

  // Function to handle iPad success
  const handleIpadSuccess = () => {
    console.log("handleIpadSuccess called - transitioning to Room 3")

    // Set states for completion
    setPuzzleCompleted(true)
    unlockSecurityDoor()

    // Show notification but don't wait for it
    setNotification("Security door unlocked! Moving to Room 3...")

    // Close modal
    setShowIpadModal(false)

    // Try to transition, but handle the case where onExit is undefined
    if (onExit) {
      console.log("Calling onExit()")
      onExit()
    } else {
      console.error("onExit is undefined! Using fallback transition method")
      // Fallback transition method - update the URL directly
      try {
        // Try to navigate to Room 3 using window.location
        window.location.href = window.location.pathname + "?room=3"
        // If that doesn't work, show a message to the user
        setNotification("Please click the debug button to proceed to Room 3")
      } catch (error) {
        console.error("Failed to navigate:", error)
        setNotification("Navigation failed. Please use the debug button to proceed.")
      }
    }
  }

  // Also modify the checkPuzzleCompletion function to automatically transition
  const checkPuzzleCompletionTransition = (tiles: PuzzleTile[]) => {
    const isComplete = tiles.every((tile) => tile.currentPosition === tile.correctPosition)

    if (isComplete) {
      console.log("Puzzle completion check passed - transitioning to Room 3")

      // Set states
      setPuzzleCompleted(true)
      setShowIpadScreen(false)
      unlockSecurityDoor()

      // Show notification
      setNotification("Puzzle solved! Moving to Room 3...")

      // Try to transition, but handle the case where onExit is undefined
      if (onExit) {
        console.log("Calling onExit()")
        onExit()
      } else {
        console.error("onExit is undefined! Using fallback transition method")
        // Fallback transition method - update the URL directly
        try {
          // Try to navigate to Room 3 using window.location
          window.location.href = window.location.pathname + "?room=3"
          // If that doesn't work, show a message to the user
          setNotification("Please click the debug button to proceed to Room 3")
        } catch (error) {
          console.error("Failed to navigate:", error)
          setNotification("Navigation failed. Please use the debug button to proceed.")
        }
      }
    }
  }

  const handleIpadFailure = () => {
    // Handle iPad failure logic here
    console.log("iPad interaction failed")
    setNotification("iPad interaction failed. Please try again.")
    setTimeout(() => setNotification(null), 3000)
    setShowIpadModal(false)
  }

  // Convert grid coordinates to screen coordinates for the bull guard
  const gridToScreen = (gridX: number, gridY: number) => {
    return {
      x: gridX * (dimensions.width / 16),
      y: gridY * (dimensions.height / 9),
    }
  }

  // Get bull guard screen position
  const bullGuardScreenPos = gridToScreen(bullGuardPosition.x, bullGuardPosition.y)

  useEffect(() => {
    if (!showDropoffAnimation || dropoffAnimationStep === 0) return

    // Handle animation steps
    if (dropoffAnimationStep === 1) {
      // Initial position
      setMochaCharacter((prev) => ({
        ...prev,
        position: { x: 2, y: 7 },
        pixelX: 2 * 32,
        pixelY: 7 * 32,
        direction: "left",
        isMoving: false,
      }))
    } else if (dropoffAnimationStep === 2) {
      // Start walking
      setMochaCharacter((prev) => ({
        ...prev,
        isMoving: true,
      }))
    } else if (dropoffAnimationStep === 3) {
      // Move to vent position
      setMochaCharacter((prev) => ({
        ...prev,
        position: { x: 1, y: 6 },
        pixelX: 1 * 32,
        pixelY: 6 * 32,
        isMoving: true,
      }))
    } else if (dropoffAnimationStep === 4) {
      // Enter vent (disappear)
      setMochaCharacter((prev) => ({
        ...prev,
        isMoving: false,
      }))
    }
  }, [showDropoffAnimation, dropoffAnimationStep, dimensions])

  return (
    <div className="relative w-full h-screen">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/room2-background.png"
          alt="Room 2 - Bull.SH Coffee HQ Lobby"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Bull Guard Character */}
      <div
        className="absolute z-10"
        style={{
          left: `${bullGuardScreenPos.x}px`,
          top: `${bullGuardScreenPos.y + 100}px`, // Added 50px offset here
          transform: "translate(-25%, -25%) scale(2.0)" /* Double the size and adjust position */,
        }}
      >
        <div className="relative w-32 h-32">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20250418_0104_Pixel%20Bull%20Guard_remix_01js3398pzfn78pjw8rc7zx4yf-1eJYE9NxQS8EHSFJx1l8kTkt9mcj4c.png"
            alt="Bull Guard"
            width={128}
            height={128}
            className="object-contain"
          />
        </div>
      </div>

      {/* Player Character */}
      <div
        className="absolute z-10"
        style={{
          left: `${playerPosition.x}px`,
          top: `${playerPosition.y}px`,
          transform: "translate(-50%, -100%) scale(1.7)" /* Increased size by 70% */,
          transition: "left 0.1s, top 0.1s",
        }}
      >
        <div className="relative w-24 h-24">
          <Image
            src={`/images/latte_${playerDirection}_${isPlayerMoving ? (Math.floor(Date.now() / 200) % 2 === 0 ? "walking1" : "walking2") : "standing"}.png`}
            alt="Player character"
            width={96}
            height={96}
            className="object-contain"
          />
        </div>
      </div>

      {/* Mocha Character (during dropoff animation) */}
      {showDropoffAnimation && !mochaCharacter.inInventory && (
        <div
          className="absolute z-10"
          style={{
            left: `${(mochaCharacter.position.x * dimensions.width) / 16}px`,
            top: `${(mochaCharacter.position.y * dimensions.height) / 9}px`,
            transform: "translate(-50%, -100%) scale(0.75)" /* Changed from 1.0 to 0.75 */,
            transition: "left 1.5s, top 1.5s",
            opacity: dropoffAnimationStep === 4 ? 0 : 1 /* Fade out when entering vent */,
            transitionProperty: "left, top, opacity",
            transitionDuration: dropoffAnimationStep === 4 ? "0.5s" : "1.5s",
          }}
        >
          <div className="relative w-36 h-36">
            <Image
              src={`/images/Mocha_${mochaCharacter.direction}_${mochaCharacter.isMoving ? "walking1" : "standing"}.png`}
              alt="Mocha character"
              width={144}
              height={144}
              className="object-contain"
            />
          </div>
        </div>
      )}

      {/* Room info overlay */}
      <div className="absolute top-4 left-4 bg-[#f8f0dd]/95 backdrop-blur-sm border-2 border-[#8b5a2b] p-3 rounded-sm text-[#5c4033] shadow-md relative overflow-hidden z-20">
        <div className="absolute inset-0 bg-[url('/aged-parchment.png')] opacity-10 pointer-events-none"></div>
        <p className="font-mono uppercase tracking-wide text-sm">Room 2: Bull.SH Coffee HQ Lobby</p>
        <p className="text-xs font-mono tracking-wide">Complete your objectives without raising suspicion.</p>
      </div>

      {/* Global UI Controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-20">
        <KeyIndicator keyLabel="WASD" text="Move" />
        {(nearPoster ||
          nearItemsBox ||
          nearIpad ||
          showBraceletPoster ||
          (nearSecurityDoor && securityDoorUnlocked)) && <KeyIndicator keyLabel="E" text="Interact" />}
        <KeyIndicator keyLabel="I" text="Inventory" />
      </div>

      {/* To-Do List Button */}
      <div className="absolute bottom-4 right-4 z-20 group">
        <button
          onClick={() => setShowTodoList(!showTodoList)}
          className="bg-[#f8f0dd]/95 backdrop-blur-sm border-2 border-[#8b5a2b] px-3 py-1 rounded-sm text-[#5c4033] shadow-md relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('/aged-parchment.png')] opacity-10 pointer-events-none"></div>
          <div className="flex items-center">
            <span className="font-mono uppercase tracking-wide text-sm font-bold mr-2">TO-DO</span>
            <span className="text-xs bg-[#8b5a2b] text-white px-1 rounded-sm">
              {todoList.filter((item) => item.completed).length}/{todoList.length}
            </span>
          </div>
        </button>
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black/80 text-white text-xs rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Complete the list in order to unlock room 3
          <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-black/80"></div>
        </div>
      </div>

      {/* To-Do List Popup (only shown when toggled) */}
      {showTodoList && (
        <div className="fixed inset-0 flex items-start justify-center pt-20 z-50">
          <div className="w-full max-w-md bg-[#f8f0dd]/95 backdrop-blur-sm border-2 border-[#8b5a2b] shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/aged-parchment.png')] opacity-10 pointer-events-none"></div>

            <div className="flex justify-between items-center border-b border-[#8b5a2b] px-4 py-2">
              <h2 className="font-mono uppercase tracking-wide text-lg font-bold text-[#5c4033]">TO-DO LIST:</h2>
              <button onClick={() => setShowTodoList(false)} className="text-[#5c4033] hover:text-[#8b5a2b] text-xl">
                ✕
              </button>
            </div>

            <div className="p-4">
              <ul className="space-y-3">
                {todoList.map((item, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-6 h-6 border border-[#8b5a2b] bg-white/50 flex items-center justify-center mr-3">
                      {item.completed ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="opacity-0">✓</span>
                      )}
                    </div>
                    <span className={`font-mono text-[#5c4033] ${item.completed ? "line-through opacity-70" : ""}`}>
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Suspicion Warning */}
      {showSuspicionWarning && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="bg-red-500/30 border-2 border-red-600 p-4 rounded-sm animate-pulse">
            <p className="text-white font-bold text-xl">SUSPICION INCREASED!</p>
          </div>
        </div>
      )}

      {/* Security Door Arrow */}
      {showSecurityDoorArrow && (
        <BlinkingArrow
          x={interactionZones.securityDoor.x + interactionZones.securityDoor.width / 2}
          y={interactionZones.securityDoor.y - 20}
          direction="down"
          color="green-600"
        />
      )}

      {/* Notification */}
      {notification && <Notification message={notification} duration={3000} />}

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

      {/* Collision Map Visualization */}
      {showCollisionMap && (
        <div className="absolute inset-0 pointer-events-none z-30">
          {collisionMap.map((row, y) => (
            <div key={y} className="flex">
              {row.map((cell, x) => (
                <div
                  key={`${x}-${y}`}
                  className={`
                   border border-white/20
                   ${cell === 0 ? "bg-green-500/30" : ""}
                   ${cell === 1 ? "bg-red-500/50" : ""}
                   ${cell === 2 ? "bg-blue-500/50" : ""}
                   ${cell === 3 ? "bg-yellow-500/50" : ""}
                   ${cell === 4 ? "bg-purple-500/50" : ""}
                 `}
                  style={{
                    width: `${dimensions.width / 16}px`,
                    height: `${dimensions.height / 9}px`,
                  }}
                >
                  <span className="text-white text-xs opacity-70">
                    {x},{y}
                  </span>
                </div>
              ))}
            </div>
          ))}

          {/* Player grid position indicator */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-sm">
            Player: {screenToGrid(playerPosition.x, playerPosition.y).gridX},
            {screenToGrid(playerPosition.x, playerPosition.y).gridY}
            {playerColliding && " (COLLIDING)"}
          </div>

          {/* Player collision point visualization */}
          {showDebug && (
            <div
              className="absolute w-4 h-4 bg-yellow-500 rounded-full border-2 border-white z-40 pointer-events-none"
              style={{
                left: `${playerPosition.x - 2}px`,
                top: `${playerPosition.y - 2}px`,
              }}
            />
          )}

          {/* Add legend for the new purple type */}
          <div className="absolute top-4 right-4 bg-black/70 text-white p-2 rounded-sm">
            <div className="flex items-center mb-1">
              <div className="w-4 h-4 bg-green-500/30 mr-2 border border-white/20"></div>
              <span className="text-xs">Walkable (0)</span>
            </div>
            <div className="flex items-center mb-1">
              <div className="w-4 h-4 bg-red-500/50 mr-2 border border-white/20"></div>
              <span className="text-xs">Wall (1)</span>
            </div>
            <div className="flex items-center mb-1">
              <div className="w-4 h-4 bg-blue-500/50 mr-2 border border-white/20"></div>
              <span className="text-xs">Interactive (2)</span>
            </div>
            <div className="flex items-center mb-1">
              <div className="w-4 h-4 bg-yellow-500/50 mr-2 border border-white/20"></div>
              <span className="text-xs">Special (3)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-purple-500/50 mr-2 border border-white/20"></div>
              <span className="text-xs">Interactive & Walkable (4)</span>
            </div>
          </div>
        </div>
      )}

      {/* iPad Code Entry Screen */}
      {showCodeEntry && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="bg-[#f8f0dd] border-4 border-[#8b5a2b] p-6 rounded-lg w-80 max-w-md">
            <h2 className="text-xl font-bold text-[#5c4033] mb-4 text-center">Security Access</h2>
            <p className="text-sm text-[#5c4033] mb-4 text-center">Enter the 4-digit access code:</p>

            <div className={`flex justify-center mb-4 ${codeError ? "animate-shake" : ""}`}>
              <input
                type="password"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.slice(0, 4))}
                maxLength={4}
                className="w-40 text-center text-2xl font-mono tracking-widest bg-white border-2 border-[#8b5a2b] p-2 rounded"
                autoFocus
              />
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setShowCodeEntry(false)}
                className="px-4 py-2 bg-[#8b5a2b] text-white rounded hover:bg-[#6d4522] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCodeSubmit}
                disabled={codeInput.length !== 4}
                className={`px-4 py-2 rounded text-white transition-colors ${
                  codeInput.length === 4 ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iPad Puzzle Screen */}
      {showIpadScreen && showPuzzle && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="bg-[#f8f0dd] border-4 border-[#8b5a2b] p-6 rounded-lg max-w-md">
            <h2 className="text-xl font-bold text-[#5c4033] mb-4 text-center">Security Override Puzzle</h2>
            <p className="text-sm text-[#5c4033] mb-4 text-center">
              Arrange the tiles in the correct order to unlock the security door.
            </p>

            <div className="grid grid-cols-4 gap-1 mb-4 bg-[#8b5a2b] p-1 rounded">
              {puzzleTiles.map((tile, index) => (
                <div
                  key={index}
                  onClick={() => handleTileClick(index)}
                  className={`w-20 h-20 flex items-center justify-center transition-all duration-200 ${
                    index === emptyTileIndex ? "bg-[#8b5a2b]" : "bg-[#f8f0dd] hover:bg-[#e6dcc9] cursor-pointer"
                  }`}
                >
                  {index !== emptyTileIndex && (
                    <Image
                      src={`/images/puzzle/tile_${tile.currentPosition}.png`}
                      alt={`Puzzle tile ${tile.id}`}
                      width={75}
                      height={75}
                      className="object-contain"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setShowIpadScreen(false)}
                className="px-4 py-2 bg-[#8b5a2b] text-white rounded hover:bg-[#6d4522] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={shufflePuzzle}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Shuffle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspicion Bubble */}
      {showSuspicionBubble && (
        <div
          className="absolute z-20"
          style={{
            left: `${bullGuardScreenPos.x + 50}px`,
            top: `${bullGuardScreenPos.y - 40}px`,
          }}
        >
          <div className="bg-white rounded-full w-10 h-10 flex items-center justify-center border-2 border-black animate-pulse">
            <span className="text-xl font-bold text-red-600">?</span>
          </div>
        </div>
      )}

      {/* Suspicion Bar */}
      {suspicionBarVisible && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-30 bg-black/70 p-2 rounded-md">
          <div className="flex items-center">
            <span className="text-white text-xs mr-2">Suspicion:</span>
            <div className="w-40 h-3 bg-gray-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-600 transition-all duration-300"
                style={{ width: `${(suspicionLevel / 4) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Dropoff Tooltip */}
      {showDropoffTooltip && (
        <div
          className="absolute z-20 bg-black/80 text-white px-3 py-1 rounded-sm text-sm pointer-events-none"
          style={{
            left: `${(2.5 * dimensions.width) / 16}px`,
            top: `${(6.5 * dimensions.height) / 9}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          Press E to drop Mocha off
        </div>
      )}

      {/* Bracelet Tooltip */}
      {showBraceletTooltip && (
        <div
          className="absolute z-20 bg-black/80 text-white px-3 py-1 rounded-sm text-sm pointer-events-none"
          style={{
            left: `${(4 * dimensions.width) / 16}px`,
            top: `${(4.5 * dimensions.height) / 9}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          Press E to choose a bracelet
        </div>
      )}

      {/* iPad Tooltip */}
      {showIpadTooltip && (
        <IpadTooltip
          visible={showIpadTooltip}
          position={{
            x: (dimensions.width / 16) * 8.5,
            y: (dimensions.height / 9) * 5.5,
          }}
        />
      )}

      {/* iPad Modal */}
      {showIpadModal && (
        <IpadModal
          onClose={() => setShowIpadModal(false)}
          onSuccess={handleIpadSuccess}
          onFailure={handleIpadFailure}
        />
      )}

      {/* Bull Alert Animation */}
      <BullAlert
        position={{
          x: bullGuardScreenPos.x + 16,
          y: bullGuardScreenPos.y,
        }}
        visible={showBullAlert}
        onAnimationComplete={() => setShowBullAlert(false)}
      />

      {/* Bracelet Selector Modal */}
      {showBraceletSelector && (
        <BraceletSelectorModal
          bracelets={bracelets}
          onSelect={handleBraceletSelection}
          onClose={() => setShowBraceletSelector(false)}
        />
      )}

      {/* Inventory */}
      {showInventory && (
        <Inventory
          items={inventoryItems}
          collectibles={[]}
          characters={!mochaDroppedOff ? [mochaCharacter] : []}
          onClose={() => setShowInventory(false)}
        />
      )}
    </div>
  )
}
