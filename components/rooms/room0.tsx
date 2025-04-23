"use client"

import { useRef, useEffect, useState } from "react"

// Add import for Inventory component at the top of the file
import Inventory from "../inventory"
import KeyIndicator from "../key-indicator"

// Add these imports at the top of the file
import DialogueBox from "../dialogue-box"
import CollectibleSelector from "../collectible-selector"
// Add FirstTimeModal import at the top with other imports
import FirstTimeModal from "../first-time-modal"

// Add a CSS animation for the notification
// Add this at the top of the file, right after the imports:

// Add a keyframes animation for fade-in effect
const fadeInAnimation = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translate(-50%, -60%); }
    to { opacity: 1; transform: translate(-50%, -50%); }
  }
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
  }
`

// Add these interfaces after the existing imports
interface InventoryItem {
  type: string
  position: { x: number; y: number }
  collected: boolean
  name: string
  description: string
}

interface CollectibleItem {
  name: string
  description: string
  collected: boolean
  emoji: string
}

interface Room0Props {
  onExit?: () => void
  savedPosition?: { x: number; y: number }
  onPositionChange?: (position: { x: number; y: number }) => void
}

export default function Room0({ onExit, savedPosition, onPositionChange }: Room0Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Update the initial player position to (12, 8)
  const [playerPosition, setPlayerPosition] = useState(savedPosition || { x: 12, y: 8 })
  const [playerDirection, setPlayerDirection] = useState<"up" | "down" | "left" | "right">("right")
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [showDebug, setShowDebug] = useState(false)
  const [showCollisionGrid, setShowCollisionGrid] = useState(false)
  const [renderCount, setRenderCount] = useState(0)
  const [lastKeyPressed, setLastKeyPressed] = useState<string | null>(null)
  const [movementAttempts, setMovementAttempts] = useState({
    total: 0,
    successful: 0,
    blocked: 0,
  })
  const [backgroundLoaded, setBackgroundLoaded] = useState(false)
  const backgroundImageRef = useRef<HTMLImageElement | null>(null)

  // Add state for character sprites
  const [characterSprites, setCharacterSprites] = useState({
    up: { image: new Image(), loaded: false },
    down: { image: new Image(), loaded: false },
    left: { image: new Image(), loaded: false },
    right: { image: new Image(), loaded: false },
  })

  // Add a state for Mocha's sprite after the characterSprites state
  const [mochaSprite, setMochaSprite] = useState<{
    image: HTMLImageElement
    loaded: boolean
  }>({
    image: new Image(),
    loaded: false,
  })

  // Add these state variables after the existing state declarations
  const [hasAccessCard, setHasAccessCard] = useState(false)
  const [nearBush, setNearBush] = useState(false)
  const [showNotification, setShowNotification] = useState<string | null>(null)
  // Add a new state variable to track if the player is near the teleport point
  const [nearTeleport, setNearTeleport] = useState(false)

  // Add showInventory state after the other state declarations
  const [showInventory, setShowInventory] = useState(false)

  // Add inventory items state after the other state declarations
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])

  // Add these state variables after the existing state declarations
  // IMPORTANT: Initialize showDialogue to false so it doesn't show until after the modal
  const [showDialogue, setShowDialogue] = useState(false)
  const [isTyping, setIsTyping] = useState(true)

  // Add showFirstTimeModal state - initialize to true to show it immediately
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(true)

  // Add a state to track if we've checked localStorage
  const [checkedStorage, setCheckedStorage] = useState(false)

  // Add state for intro sequence
  const [showIntro, setShowIntro] = useState(true)
  const [introBackground, setIntroBackground] = useState<HTMLImageElement | null>(null)
  const [introBackgroundLoaded, setIntroBackgroundLoaded] = useState(false)

  // In the initial dialogueData state, update the character type for each line
  // to match the speaker (BEAR for Latte, HAMSTER for Mocha)
  const [dialogueData, setDialogueData] = useState({
    character: "HAMSTER" as "BEAR" | "HAMSTER" | "BULL_GUARD",
    text: [
      "One year ago, a Bull launched a global productivity empire",
      "Their coffee beans promised endless energy and optimized output for financial wealth, but erased other kinds in the process.",
      "Mental space.",
      "Meaningful relationships.",
      "Physical health.",
      "And the freedom to spend time the way you choose to.",
      "Today, most have forgotten what they lost.",
      "But Latte and Mocha haven't.",
      "So they're breaking into BULL.SH Coffee HQ.",
      "Coffee gives us a reason to check in with ourselves.",
      "To share the grind with the people who make it worth it.",
      "To reflect on what matters to you.",
      "Not everyone defines wealth the same way. But everyone deserves the space to define it for themselves.",
      "And sometimes, all it takes is one honest cup.",
      "This is it. Shift's turning over. Lights will go out in twenty. After that, it's just us and the system.",
      "Feels like the end of something.",
      "Well, if we do this right… It could be the start of something better.",
      "Got this from my contact on the inside. One of the security bulls. Says they're tired of what the company's doing to people. Left an access key hidden somewhere on the grounds.",
      "Can we trust them?",
      "Don't have much choice. But the note seems genuine. They've marked this location on the map. That's where we need to look.",
      "What about security?",
      "Alright, let's run through the plan one last time.",
      "I'll hide in your bag.",
      "You carry me inside and pretend you're just grabbing a coffee.",
      "There's a shelf nearby.",
      "I'll climb in from there and travel through the vents to cut the lights.",
      "You'll have 5 minutes to find the hidden access key before lights go off.",
      'That gets us into the secret chamber where we can find the "financial wealth only" coffee filter',
      "And after that?",
      "I guess we figure it out along the way.",
      "Right. So… one other thing I thought I could carry everything in this bag. But turns out going to the gym 3 hours before was a terrible idea.",
      "…… Dude. Why would you go to the gym first?! Alright well I guess we're only bringing one item with us. And we need to make our choice now.",
      "Choose one tool inspired by time wealth to carry with you.",
    ],
    currentLine: 0,
    speakerName: "NARRATOR",
    speakerNames: [
      "NARRATOR", // Line 1
      "NARRATOR", // Line 2
      "NARRATOR", // Line 3
      "NARRATOR", // Line 4
      "NARRATOR", // Line 5
      "NARRATOR", // Line 6
      "NARRATOR", // Line 7
      "NARRATOR", // Line 8
      "NARRATOR", // Line 9
      "NARRATOR", // Line 10
      "NARRATOR", // Line 11
      "NARRATOR", // Line 12
      "NARRATOR", // Line 13
      "NARRATOR", // Line 14
      "Mocha", // Line 15
      "Latte", // Line 16
      "Mocha", // Line 17
      "Mocha", // Line 18
      "Latte", // Line 19
      "Mocha", // Line 20
      "Latte", // Line 21
      "Mocha", // Line 22
      "Mocha", // Line 23
      "Mocha", // Line 24
      "Mocha", // Line 25
      "Mocha", // Line 26
      "Mocha", // Line 27
      "Mocha", // Line 28
      "Latte", // Line 29
      "Mocha", // Line 30
      "Latte", // Line 31
      "Mocha", // Line 32
      "NARRATOR", // Line 33
    ],
    // Add character types to match the speakers
    characterTypes: [
      "HAMSTER", // NARRATOR Line 1
      "HAMSTER", // NARRATOR Line 2
      "HAMSTER", // NARRATOR Line 3
      "HAMSTER", // NARRATOR Line 4
      "HAMSTER", // NARRATOR Line 5
      "HAMSTER", // NARRATOR Line 6
      "HAMSTER", // NARRATOR Line 7
      "HAMSTER", // NARRATOR Line 8
      "HAMSTER", // NARRATOR Line 9
      "HAMSTER", // NARRATOR Line 10
      "HAMSTER", // NARRATOR Line 11
      "HAMSTER", // NARRATOR Line 12
      "HAMSTER", // NARRATOR Line 13
      "HAMSTER", // NARRATOR Line 14
      "HAMSTER", // MOCHA
      "BEAR", // LATTE
      "HAMSTER", // MOCHA
      "HAMSTER", // MOCHA
      "BEAR", // LATTE
      "HAMSTER", // MOCHA
      "BEAR", // LATTE
      "HAMSTER", // MOCHA
      "HAMSTER", // MOCHA
      "HAMSTER", // MOCHA
      "HAMSTER", // MOCHA
      "HAMSTER", // MOCHA
      "HAMSTER", // MOCHA
      "HAMSTER", // MOCHA
      "BEAR", // LATTE
      "HAMSTER", // MOCHA
      "BEAR", // LATTE
      "HAMSTER", // MOCHA
      "HAMSTER", // NARRATOR
    ],
  })

  // Add state for Mocha character
  const [mochaPosition, setMochaPosition] = useState({ x: 13, y: 8 })
  const [mochaDirection, setMochaDirection] = useState<"up" | "down" | "left" | "right">("left")
  const [showCollectibleSelector, setShowCollectibleSelector] = useState(false)

  // Add collectibles state (empty for Room0)
  const [collectibles, setCollectibles] = useState<CollectibleItem[]>([
    {
      name: "Pocket Timer",
      description: "For when you want to stay present, not productive.",
      collected: false,
      emoji: "⏱️",
    },
    {
      name: "Hourglass",
      description: "Remember that time moves, even when you don't.",
      collected: false,
      emoji: "⌛",
    },
    {
      name: "Daily To-Do Lists",
      description: "A reminder that progress doesn't have to be perfect.",
      collected: false,
      emoji: "📝",
    },
    {
      name: "No Meetings Postcard",
      description: "For the boundaries you set.",
      collected: false,
      emoji: "📮",
    },
    {
      name: "Later Stamp",
      description: "Not now. Not a priority in my life. Maybe not ever.",
      collected: false,
      emoji: "🔖",
    },
  ])

  // Define the collision grid based on the provided data
  const collisionGrid = {
    // y=9 (top row)
    9: [0, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    // y=8
    8: [0, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    // y=7
    7: [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    // y=6
    6: [0, 1, 0, 0, 1, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    // y=5
    5: [0, 1, 0, 0, 1, 1, 2, 1, 1, 0, 0, 0, 1, 0, 1, 0],
    // y=4
    4: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0],
    // y=3
    3: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    // y=2
    2: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0],
    // y=1 (bottom row)
    1: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0],
  }

  // Load intro background image
  useEffect(() => {
    const introImg = new Image()
    introImg.src = "/images/int-bullsh-night.png"
    introImg.crossOrigin = "anonymous"

    introImg.onload = () => {
      console.log("Intro background loaded successfully")
      setIntroBackground(introImg)
      setIntroBackgroundLoaded(true)
    }

    introImg.onerror = (e) => {
      console.error("Failed to load intro background:", e)
      setIntroBackgroundLoaded(false)
    }

    return () => {
      if (introImg) {
        introImg.onload = null
        introImg.onerror = null
      }
    }
  }, [])

  // Check localStorage on component mount
  useEffect(() => {
    // Check if this is the first time loading the game
    const assetsLoaded = localStorage.getItem("assetsLoaded")

    if (assetsLoaded === "true") {
      // If assets are already loaded, hide modal and show dialogue
      setShowFirstTimeModal(false)
      setShowDialogue(true)
    } else {
      // If first time, show modal and hide dialogue
      setShowFirstTimeModal(true)
      setShowDialogue(false)
    }

    setCheckedStorage(true)
  }, [])

  // Load background image
  useEffect(() => {
    const backgroundImage = new Image()
    // Use the provided image URL
    backgroundImage.src =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/room%200%20floor%20plane.jpg-iTzMk9kznUNQyrV9ZkUHjkdqGf5gc7.jpeg"
    backgroundImage.crossOrigin = "anonymous"

    backgroundImage.onload = () => {
      console.log("Background image loaded successfully")
      backgroundImageRef.current = backgroundImage
      setBackgroundLoaded(true)
    }

    backgroundImage.onerror = (e) => {
      console.error("Failed to load background image:", e)
      // Set background loaded to false so we fall back to the default rendering
      setBackgroundLoaded(false)
    }

    // Load character sprites
    const loadSprite = (direction: "up" | "down" | "left" | "right") => {
      const sprite = new Image()

      // Use the same sprite paths as other rooms
      const spriteUrls = {
        up: "/images/latte_up_standing.png",
        down: "/images/latte_down_standing.png",
        left: "/images/latte_left_standing.png",
        right: "/images/latte_right_standing.png",
      }

      // Fallback to a generic URL if the specific one isn't available
      sprite.src = spriteUrls[direction] || `/images/latte_${direction}_standing.png`
      sprite.crossOrigin = "anonymous"

      // Immediately mark as not loaded in state to ensure UI doesn't wait
      setCharacterSprites((prev) => ({
        ...prev,
        [direction]: { image: sprite, loaded: false },
      }))

      sprite.onload = () => {
        console.log(`Successfully loaded ${direction} sprite`)
        setCharacterSprites((prev) => ({
          ...prev,
          [direction]: { image: sprite, loaded: true },
        }))
      }

      sprite.onerror = (e) => {
        console.warn(`Failed to load ${direction} sprite, using fallback rendering`, e)
        // Keep the sprite marked as not loaded so we use the fallback
      }

      return sprite
    }

    // Load Mocha sprite
    const mochaImg = new Image()
    mochaImg.src = "/images/Mocha_left_standing.png"
    mochaImg.crossOrigin = "anonymous"

    mochaImg.onload = () => {
      console.log("Successfully loaded Mocha sprite")
      setMochaSprite({
        image: mochaImg,
        loaded: true,
      })
    }

    mochaImg.onerror = (e) => {
      console.warn("Failed to load Mocha sprite, using fallback rendering", e)
    }

    // Load all four direction sprites
    const upSprite = loadSprite("up")
    const downSprite = loadSprite("down")
    const leftSprite = loadSprite("left")
    const rightSprite = loadSprite("right")

    return () => {
      if (backgroundImage) {
        backgroundImage.onload = null
        backgroundImage.onerror = null
      }
      // Clean up sprite event listeners
      ;[upSprite, downSprite, leftSprite, rightSprite].forEach((sprite) => {
        if (sprite) {
          sprite.onload = null
          sprite.onerror = null
        }
      })

      if (mochaImg) {
        mochaImg.onload = null
        mochaImg.onerror = null
      }
    }
  }, [])

  // Update dimensions on client side
  useEffect(() => {
    // Only run on client
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

  // Define cellWidth and cellHeight based on dimensions
  const cellWidth = dimensions.width / 16
  const cellHeight = dimensions.height / 9

  // Keep track of which keys are pressed
  const keysPressed = useRef({})

  // Handle key presses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip movement if dialogue is showing
      if (showDialogue) return

      keysPressed.current[e.key.toLowerCase()] = true

      // Toggle debug mode with Ctrl+H
      if (e.key.toLowerCase() === "h" && (e.ctrlKey || e.metaKey)) {
        setShowDebug((prev) => !prev)
        console.log("Debug mode:", !showDebug) // Log the toggle for confirmation
        e.preventDefault()
        return
      }

      // Toggle collision grid with C key
      if (e.key.toLowerCase() === "c") {
        setShowCollisionGrid((prev) => !prev)
        return
      }

      // Inside the existing handleKeyDown function, add:
      if (e.key.toLowerCase() === "e") {
        if (nearBush && !hasAccessCard) {
          interactWithBush()
          return
        }

        // Add this new condition for teleporting
        if (nearTeleport) {
          if (onExit) {
            onExit() // This will trigger the transition to Room 2
          }
          return
        }
      }

      // Track last key pressed for debugging
      setLastKeyPressed(e.key)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [onExit, showDebug, nearBush, hasAccessCard, nearTeleport, showDialogue])

  // Add this useEffect to handle the "I" key for inventory toggle
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

  // Update the advanceDialogue function to also update the character type
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

      // Update the character type if we have characterTypes array
      const nextCharacterType =
        dialogueData.characterTypes && dialogueData.characterTypes[nextLine]
          ? dialogueData.characterTypes[nextLine]
          : dialogueData.character

      setDialogueData({
        ...dialogueData,
        currentLine: nextLine,
        speakerName: nextSpeakerName,
        character: nextCharacterType,
      })
      setIsTyping(true)

      // If we're at the last line, show the collectible selector
      if (nextLine === dialogueData.text.length - 1) {
        // Show collectible selector after a short delay
        setTimeout(() => {
          setShowCollectibleSelector(true)
        }, 1000)
      }

      // Check if we're transitioning from intro to gameplay
      if (nextLine === 14) {
        // This is the transition from intro to gameplay
        setShowIntro(false)
      }
    } else {
      // End dialogue
      setShowDialogue(false)
    }
  }

  // Add these handler functions for the modal
  const handleRefresh = () => {
    window.location.reload()
  }

  const handleContinue = () => {
    // Set localStorage to remember that assets are loaded
    localStorage.setItem("assetsLoaded", "true")
    // Close modal and start dialogue
    setShowFirstTimeModal(false)
    setShowDialogue(true)
  }

  // Add a function to handle collectible selection
  const handleCollectibleSelection = (collectibleName: string) => {
    // Find the selected collectible
    const selectedItem = collectibles.find((item) => item.name === collectibleName)

    if (selectedItem) {
      // Mark the item as collected
      const updatedCollectibles = collectibles.map((item) =>
        item.name === collectibleName ? { ...item, collected: true } : item,
      )
      setCollectibles(updatedCollectibles)

      // Add to inventory
      const collectibleItem: InventoryItem = {
        type: "COLLECTIBLE",
        position: { x: 0, y: 0 },
        collected: true,
        name: selectedItem.name,
        description: selectedItem.description,
      }
      setInventoryItems((prev) => [...prev, collectibleItem])

      // Close the selector
      setShowCollectibleSelector(false)

      // Show final dialogue - but only once
      setDialogueData({
        character: "HAMSTER",
        text: [`Nice choice... LFG!`],
        currentLine: 0,
        speakerName: "Mocha",
      })
      setIsTyping(true)

      // End dialogue after a short delay and don't show it again
      // Use a slightly shorter delay to ensure it doesn't overlap with Mocha's movement
      setTimeout(() => {
        setShowDialogue(false)

        // Add a brief notification instead of dialogue
        setShowNotification("Mocha is ready to go! Press E to continue.")
        setTimeout(() => setShowNotification(null), 3000)

        // Move Mocha closer to Latte to prepare for the next room
        setMochaPosition({ x: playerPosition.x + 1, y: playerPosition.y })
        setMochaDirection("left")
      }, 2000)
    }
  }

  // Add this useEffect to handle the Enter/Space key for dialogue advancement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showDialogue && !isTyping && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault()
        advanceDialogue()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showDialogue, isTyping, dialogueData])

  // Replace the existing player movement useEffect with this continuous movement system
  // Find this useEffect (around line 200-240):
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip movement if inventory is open
      if (showInventory) return

      // Skip movement if dialogue is showing
      if (showDialogue) return

      // Mark this key as pressed
      keysPressed.current[e.key.toLowerCase()] = true
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      // Clear the key press state when key is released
      keysPressed.current[e.key.toLowerCase()] = false
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [showInventory, showDialogue])

  // Add a new useEffect for continuous movement
  useEffect(() => {
    // Skip if inventory is open
    if (showInventory) return

    // Skip if dialogue is showing
    if (showDialogue) return

    const moveInterval = setInterval(() => {
      let newX = playerPosition.x
      let newY = playerPosition.y
      let newDirection = playerDirection
      let moved = false

      // Movement speed (smaller for smoother movement)
      const moveStep = 0.1

      // Process movement based on keys held down
      if (keysPressed.current["w"] || keysPressed.current["arrowup"]) {
        newY += moveStep // Up means increasing Y
        newDirection = "up"
        moved = true
      }
      if (keysPressed.current["s"] || keysPressed.current["arrowdown"]) {
        newY -= moveStep // Down means decreasing Y
        newDirection = "down"
        moved = true
      }
      if (keysPressed.current["a"] || keysPressed.current["arrowleft"]) {
        newX -= moveStep
        newDirection = "left"
        moved = true
      }
      if (keysPressed.current["d"] || keysPressed.current["arrowright"]) {
        newX += moveStep
        newDirection = "right"
        moved = true
      }

      // Update direction even if we can't move
      if (newDirection !== playerDirection) {
        setPlayerDirection(newDirection)
      }

      // Check if the new position is valid
      if (moved && canMoveToPosition(Math.round(newX), Math.round(newY))) {
        setPlayerPosition({ x: newX, y: newY })

        // Report position change to parent
        if (onPositionChange) {
          onPositionChange({ x: newX, y: newY })
        }
      }
    }, 16) // ~60fps

    return () => clearInterval(moveInterval)
  }, [playerPosition, playerDirection, onPositionChange, showInventory, showDialogue])

  // Update the canMoveToPosition function to handle fractional positions
  const canMoveToPosition = (x: number, y: number): boolean => {
    // Round to nearest integer for collision checking
    const roundedX = Math.round(x)
    const roundedY = Math.round(y)

    // Check boundaries
    if (roundedX < 1 || roundedX > 16 || roundedY < 1 || roundedY > 9) {
      return false
    }

    // Check collision grid
    const collisionValue = collisionGrid[roundedY]?.[roundedX - 1]

    // If collisionValue is undefined or 0, the position is walkable
    // If collisionValue is 2 and player has access card, the position is also walkable
    return collisionValue === 0 || (collisionValue === 2 && hasAccessCard)
  }

  // Add a function to check if the player is near the bush
  const checkNearBush = () => {
    const distance = Math.sqrt(Math.pow(playerPosition.x - 2, 2) + Math.pow(playerPosition.y - 6, 2))
    setNearBush(distance <= 1)
  }

  // Add a function to check if the player is near the teleport point (7,6)
  const checkNearTeleport = () => {
    const distance = Math.sqrt(Math.pow(playerPosition.x - 7, 2) + Math.pow(playerPosition.y - 6, 2))
    setNearTeleport(distance <= 1)
  }

  // Modify the interactWithBush function to give a key instead of an access card
  const interactWithBush = () => {
    if (nearBush && !hasAccessCard) {
      setHasAccessCard(true)

      // Add a Bull.SH HQ ID card to inventory
      const idCardItem: InventoryItem = {
        type: "ID_CARD",
        position: { x: 0, y: 0 },
        collected: true,
        name: "Bull.SH HQ ID Card",
        description: "An official Bull.SH HQ identification card. Grants access to restricted areas.",
      }

      setInventoryItems((prev) => [...prev, idCardItem])

      setShowNotification("You found a Bull.SH HQ ID Card! It has been added to your inventory.")
      setTimeout(() => setShowNotification(null), 3000)
    }
  }

  // Update the useEffect that checks player position to also check for teleport proximity
  // Add this to the existing useEffect that calls checkNearBush
  useEffect(() => {
    checkNearBush()
    checkNearTeleport()
  }, [playerPosition])

  // Draw the room
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = dimensions.width
    canvas.height = dimensions.height

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height)

    // If showing intro, draw the intro background
    if (showIntro && introBackgroundLoaded && introBackground) {
      // Draw the intro background image
      ctx.drawImage(introBackground, 0, 0, dimensions.width, dimensions.height)
      return // Don't draw anything else during intro
    }

    // Draw background
    if (backgroundLoaded && backgroundImageRef.current) {
      // Draw the background image
      ctx.drawImage(backgroundImageRef.current, 0, 0, dimensions.width, dimensions.height)
    } else {
      // Fallback if image not loaded
      ctx.fillStyle = "#333"
      ctx.fillRect(0, 0, dimensions.width, dimensions.height)

      // Draw grid lines
      ctx.strokeStyle = "#444"
      ctx.lineWidth = 1

      // Draw grid lines
      for (let i = 0; i <= 16; i++) {
        const posX = i * cellWidth

        // Vertical lines
        ctx.beginPath()
        ctx.moveTo(posX, 0)
        ctx.lineTo(posX, dimensions.height)
        ctx.stroke()
      }

      for (let i = 0; i <= 9; i++) {
        const posY = i * cellHeight

        // Horizontal lines
        ctx.beginPath()
        ctx.moveTo(0, posY)
        ctx.lineTo(dimensions.width, posY)
        ctx.stroke()
      }
    }

    // Remove the code that draws the bush at position (2,6)
    // Comment out or remove these lines (around line 300-315):

    // Keep the visual indicator when the player is near the bush, but make it more subtle
    // Modify these lines to make the indicator less visible but still functional:

    // Remove the visual indicator when the player is near the bush
    if (nearBush && !hasAccessCard) {
      // Draw a subtle glow around the bush
      const bushX = (2 - 1) * cellWidth
      const bushY = (9 - 6) * cellHeight
      ctx.fillStyle = "rgba(255, 255, 100, 0.1)" // Make it very transparent
      ctx.beginPath()
      ctx.arc(bushX + cellWidth / 2, bushY + cellHeight / 2, cellWidth * 0.6, 0, Math.PI * 2)
      ctx.fill()

      // Draw a small "!" above the bush
      ctx.fillStyle = "rgba(255, 255, 100, 0.8)"
      ctx.font = "bold 16px Arial"
      ctx.textAlign = "center"
      ctx.fillText("!", bushX + cellWidth / 2, bushY - 10)
    }

    // Add a visual indicator for the teleport point in the drawing useEffect
    // Add this code after the bush indicator code:
    // Replace the existing teleport indicator code in the drawing useEffect
    // Find this code:
    // Add a visual indicator when the player is near the teleport point
    // Remove the visual indicator for the teleport point
    // No visual indicators will be drawn for the teleport point

    // If the player has the access card, draw a glow around the special areas (collision value 2)

    // Draw collision grid if enabled
    if (showCollisionGrid) {
      for (let y = 1; y <= 9; y++) {
        for (let x = 1; x <= 16; x++) {
          const collisionValue = collisionGrid[y]?.[x - 1]

          if (collisionValue !== undefined) {
            const cellX = (x - 1) * cellWidth
            const cellY = (9 - y) * cellHeight

            // Different colors for different collision types
            if (collisionValue === 1) {
              // Wall
              ctx.fillStyle = "rgba(255, 0, 0, 0.3)"
              ctx.fillRect(cellX, cellY, cellWidth, cellHeight)
            } else if (collisionValue === 2) {
              // Special
              ctx.fillStyle = "rgba(0, 0, 255, 0.3)"
              ctx.fillRect(cellX, cellY, cellWidth, cellHeight)
            }

            // Show collision values
            ctx.fillStyle = "white"
            ctx.font = "10px Arial"
            ctx.textAlign = "center"
            ctx.fillText(collisionValue.toString(), cellX + cellWidth / 2, cellY + cellHeight / 2)
          }
        }
      }
    }

    // Add Mocha to the drawPlayer function
    // Draw player
    if (!showIntro) {
      drawPlayer(ctx)
    }
  }, [
    dimensions,
    playerPosition,
    playerDirection,
    showDebug,
    showCollisionGrid,
    backgroundLoaded,
    lastKeyPressed,
    hasAccessCard,
    nearBush,
    nearTeleport,
    showDialogue,
    mochaPosition,
    showIntro,
    introBackgroundLoaded,
    introBackground,
  ])

  const drawPlayer = (ctx: CanvasRenderingContext2D) => {
    // Draw Latte (player)
    const x = (playerPosition.x - 1) * cellWidth
    const y = (9 - playerPosition.y) * cellHeight

    // Get the sprite for the current direction
    const sprite = characterSprites[playerDirection]

    if (sprite && sprite.loaded && sprite.image.complete && sprite.image.naturalWidth > 0) {
      // Draw the character sprite
      const spriteWidth = cellWidth * 1.2 // Make sprite slightly larger than cell
      const spriteHeight = cellHeight * 1.2
      const offsetX = (cellWidth - spriteWidth) / 2
      const offsetY = (cellHeight - spriteHeight) / 2

      ctx.drawImage(sprite.image, x + offsetX, y + offsetY, spriteWidth, spriteHeight)
    } else {
      // Fallback if sprite not loaded
      drawFallbackPlayer(ctx, x, y)
    }

    // Always add player name above character
    ctx.fillStyle = "white"
    ctx.font = "12px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Latte", x + cellWidth / 2, y - 5)

    // Draw Mocha if dialogue is showing
    if (showDialogue) {
      const mochaX = (mochaPosition.x - 1) * cellWidth
      const mochaY = (9 - mochaPosition.y) * cellHeight

      if (mochaSprite.loaded && mochaSprite.image.complete && mochaSprite.image.naturalWidth > 0) {
        // Draw the Mocha sprite
        const spriteWidth = cellWidth * 1.2 // Make sprite slightly larger than cell
        const spriteHeight = cellHeight * 1.2
        const offsetX = (cellWidth - spriteWidth) / 2
        const offsetY = (cellHeight - spriteHeight) / 2

        ctx.drawImage(mochaSprite.image, mochaX + offsetX, mochaY + offsetY, spriteWidth, spriteHeight)
      } else {
        // Fallback if sprite not loaded
        // Hamster body
        ctx.fillStyle = "#F5DEB3" // Wheat color for hamster
        ctx.beginPath()
        ctx.ellipse(
          mochaX + cellWidth / 2,
          mochaY + cellHeight / 2,
          cellWidth * 0.4,
          cellHeight * 0.3,
          0,
          0,
          Math.PI * 2,
        )
        ctx.fill()

        // Hamster face
        ctx.fillStyle = "#FFE4B5" // Moccasin
        ctx.beginPath()
        ctx.arc(mochaX + cellWidth * 0.6, mochaY + cellHeight * 0.4, cellWidth * 0.2, 0, Math.PI * 2)
        ctx.fill()

        // Hamster ears
        ctx.fillStyle = "#D2B48C" // Tan
        ctx.beginPath()
        ctx.ellipse(
          mochaX + cellWidth * 0.4,
          mochaY + cellHeight * 0.3,
          cellWidth * 0.1,
          cellHeight * 0.15,
          0,
          0,
          Math.PI * 2,
        )
        ctx.fill()

        // Eyes
        ctx.fillStyle = "#000"
        ctx.beginPath()
        ctx.arc(mochaX + cellWidth * 0.5, mochaY + cellHeight * 0.4, cellWidth * 0.05, 0, Math.PI * 2)
        ctx.arc(mochaX + cellWidth * 0.7, mochaY + cellHeight * 0.4, cellWidth * 0.05, 0, Math.PI * 2)
        ctx.fill()
      }

      // Add name
      ctx.fillStyle = "white"
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Mocha", mochaX + cellWidth / 2, mochaY - 5)
    }
  }

  // Add a separate function for the fallback player rendering
  const drawFallbackPlayer = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = "#FFA500" // Orange
    ctx.beginPath()
    ctx.arc(x + cellWidth / 2, y + cellHeight / 2, Math.min(cellWidth, cellHeight) / 3, 0, Math.PI * 2)
    ctx.fill()

    // Draw direction indicator
    ctx.fillStyle = "#8B4513" // Brown
    const indicatorSize = Math.min(cellWidth, cellHeight) / 8

    if (playerDirection === "up") {
      ctx.beginPath()
      ctx.moveTo(x + cellWidth / 2, y + cellHeight / 2 - indicatorSize * 2)
      ctx.lineTo(x + cellWidth / 2 - indicatorSize, y + cellHeight / 2 - indicatorSize)
      ctx.lineTo(x + cellWidth / 2 + indicatorSize, y + cellHeight / 2 - indicatorSize)
      ctx.fill()
    } else if (playerDirection === "down") {
      ctx.beginPath()
      ctx.moveTo(x + cellWidth / 2, y + cellHeight / 2 + indicatorSize * 2)
      ctx.lineTo(x + cellWidth / 2 - indicatorSize, y + cellHeight / 2 + indicatorSize)
      ctx.lineTo(x + cellWidth / 2 + indicatorSize, y + cellHeight / 2 + indicatorSize)
      ctx.fill()
    } else if (playerDirection === "left") {
      ctx.beginPath()
      ctx.moveTo(x + cellWidth / 2 - indicatorSize * 2, y + cellHeight / 2)
      ctx.lineTo(x + cellWidth / 2 - indicatorSize, y + cellHeight / 2 - indicatorSize)
      ctx.lineTo(x + cellWidth / 2 - indicatorSize, y + cellHeight / 2 + indicatorSize)
      ctx.fill()
    } else if (playerDirection === "right") {
      ctx.beginPath()
      ctx.moveTo(x + cellWidth / 2 + indicatorSize * 2, y + cellHeight / 2)
      ctx.lineTo(x + cellWidth / 2 + indicatorSize, y + cellHeight / 2 - indicatorSize)
      ctx.lineTo(x + cellWidth / 2 + indicatorSize, y + cellHeight / 2 + indicatorSize)
      ctx.fill()
    }
  }

  return (
    <div className="relative w-full h-screen">
      <style jsx>{`
        ${fadeInAnimation}
      `}</style>
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* Room-specific controls - only show what's unique to this room */}
      <div className="absolute top-4 right-4 flex gap-2">
        {/* WASD control is already shown by parent component */}
        {(nearBush && !hasAccessCard) || nearTeleport ? <KeyIndicator keyLabel="E" text="Interact" /> : null}
        {/* I and ESC keys are also shown by parent component */}
      </div>

      {/* Debug mode indicator */}
      {showDebug && (
        <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
          <span className="text-green-400 font-bold">DEBUG MODE</span>
          <span className="ml-2 text-xs">Press Ctrl+H to toggle</span>
        </div>
      )}
      {nearBush && !hasAccessCard && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-md text-sm">
          Press E to search the bush
        </div>
      )}
      {nearTeleport && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-md text-sm">
          Press E to enter Room 2
        </div>
      )}

      {showNotification && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-4 py-2 rounded-md text-lg animate-fade-in">
          {showNotification}
        </div>
      )}
      {showInventory && (
        <Inventory items={inventoryItems} collectibles={collectibles} onClose={() => setShowInventory(false)} />
      )}

      {/* Dialogue Box */}
      {showDialogue && (
        <DialogueBox
          character={dialogueData.character}
          text={dialogueData.text[dialogueData.currentLine]}
          speakerName={dialogueData.speakerName}
          isTyping={isTyping}
          setIsTyping={setIsTyping}
          onAdvanceDialogue={advanceDialogue}
          onShowCollectibleSelector={
            dialogueData.currentLine === dialogueData.text.length - 1
              ? () => setShowCollectibleSelector(true)
              : undefined
          }
        />
      )}

      {/* Collectible Selector */}
      {showCollectibleSelector && (
        <CollectibleSelector collectibles={collectibles} onSelect={handleCollectibleSelection} />
      )}

      {/* First-time Modal - Show it on top of everything else */}
      {showFirstTimeModal && (
        <FirstTimeModal
          onClose={() => {
            setShowFirstTimeModal(false)
            setShowDialogue(true)
          }}
          onRefresh={handleRefresh}
          onContinue={handleContinue}
        />
      )}
    </div>
  )
}
