"use client"

import { useRef, useEffect, useState, useCallback } from "react"

// Add imports for KeyIndicator at the top of the file
import KeyIndicator from "../key-indicator"

// Import the DialogueBox component
import DialogueBox from "../dialogue-box"

// Define the CollectibleItem type
interface CollectibleItem {
  id: string
  name: string
  description: string
  collected: boolean
}

// Change the MAZE_GRID array to be defined from bottom to top, with (0,0) at bottom left
const MAZE_GRID = [
  [1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 0], // Row 0 (bottom) - Changed 7,0 to 1 for lever position
  [1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0], // Row 1 - Changed 6,1 to 0 (wall)
  [0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0], // Row 2
  [0, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0], // Row 3
  [0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0], // Row 4
  [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0], // Row 5
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1], // Row 6
  [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], // Row 7
  [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], // Row 8 (top) - Changed position (6,8) to 1 to make it passable
]

// Update the maze grid to make position (14,0) a valid path
MAZE_GRID[0][14] = 1

// Also preserve the lever states when returning from menu
interface Room4Props {
  onExit?: () => void
  savedPosition?: { x: number; y: number }
  onPositionChange?: (position: { x: number; y: number }) => void
  savedLevers?: {
    lever1: boolean
    lever2: boolean
    lever3: boolean
    lever4: boolean
    leverS: boolean
  }
  onLeversChange?: (levers: {
    lever1: boolean
    lever2: boolean
    lever3: boolean
    lever4: boolean
    leverS: boolean
  }) => void
  savedDecoyLeverActivated?: boolean
  onDecoyLeverChange?: (activated: boolean) => void
  savedBoxOpened?: boolean
  onBoxOpenedChange?: (opened: boolean) => void
}

export default function Room4({
  onExit,
  savedPosition,
  onPositionChange,
  savedLevers,
  onLeversChange,
  savedDecoyLeverActivated,
  onDecoyLeverChange,
  savedBoxOpened,
  onBoxOpenedChange,
}: Room4Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [playerPosition, setPlayerPosition] = useState(savedPosition || { x: 0, y: 0 })
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const keysRef = useRef<Record<string, boolean>>({})
  const [floorTileLoaded, setFloorTileLoaded] = useState(false)
  const floorTileRef = useRef<HTMLImageElement | null>(null)
  // Set showDebug to false and remove the ability to toggle it
  const [showDebug, setShowDebug] = useState(false)
  const [showLeverPrompt, setShowLeverPrompt] = useState(false)
  const [showBoxPrompt, setShowBoxPrompt] = useState(false)
  const [showNotification, setShowNotification] = useState<string | null>(null)
  const [showCollectibleSelector, setShowCollectibleSelector] = useState(false)

  // Add a new state for the special lever
  const [specialLeverActivated, setSpecialLeverActivated] = useState(false)
  // Modify the levers state to include leverS and use savedLevers if provided
  const [levers, setLevers] = useState(
    savedLevers || {
      lever1: false,
      lever2: false,
      lever3: false,
      lever4: false,
      leverS: false,
    },
  )

  // Add a new state to track if the decoy lever has been activated
  const [decoyLeverActivated, setDecoyLeverActivated] = useState(savedDecoyLeverActivated || false)

  // Add state to track if the box has been opened
  const [boxOpened, setBoxOpened] = useState(savedBoxOpened || false)

  // Add a state to track if the intro dialogue has been shown
  const [introDialogueShown, setIntroDialogueShown] = useState(false)
  const [showDialogue, setShowDialogue] = useState(false)
  const [dialogueData, setDialogueData] = useState<{
    character: "BEAR" | "HAMSTER"
    text: string[]
    currentLine: number
    speakerName: string
    speakerNames?: string[]
  }>({
    character: "HAMSTER",
    text: [
      "Nice, we made it into the vents, let's get out of here now.",
      "Now if I remember correctly, the exit should be on the north side of the ventilation system, but there is a gate blocking it which we will need to manually override.",
      "I remember seeing in the blueprints we need to find 3 levers, and activate all of them to open the door.",
      "It's so dark in here we can barely see.",
      "Oh also, I saw in the blueprints that there is a purple lever we should avoid... I'm not sure what it does but if you see it avoid it.",
      "Sounds like a plan, let's get out of here.",
    ],
    currentLine: 0,
    speakerName: "Mocha",
    speakerNames: ["Mocha", "Mocha", "Mocha", "Mocha", "Mocha", "Latte"],
  })

  // Add a state to track if the dialogue is typing
  const [isTyping, setIsTyping] = useState(false)

  // Add refs for lever images
  const leverLockedRef = useRef<HTMLImageElement | null>(null)
  const leverUnlockedRef = useRef<HTMLImageElement | null>(null)
  // Add a new state for the special lever
  // Modify the levers state to include leverS

  // Add a new state to track if the decoy lever has been activated

  // Add refs for door images
  const doorClosedRef = useRef<HTMLCanvasElement>(null)
  const doorOpenedRef = useRef<HTMLCanvasElement>(null)
  const specialDoorOpenedRef = useRef<HTMLImageElement | null>(null) // New ref for special door opened
  const [doorImagesLoaded, setDoorImagesLoaded] = useState({
    closed: false,
    opened: false,
  })

  // Add special door images loaded state
  const [specialDoorImagesLoaded, setSpecialDoorImagesLoaded] = useState({
    closed: false,
    opened: false,
  })

  // Add the decoy lever image ref
  const decoyLeverRef = useRef<HTMLImageElement | null>(null)
  const [leverImagesLoaded, setLeverImagesLoaded] = useState({
    locked: false,
    unlocked: false,
    decoy: false,
  })

  // Add these new image refs for the special lever
  const leverSpecialClosedRef = useRef<HTMLImageElement | null>(null)
  const leverSpecialOpenRef = useRef<HTMLImageElement | null>(null)
  const [specialLeverImagesLoaded, setSpecialLeverImagesLoaded] = useState({
    closed: false,
    open: false,
  })

  // Add ref for the box image
  const boxImageRef = useRef<HTMLImageElement | null>(null)
  const [boxImageLoaded, setBoxImageLoaded] = useState(false)

  // Add state for collectible items
  const [collectibles, setCollectibles] = useState<CollectibleItem[]>([
    {
      id: "item1",
      name: "Golden Running Shoes",
      description:
        "Increases stamina and reminds players that consistent exercise is the foundation of physical wellness.",
      collected: false,
    },
    {
      id: "item2",
      name: "Sunset Yoga Mat",
      description:
        "Grants flexibility bonuses and represents the value of stretching and mindfulness for physical maintenance.",
      collected: false,
    },
    {
      id: "item3",
      name: "Heart Rate Monitor Watch",
      description: "Reveals hidden health statistics and teaches players to track vital signs for preventative care.",
      collected: false,
    },
    {
      id: "item4",
      name: "Sunshine Orb",
      description: "Grants vitamin bonuses and symbolises the importance of natural light for mood and bone health.",
      collected: false,
    },
    {
      id: "item5",
      name: "Resistance Band Set",
      description:
        "Enhances muscle tone and flexibility, showing how versatile, portable equipment can maintain fitness anywhere.",
      collected: false,
    },
  ])

  // Add state to track if the box has been opened

  // Add this near the beginning of the component, after the state declarations
  useEffect(() => {
    // Show intro dialogue when first entering Room 4
    if (!introDialogueShown) {
      setShowDialogue(true)
      setIntroDialogueShown(true)
    }
  }, [introDialogueShown])

  // Load floor tile image with better error handling
  useEffect(() => {
    const floorTile = new Image()
    floorTile.src = "/images/vent-floor-tile.png"
    floorTile.crossOrigin = "anonymous" // Add this to avoid CORS issues

    floorTile.onload = () => {
      floorTileRef.current = floorTile
      setFloorTileLoaded(true)
    }

    floorTile.onerror = () => {
      console.warn("Could not load vent floor tile image, using fallback pattern")
      setFloorTileLoaded(false)
    }

    // Load lever images
    const leverLocked = new Image()
    leverLocked.src = "/images/lever-locked.png"
    leverLocked.crossOrigin = "anonymous"

    leverLocked.onload = () => {
      leverLockedRef.current = leverLocked
      setLeverImagesLoaded((prev) => ({ ...prev, locked: true }))
    }

    leverLocked.onerror = () => {
      console.warn("Could not load lever-locked image, using fallback graphics")
    }

    const leverUnlocked = new Image()
    leverUnlocked.src = "/images/lever-unlocked.png"
    leverUnlocked.crossOrigin = "anonymous"

    leverUnlocked.onload = () => {
      leverUnlockedRef.current = leverUnlocked
      setLeverImagesLoaded((prev) => ({ ...prev, unlocked: true }))
    }

    leverUnlocked.onerror = () => {
      console.warn("Could not load lever-unlocked image, using fallback graphics")
    }

    // Load decoy lever image
    const decoyLever = new Image()
    decoyLever.src = "/images/decoy-lever.png"
    decoyLever.crossOrigin = "anonymous"

    decoyLever.onload = () => {
      decoyLeverRef.current = decoyLever
      setLeverImagesLoaded((prev) => ({ ...prev, decoy: true }))
    }

    decoyLever.onerror = () => {
      console.warn("Could not load decoy-lever image, using fallback graphics")
    }

    // Load special lever images
    const leverSpecialClosed = new Image()
    leverSpecialClosed.src =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Lever%20Special%20Closed-E5UqBRTCN4nfi5MJiMS6ObJDONlW2W.png"
    leverSpecialClosed.crossOrigin = "anonymous"

    leverSpecialClosed.onload = () => {
      leverSpecialClosedRef.current = leverSpecialClosed
      setSpecialLeverImagesLoaded((prev) => ({ ...prev, closed: true }))
    }

    leverSpecialClosed.onerror = () => {
      console.warn("Could not load lever-special-closed image, using fallback graphics")
    }

    const leverSpecialOpen = new Image()
    leverSpecialOpen.src =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Lever%20Special%20Open-6i7BBoDPJ2z2aG7QdHyqdc4qUIvdGM.png"
    leverSpecialOpen.crossOrigin = "anonymous"

    leverSpecialOpen.onload = () => {
      leverSpecialOpenRef.current = leverSpecialOpen
      setSpecialLeverImagesLoaded((prev) => ({ ...prev, open: true }))
    }

    leverSpecialOpen.onerror = () => {
      console.warn("Could not load lever-special-open image, using fallback graphics")
    }

    // Load box image
    const boxImage = new Image()
    boxImage.src =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/floor%20box-388o4Y1bjpx0Maq2eEqPGqaaMzN91q.png"
    boxImage.crossOrigin = "anonymous"

    boxImage.onload = () => {
      boxImageRef.current = boxImage
      setBoxImageLoaded(true)
    }

    boxImage.onerror = () => {
      console.warn("Could not load box image, using fallback graphics")
    }

    // Try loading door images with different formats and paths
    const tryLoadDoorImages = () => {
      // Use the exact filenames and URLs provided by the user
      const doorClosed = new Image()
      doorClosed.crossOrigin = "anonymous"
      doorClosed.src =
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Room%204%20Door%20Closed-JFwp8PSG8USrbImNJSQdnf4DZTuxjc.png"
      console.log("Loading closed door from:", doorClosed.src)

      doorClosed.onload = () => {
        console.log("Door closed image loaded successfully")
        doorClosedRef.current = doorClosed
        setDoorImagesLoaded((prev) => ({ ...prev, closed: true }))
      }

      doorClosed.onerror = (e) => {
        console.error("Failed to load closed door image:", e)
      }

      const doorOpened = new Image()
      doorOpened.crossOrigin = "anonymous"
      doorOpened.src =
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Room%204%20Door%20Opened-saVRtRYGS8HlYu8ecN12lEkMgc71Vm.png"
      console.log("Loading opened door from:", doorOpened.src)

      doorOpened.onload = () => {
        console.log("Door opened image loaded successfully")
        doorOpenedRef.current = doorOpened
        setDoorImagesLoaded((prev) => ({ ...prev, opened: true }))
      }

      doorOpened.onerror = (e) => {
        console.error("Failed to load opened door image:", e)
      }

      // Add special door opened image
      const specialDoorOpened = new Image()
      specialDoorOpened.crossOrigin = "anonymous"
      specialDoorOpened.src =
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/special%20door%20opened-BNy1lg5TGkueAZYyvQ4XzSkTEjkzXr.png"
      console.log("Loading special door opened from:", specialDoorOpened.src)

      specialDoorOpened.onload = () => {
        console.log("Special door opened image loaded successfully")
        // Store in a new ref for the special door
        specialDoorOpenedRef.current = specialDoorOpened
        setSpecialDoorImagesLoaded((prev) => ({ ...prev, opened: true }))
      }

      specialDoorOpened.onerror = (e) => {
        console.error("Failed to load special door opened image:", e)
      }
    }

    tryLoadDoorImages()

    return () => {
      // Safely remove event listeners only if they exist
      if (floorTile) {
        floorTile.onload = null
        floorTile.onerror = null
      }
      if (leverLocked) {
        leverLocked.onload = null
        leverLocked.onerror = null
      }
      if (leverUnlocked) {
        leverUnlocked.onload = null
        leverUnlocked.onerror = null
      }
      if (decoyLever) {
        decoyLever.onload = null
        decoyLever.onerror = null
      }
      if (boxImage) {
        boxImage.onload = null
        boxImage.onerror = null
      }
      // The doorClosed and doorOpened variables are defined inside tryLoadDoorImages
      // and aren't accessible here, so we don't need to clean them up
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

  // Grid size based on dimensions
  const cellWidth = dimensions.width / 16
  const cellHeight = dimensions.height / 9

  // Modify the canMoveToPosition function to include the special door check
  const canMoveToPosition = (x: number, y: number): boolean => {
    // Make sure position is within bounds
    if (x < 0 || x >= 16 || y < 0 || y >= 9) return false

    // Check if the position is the main door and if it's locked
    if (x === 8 && y === 8 && !areAllLeversActivated()) {
      return false // Door is locked and immovable
    }

    // Check if the position is the special door and if it's locked
    if (x === 13 && y === 2 && !levers.leverS) {
      return false // Special door is locked and immovable
    }

    // Check if the position is a path (1) in the maze grid
    // Now y directly corresponds to the row in MAZE_GRID
    return MAZE_GRID[y][x] === 1
  }

  // Modify the getCellType function
  const getCellType = (x: number, y: number): string => {
    if (x < 0 || x >= 16 || y < 0 || y >= 9) return "out of bounds"

    // Check if it's the main door position
    if (x === 8 && y === 8) {
      return areAllLeversActivated() ? "door (unlocked)" : "door (locked)"
    }

    // Check if it's the special door position
    if (x === 13 && y === 2) {
      return levers.leverS ? "special door (unlocked)" : "special door (locked)"
    }

    // Check if it's the box position
    if (x === 14 && y === 0) {
      return "box"
    }

    return MAZE_GRID[y][x] === 1 ? "grill" : "immovable"
  }

  // Replace the existing isAtLever function
  const isAtLever = (x: number, y: number): string | null => {
    if (x === 4 && y === 8) return "lever1"
    if (x === 15 && y === 6) return "lever2"
    if (x === 1 && y === 3) return "lever3"
    if (x === 7 && y === 0) return "lever4" // Changed from (6,0) to (7,0)
    if (x === 12 && y === 8) return "leverS" // Special lever at (12,8)
    return null
  }

  // Add a function to check if player is at the box
  const isAtBox = (x: number, y: number): boolean => {
    return x === 14 && y === 0
  }

  // Add a function to check if player is at the special door
  const isAtSpecialDoor = (x: number, y: number): boolean => {
    return x === 13 && y === 2 // Changed from y === 3 to y === 2
  }

  // Check if player is at the door position
  const isAtDoor = (x: number, y: number): boolean => {
    return x === 8 && y === 8 // Updated door position to (8,8)
  }

  // Add a function to check if all levers are activated
  const areAllLeversActivated = () => {
    // If the decoy lever is activated, the door is locked regardless of other levers
    if (decoyLeverActivated) {
      return false
    }
    // Otherwise, check if levers 1-3 are activated
    return levers.lever1 && levers.lever2 && levers.lever3
  }

  // Function to handle collectible selection
  const handleCollectibleSelection = (itemId: string) => {
    // Find the selected collectible
    const selectedItem = collectibles.find((item) => item.id === itemId)

    if (selectedItem) {
      // Mark the item as collected
      const updatedCollectibles = collectibles.map((item) => (item.id === itemId ? { ...item, collected: true } : item))

      setCollectibles(updatedCollectibles)

      // Close the selector
      setShowCollectibleSelector(false)

      // Show notification
      setShowNotification(`You obtained: ${selectedItem.name}`)

      // Mark the box as opened
      setBoxOpened(true)

      // Hide notification after 3 seconds
      setTimeout(() => {
        setShowNotification(null)
      }, 3000)
    }
  }

  // Modify the activateLever function to include special lever handling
  const activateLever = useCallback(
    (leverName: string) => {
      // Special handling for lever4 (the decoy)
      if (leverName === "lever4") {
        // Toggle the lever state
        setLevers((prev) => ({
          ...prev,
          [leverName]: !prev[leverName],
        }))

        // If we're activating the decoy (turning it on)
        if (!levers[leverName]) {
          setDecoyLeverActivated(true)
          // Show notification that the lever is a decoy
          setShowNotification("ERROR! Security override activated. Door lockdown initiated.")
        } else {
          // If we're deactivating the decoy (turning it off)
          setDecoyLeverActivated(false)
          setShowNotification("Security override deactivated.")
        }

        // Hide notification after 3 seconds
        setTimeout(() => {
          setShowNotification(null)
        }, 3000)
        return
      }

      // In the activateLever function, modify the notification for the special lever
      // Special handling for leverS (the special lever)
      if (leverName === "leverS") {
        // Toggle the lever state
        setLevers((prev) => ({
          ...prev,
          [leverName]: !prev[leverName],
        }))

        // Show notification about the special door without coordinates
        if (!levers[leverName]) {
          setShowNotification("Special door unlocked!")
        } else {
          setShowNotification("Special door locked!")
        }

        // Hide notification after 3 seconds
        setTimeout(() => {
          setShowNotification(null)
        }, 3000)
        return
      }

      // Toggle the lever state for normal levers (1-3)
      setLevers((prev) => ({
        ...prev,
        [leverName]: !prev[leverName],
      }))

      // Count how many levers are activated after this toggle
      const newLeverState = !levers[leverName]
      const activatedCount = Object.values({
        lever1: leverName === "lever1" ? newLeverState : levers.lever1,
        lever2: leverName === "lever2" ? newLeverState : levers.lever2,
        lever3: leverName === "lever3" ? newLeverState : levers.lever3,
      }).filter(Boolean).length

      // Show brief tooltip with lever count
      setShowNotification(`${activatedCount}/3 levers activated`)

      // Hide notification after 1.5 seconds (shorter for the tooltip)
      setTimeout(() => {
        setShowNotification(null)
      }, 1500)
    },
    [levers, setLevers, setDecoyLeverActivated, setShowNotification],
  )

  // Function to interact with the box
  const interactWithBox = () => {
    if (!boxOpened) {
      setShowCollectibleSelector(true)
    } else {
      setShowNotification("You've already opened this box.")

      // Hide notification after 3 seconds
      setTimeout(() => {
        setShowNotification(null)
      }, 3000)
    }
  }

  // Add isTyping check to the advanceDialogue function
  // Around line 410-430

  // Add a function to advance dialogue
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

  // Handle key presses for movement and interaction
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true

      // In the handleKeyDown function, remove or disable the debug toggle
      // Find and remove or comment out this section in the handleKeyDown function:
      // if (e.key.toLowerCase() === "h" && e.ctrlKey) {
      //   setShowDebug((prev) => !prev)
      //   e.preventDefault()
      // }

      // In the handleKeyDown function, remove or comment out the ESC key handling:
      // if (e.key === "Escape" && onExit) {
      //   onExit()
      //   return
      // }

      // Activate lever with 'E' key when at lever position
      if (e.key.toLowerCase() === "e") {
        const leverAtPosition = isAtLever(playerPosition.x, playerPosition.y)
        if (leverAtPosition) {
          activateLever(leverAtPosition)
        }

        // Check if player is at the box
        if (isAtBox(playerPosition.x, playerPosition.y)) {
          interactWithBox()
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [playerPosition, boxOpened, activateLever])

  // Add a key handler for dialogue advancement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showDialogue && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault()
        advanceDialogue()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showDialogue, dialogueData])

  // Update the showLeverPrompt useEffect to show the prompt for all levers, not just unactivated ones
  useEffect(() => {
    const leverAtPosition = isAtLever(playerPosition.x, playerPosition.y)
    if (leverAtPosition) {
      // Show prompt for all levers, regardless of state
      setShowLeverPrompt(true)
      setShowBoxPrompt(false)
    } else if (isAtBox(playerPosition.x, playerPosition.y)) {
      // Show box prompt
      setShowBoxPrompt(true)
      setShowLeverPrompt(false)
    } else {
      setShowLeverPrompt(false)
      setShowBoxPrompt(false)
    }
  }, [playerPosition, levers])

  // Add an effect to report position changes to the parent
  useEffect(() => {
    if (onPositionChange) {
      onPositionChange(playerPosition)
    }
  }, [playerPosition, onPositionChange])

  useEffect(() => {
    if (onLeversChange) {
      onLeversChange(levers)
    }
  }, [levers, onLeversChange])

  useEffect(() => {
    if (onDecoyLeverChange) {
      onDecoyLeverChange(decoyLeverActivated)
    }
  }, [decoyLeverActivated, onDecoyLeverChange])

  useEffect(() => {
    if (onBoxOpenedChange) {
      onBoxOpenedChange(boxOpened)
    }
  }, [boxOpened, onBoxOpenedChange])

  // Modify the movePlayer function to report position changes
  const movePlayer = () => {
    // Skip movement if collectible selector is open
    if (showCollectibleSelector) return

    let newX = playerPosition.x
    let newY = playerPosition.y

    // Check keys from ref
    if (keysRef.current["w"] || keysRef.current["arrowup"]) newY += 1
    if (keysRef.current["s"] || keysRef.current["arrowdown"]) newY -= 1 // Fixed: now decreases Y to move down
    if (keysRef.current["a"] || keysRef.current["arrowleft"]) newX -= 1
    if (keysRef.current["d"] || keysRef.current["arrowright"]) newX += 1

    // Only update position if it's different and valid
    if ((newX !== playerPosition.x || newY !== playerPosition.y) && canMoveToPosition(newX, newY)) {
      setPlayerPosition({ x: newX, y: newY })
    }

    // Check if player has reached the exit door and all levers are activated
    if (isAtDoor(newX, newY) && areAllLeversActivated() && onExit) {
      onExit()
    } else if (isAtDoor(newX, newY) && !areAllLeversActivated()) {
      // Show notification that door is locked
      setShowNotification("The door is locked. Find and activate all levers first.")

      // Hide notification after 3 seconds
      setTimeout(() => {
        setShowNotification(null)
      }, 3000)
    }

    // Check if player has reached the special door and the special lever is activated
    if (isAtSpecialDoor(newX, newY) && levers.leverS) {
      setShowNotification("You found a secret passage!")

      // Hide notification after 3 seconds
      setTimeout(() => {
        setShowNotification(null)
      }, 3000)
    } else if (isAtSpecialDoor(newX, newY) && !levers.leverS) {
      // Show notification that special door is locked
      setShowNotification("This door requires a special lever to unlock.")

      // Hide notification after 3 seconds
      setTimeout(() => {
        setShowNotification(null)
      }, 3000)
    }
  }

  // Handle player movement
  useEffect(() => {
    const interval = setInterval(movePlayer, 150)
    return () => clearInterval(interval)
  }, [playerPosition, levers, onExit, showCollectibleSelector])

  // Draw the maze
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = dimensions.width
    canvas.height = dimensions.height

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height)

    // Draw background (dark color for contrast)
    ctx.fillStyle = "#1a1a1a"
    ctx.fillRect(0, 0, dimensions.width, dimensions.height)

    // Draw grid lines first for better alignment visualization
    if (showDebug) {
      // Debug info is shown but grid lines are removed
    }

    // Change the isWithinVisibleRange function to properly account for cell aspect ratio
    // Change the isWithinVisibleRange function to use a radius of 1.5 for a 3-block diameter
    // Change the calculateVisibility function to properly create a circular vision
    // Change the calculateVisibility function to check multiple points in each cell
    // Change the calculateVisibility function to create a true circular vision with pure black outside
    // In the calculateVisibility function, change the radius check from 1.5 to 1.0
    // In the useEffect that draws the maze, replace the calculateVisibility function with this simpler version:
    // In the calculateVisibility function, increase the radius to 1.75 to ensure all cells in a 3x3 grid are visible
    // This is around line 425 in the file
    function calculateVisibility(x, y, playerX, playerY) {
      // Calculate the center point of the cell
      const cellCenterX = x + 0.5
      const cellCenterY = y + 0.5

      // Calculate the aspect ratio of the cells
      const aspectRatio = cellWidth / cellHeight

      // Calculate distance from player to cell center
      // Normalize x distance by dividing by the aspect ratio to account for rectangular cells
      const dx = (cellCenterX - playerX) / aspectRatio
      const dy = cellCenterY - playerY
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Use a radius of 1.75 to ensure all cells in a 3x3 grid are visible
      // This accounts for the diagonal distance to corner cells (sqrt(2) ≈ 1.414)
      // and adds a larger buffer to ensure full visibility of the top row
      return distance <= 1.75 ? 1.0 : 0.0 // Either fully visible or not visible at all
    }

    // Update the drawing code to use the new coordinate system
    // Draw maze - walls and floor tiles
    for (let y = 0; y < 9; y++) {
      for (let x = 0; x < 16; x++) {
        // Check if this cell is within visible range
        const visibilityFactor = calculateVisibility(x, y, playerPosition.x, playerPosition.y)

        // Skip rendering cells that are not visible at all (except in debug mode)
        // Replace this line:
        // if (visibilityFactor <= 0 && !showDebug) continue

        // With this:
        if (visibilityFactor <= 0 && !showDebug) {
          // If we're not in debug mode and the cell is not visible,
          // still draw it as pure black to ensure a clean circle edge
          ctx.fillStyle = "#000000" // Pure black
          const cellX = x * cellWidth
          const cellY = (8 - y) * cellHeight // Invert Y for drawing from bottom to top
          ctx.fillRect(cellX, cellY, cellWidth, cellHeight)
          continue
        }

        // Skip the door position - we'll draw it separately
        if (x === 8 && y === 8) continue
        // Skip the box position - we'll draw it separately
        if (x === 14 && y === 0) continue

        const cellValue = MAZE_GRID[y][x]
        const cellX = x * cellWidth
        const cellY = (8 - y) * cellHeight // Invert Y for drawing from bottom to top

        // Apply fog of war effect for cells that are not fully visible
        const fogOpacity = showDebug ? 1.0 : visibilityFactor
        ctx.globalAlpha = fogOpacity

        // Update the drawing code to ensure pure black outside the vision radius
        // In the maze drawing loop, modify the code that draws walls:
        if (cellValue === 0) {
          // Draw wall (obstacle) as pure black with no texture or borders
          ctx.fillStyle = "#000000" // Pure black
          ctx.fillRect(cellX, cellY, cellWidth, cellHeight)

          // Add debug text only if debug mode is on
          if (showDebug) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
            ctx.font = `${Math.max(8, Math.min(10, cellWidth / 8))}px Arial`
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillText("immovable", cellX + cellWidth / 2, cellY + cellHeight / 2)

            // Add coordinates if debug mode is on
            ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
            ctx.font = "8px Arial"
            ctx.fillText(`(${x},${y})`, cellX + cellWidth / 2, cellY + cellHeight - 5)
          }
        } else {
          // Draw floor tile (path) - use the image if loaded, otherwise fallback
          if (floorTileLoaded && floorTileRef.current) {
            // Draw the vent floor tile image
            ctx.drawImage(floorTileRef.current, cellX, cellY, cellWidth, cellHeight)
          } else {
            // Fallback if image not loaded - simplified with no grid lines
            ctx.fillStyle = "#333333"
            ctx.fillRect(cellX, cellY, cellWidth, cellHeight)
          }

          // Add debug text only if debug mode is on
          if (showDebug) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
            ctx.font = `${Math.max(8, Math.min(10, cellWidth / 8))}px Arial`
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillText("grill", cellX + cellWidth / 2, cellY + cellHeight / 2)

            // Add coordinates if debug mode is on
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
            ctx.font = "8px Arial"
            ctx.fillText(`(${x},${y})`, cellX + cellWidth / 2, cellY + cellHeight - 5)
          }
        }
      }
    }

    // Reset opacity for other elements
    ctx.globalAlpha = 1.0

    // Modify the drawLever function to use the decoy lever image for lever4 and remove numbers
    const drawLever = (x: number, y: number, leverName: string) => {
      // Skip drawing if not visible and not in debug mode
      const visibilityFactor = calculateVisibility(x, y, playerPosition.x, playerPosition.y)
      if (visibilityFactor <= 0 && !showDebug) return

      const leverX = x * cellWidth
      const leverY = (8 - y) * cellHeight // Invert Y for drawing
      const isActivated = levers[leverName]
      const isDecoy = leverName === "lever4"
      const isSpecial = leverName === "leverS"

      // Apply fog of war effect
      const fogOpacity = visibilityFactor
      ctx.globalAlpha = fogOpacity

      // Size for the lever image - make it fit nicely in the cell
      const leverSize = Math.min(cellWidth, cellHeight) * 0.8
      const offsetX = (cellWidth - leverSize) / 2
      const offsetY = (cellHeight - leverSize) / 2

      // Draw lever using the appropriate image
      if (isSpecial) {
        // Draw special lever with the new images
        if (isActivated && specialLeverImagesLoaded.open && leverSpecialOpenRef.current) {
          // Draw the open special lever image
          ctx.drawImage(leverSpecialOpenRef.current, leverX + offsetX, leverY + offsetY, leverSize, leverSize)
        } else if (!isActivated && specialLeverImagesLoaded.closed && leverSpecialClosedRef.current) {
          // Draw the closed special lever image
          ctx.drawImage(leverSpecialClosedRef.current, leverX + offsetX, leverY + offsetY, leverSize, leverSize)
        } else {
          // Fallback if images not loaded
          ctx.fillStyle = "#555555"
          ctx.fillRect(leverX + cellWidth * 0.3, leverY + cellHeight * 0.7, cellWidth * 0.4, cellHeight * 0.2)

          if (isActivated) {
            // Activated position (right)
            ctx.fillStyle = "#FFD700" // Gold for special lever
            ctx.beginPath()
            ctx.moveTo(leverX + cellWidth * 0.5, leverY + cellHeight * 0.7)
            ctx.lineTo(leverX + cellWidth * 0.8, leverY + cellHeight * 0.4)
            ctx.lineTo(leverX + cellWidth * 0.7, leverY + cellHeight * 0.4)
            ctx.lineTo(leverX + cellWidth * 0.5, leverY + cellHeight * 0.6)
            ctx.fill()
          } else {
            // Deactivated position (left)
            ctx.fillStyle = "#FFD700" // Gold for special lever
            ctx.beginPath()
            ctx.moveTo(leverX + cellWidth * 0.5, leverY + cellHeight * 0.7)
            ctx.lineTo(leverX + cellWidth * 0.2, leverY + cellHeight * 0.4)
            ctx.lineTo(leverX + cellWidth * 0.3, leverY + cellHeight * 0.4)
            ctx.lineTo(leverX + cellWidth * 0.5, leverY + cellHeight * 0.6)
            ctx.fill()
          }
        }
      } else if (isDecoy) {
        // Draw decoy lever
        if (leverImagesLoaded.decoy && decoyLeverRef.current) {
          ctx.drawImage(decoyLeverRef.current, leverX + offsetX, leverY + offsetY, leverSize, leverSize)
        } else {
          // Fallback for decoy lever
          ctx.fillStyle = "#555555"
          ctx.fillRect(leverX + cellWidth * 0.3, leverY + cellHeight * 0.7, cellWidth * 0.4, cellHeight * 0.2)

          // Purple handle for decoy
          ctx.fillStyle = "#9932CC" // Purple
          ctx.beginPath()
          ctx.moveTo(leverX + cellWidth * 0.5, leverY + cellHeight * 0.7)
          ctx.lineTo(leverX + cellWidth * 0.2, leverY + cellHeight * 0.4)
          ctx.lineTo(leverX + cellWidth * 0.3, leverY + cellHeight * 0.4)
          ctx.lineTo(leverX + cellWidth * 0.5, leverY + cellHeight * 0.6)
          ctx.fill()
        }
      } else if (isActivated && leverImagesLoaded.unlocked && leverUnlockedRef.current) {
        // Draw the unlocked lever image
        ctx.drawImage(leverUnlockedRef.current, leverX + offsetX, leverY + offsetY, leverSize, leverSize)
      } else if (!isActivated && leverImagesLoaded.locked && leverLockedRef.current) {
        // Draw the locked lever image
        ctx.drawImage(leverLockedRef.current, leverX + offsetX, leverY + offsetY, leverSize, leverSize)
      } else {
        // Fallback if images not loaded
        ctx.fillStyle = "#555555"
        ctx.fillRect(leverX + cellWidth * 0.3, leverY + cellHeight * 0.7, cellWidth * 0.4, cellHeight * 0.2)

        if (isActivated) {
          // Activated position (right)
          ctx.fillStyle = "#00FF00" // Green for activated
          ctx.beginPath()
          ctx.moveTo(leverX + cellWidth * 0.5, leverY + cellHeight * 0.7)
          ctx.lineTo(leverX + cellWidth * 0.8, leverY + cellHeight * 0.4)
          ctx.lineTo(leverX + cellWidth * 0.7, leverY + cellHeight * 0.4)
          ctx.lineTo(leverX + cellWidth * 0.5, leverY + cellHeight * 0.6)
          ctx.fill()
        } else {
          // Deactivated position (left)
          ctx.fillStyle = isDecoy ? "#9932CC" : "#FF0000" // Purple for decoy, Red for normal
          ctx.beginPath()
          ctx.moveTo(leverX + cellWidth * 0.5, leverY + cellHeight * 0.7)
          ctx.lineTo(leverX + cellWidth * 0.2, leverY + cellHeight * 0.4)
          ctx.lineTo(leverX + cellWidth * 0.3, leverY + cellHeight * 0.4)
          ctx.lineTo(leverX + cellWidth * 0.5, leverY + cellHeight * 0.6)
          ctx.fill()
        }
      }
    }

    // Reset opacity after drawing levers
    ctx.globalAlpha = 1.0

    // Draw all levers
    drawLever(4, 8, "lever1")
    drawLever(15, 6, "lever2")
    drawLever(1, 3, "lever3")
    drawLever(7, 0, "lever4") // Changed from (6,0) to (7,0)
    // Draw the special lever at (12,8)
    drawLever(12, 8, "leverS")

    // For the box at (14,0)
    const visibilityFactorBox = calculateVisibility(14, 0, playerPosition.x, playerPosition.y)
    if (visibilityFactorBox > 0 || showDebug) {
      const boxX = 14 * cellWidth
      const boxY = (8 - 0) * cellHeight // Invert Y for drawing

      // Apply fog of war effect
      const fogOpacity = visibilityFactorBox
      ctx.globalAlpha = fogOpacity

      // Draw the box at position (14,0)
      // Draw the box with the provided image
      if (boxImageLoaded && boxImageRef.current) {
        // Draw the box image
        ctx.drawImage(boxImageRef.current, boxX, boxY, cellWidth, cellHeight)
      } else {
        // Fallback if image not loaded
        ctx.fillStyle = "#8B4513" // Brown
        ctx.fillRect(boxX, boxY, cellWidth, cellHeight)

        // Add some details to make it look like a box
        ctx.strokeStyle = "#5D4037" // Darker brown
        ctx.lineWidth = 2
        ctx.strokeRect(boxX + 2, boxY + 2, cellWidth - 4, cellHeight - 4)

        // Add cross lines on top
        ctx.beginPath()
        ctx.moveTo(boxX + 2, boxY + 2)
        ctx.lineTo(boxX + cellWidth - 2, boxY + cellHeight - 2)
        ctx.moveTo(boxX + cellWidth - 2, boxY + 2)
        ctx.lineTo(boxX + 2, boxY + cellHeight - 2)
        ctx.stroke()
      }

      // Find and remove the code that draws the yellow glow effect around the box
      // This is in the useEffect that draws the maze, around line 700-720
    }

    // For the door at (8,8)
    const visibilityFactorDoor = calculateVisibility(8, 8, playerPosition.x, playerPosition.y)
    if (visibilityFactorDoor > 0 || showDebug) {
      const doorX = 8 * cellWidth
      const doorY = (8 - 8) * cellHeight // Invert Y for drawing (at the top row)
      const isDoorUnlocked = areAllLeversActivated()

      // Apply fog of war effect
      const fogOpacity = visibilityFactorDoor
      ctx.globalAlpha = fogOpacity

      // Draw the door at position (8,8) with the new door images

      // Add debug info about door image loading
      if (showDebug) {
        console.log("Door images loaded state:", doorImagesLoaded)
        console.log("Door refs exist:", !!doorClosedRef.current, !!doorOpenedRef.current)
      }

      // Draw the door with improved fallback graphics
      if (isDoorUnlocked && doorImagesLoaded.opened && doorOpenedRef.current) {
        // Draw the opened door image
        try {
          ctx.drawImage(doorOpenedRef.current, doorX, doorY, cellWidth, cellHeight)
          if (showDebug) console.log("Successfully drew opened door image")
        } catch (error) {
          console.error("Error drawing opened door image:", error)
          drawFallbackDoor(ctx, doorX, doorY, cellWidth, cellHeight, true)
        }
      } else if (!isDoorUnlocked && doorImagesLoaded.closed && doorClosedRef.current) {
        // Draw the closed door image
        try {
          ctx.drawImage(doorClosedRef.current, doorX, doorY, cellWidth, cellHeight)
          if (showDebug) console.log("Successfully drew closed door image")
        } catch (error) {
          console.error("Error drawing closed door image:", error)
          drawFallbackDoor(ctx, doorX, doorY, cellWidth, cellHeight, false)
        }
      } else {
        // Fallback if images not loaded
        if (showDebug) {
          console.warn("Using fallback door graphics. Images loaded:", doorImagesLoaded)
        }
        drawFallbackDoor(ctx, doorX, doorY, cellWidth, cellHeight, isDoorUnlocked)
      }

      // Add debug label for door if debug is on
      if (showDebug) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
        ctx.font = `${Math.max(8, Math.min(10, cellWidth / 8))}px Arial`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(
          isDoorUnlocked ? "door (unlocked)" : "door (locked)",
          doorX + cellWidth / 2,
          doorY + cellHeight / 2,
        )

        // Add coordinates
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
        ctx.font = "8px Arial"
        ctx.fillText("(8,8)", doorX + cellWidth / 2, doorY + cellHeight - 5)
      }
    }

    // For the special door at (13,2)
    const visibilityFactorSpecialDoor = calculateVisibility(13, 2, playerPosition.x, playerPosition.y)
    if (visibilityFactorSpecialDoor > 0 || showDebug) {
      const specialDoorX = 13 * cellWidth
      const specialDoorY = (8 - 2) * cellHeight // Invert Y for drawing
      const isSpecialDoorUnlocked = levers.leverS

      // Apply fog of war effect
      const fogOpacity = visibilityFactorSpecialDoor
      ctx.globalAlpha = fogOpacity

      // Draw the special door at position (13,2)

      // Draw the special door with the special opened image when unlocked
      if (isSpecialDoorUnlocked && specialDoorImagesLoaded.opened && specialDoorOpenedRef.current) {
        // Draw the special opened door image
        try {
          ctx.drawImage(specialDoorOpenedRef.current, specialDoorX, specialDoorY, cellWidth, cellHeight)
        } catch (error) {
          console.error("Error drawing opened special door image:", error)
          drawFallbackDoor(ctx, specialDoorX, specialDoorY, cellWidth, cellHeight, true)
        }
      } else if (!isSpecialDoorUnlocked && doorImagesLoaded.closed && doorClosedRef.current) {
        // Draw the closed door image (using the regular closed door for now)
        try {
          ctx.drawImage(doorClosedRef.current, specialDoorX, specialDoorY, cellWidth, cellHeight)
        } catch (error) {
          console.error("Error drawing closed special door image:", error)
          drawFallbackDoor(ctx, specialDoorX, specialDoorY, cellWidth, cellHeight, false)
        }
      } else {
        // Fallback if images not loaded
        drawFallbackDoor(ctx, specialDoorX, specialDoorY, cellWidth, cellHeight, isSpecialDoorUnlocked)
      }

      // Add debug label for special door if debug is on
      if (showDebug) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
        ctx.font = `${Math.max(8, Math.min(10, cellWidth / 8))}px Arial`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(
          isSpecialDoorUnlocked ? "special door (unlocked)" : "special door (locked)",
          specialDoorX + cellWidth / 2,
          specialDoorY + cellHeight / 2,
        )

        // Add coordinates
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
        ctx.font = "8px Arial"
        ctx.fillText("(13,2)", specialDoorX + cellWidth / 2, specialDoorY + cellHeight - 5)
      }
    }

    // Reset opacity for player
    ctx.globalAlpha = 1.0

    // Update the player drawing code
    // Draw player (Latte)
    const playerX = playerPosition.x * cellWidth
    const playerY = (8 - playerPosition.y) * cellHeight // Invert Y for drawing

    // Draw player using the bear image
    const playerImage = new Image()
    playerImage.src = "/images/latte_down_standing.png"
    playerImage.crossOrigin = "anonymous"

    if (playerImage.complete) {
      ctx.drawImage(playerImage, playerX, playerY, cellWidth, cellHeight)
    } else {
      playerImage.onload = () => {
        ctx.drawImage(playerImage, playerX, playerY, cellWidth, cellHeight)
      }

      // Fallback if image not loaded immediately
      ctx.fillStyle = "#FFA500" // Orange
      ctx.beginPath()
      ctx.arc(playerX + cellWidth / 2, playerY + cellHeight / 2, cellWidth / 3, 0, Math.PI * 2)
      ctx.fill()
    }

    // Add this code after the maze drawing loop to create a circular mask
    // This will ensure a perfect circle and pure black outside the vision radius
    // Also update the circular mask radius in the code after the maze drawing loop
    // Change visionRadius from 1.5 to 1.0
    ctx.globalCompositeOperation = "destination-in"
    ctx.fillStyle = "#ffffff"
    ctx.beginPath()
    const playerScreenX = playerPosition.x * cellWidth + cellWidth / 2
    const playerScreenY = (8 - playerPosition.y) * cellHeight + cellHeight / 2
    // Finally, update the circular mask radius to match our visibility calculation:
    // Replace this line:
    // const visionRadius = 1.42 * Math.min(cellWidth, cellHeight) * (cellWidth / cellHeight)

    // With this:
    // Also update the circular mask radius to match our new visibility calculation
    // This is around line 770 in the file
    const visionRadius = 1.75 * Math.min(cellWidth, cellHeight) * (cellWidth / cellHeight)
    ctx.arc(playerScreenX, playerScreenY, visionRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = "source-over"

    // Now draw a black background for everything outside the vision
    ctx.globalCompositeOperation = "destination-over"
    ctx.fillStyle = "#000000" // Pure black
    ctx.fillRect(0, 0, dimensions.width, dimensions.height)
    ctx.globalCompositeOperation = "source-over"
  }, [
    dimensions,
    cellWidth,
    cellHeight,
    playerPosition,
    floorTileLoaded,
    showDebug,
    levers,
    leverImagesLoaded,
    decoyLeverActivated,
    doorImagesLoaded,
    specialLeverImagesLoaded,
    boxImageLoaded,
    boxOpened,
    activateLever,
  ])

  // Add this function right before the return statement
  function drawFallbackDoor(ctx, x, y, width, height, isUnlocked) {
    // Draw a more detailed fallback door

    // Door background
    ctx.fillStyle = isUnlocked ? "#00AA00" : "#AA0000" // Green or Red
    ctx.fillRect(x, y, width, height)

    // Door frame
    ctx.strokeStyle = "#888888"
    ctx.lineWidth = 3
    ctx.strokeRect(x + 2, y + 2, width - 4, height - 4)

    // Door inner panel
    ctx.fillStyle = isUnlocked ? "#00CC00" : "#CC0000" // Lighter Green or Red
    ctx.fillRect(x + width * 0.2, y + height * 0.2, width * 0.6, height * 0.6)

    // Door handle
    ctx.fillStyle = "#FFFF00" // Yellow
    ctx.beginPath()
    ctx.arc(x + width * 0.7, y + height * 0.5, width * 0.08, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = "#888888"
    ctx.lineWidth = 1
    ctx.stroke()

    // Add text to indicate door state
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "bold 10px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(isUnlocked ? "OPEN" : "LOCKED", x + width * 0.5, y + height * 0.5)
  }

  // Update the CollectibleSelector component to use the new images
  const CollectibleSelector = () => {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50">
        <div className="bg-[#f8f0dd]/95 backdrop-blur-sm border-4 border-[#8b5a2b] p-6 rounded-sm text-[#5c4033] max-w-2xl w-full relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/aged-parchment.png')] opacity-10 pointer-events-none"></div>
          <h2 className="text-xl font-mono uppercase tracking-wide mb-4 text-center border-b-2 border-[#8b5a2b] pb-2">
            Select a Physical Wealth Item
          </h2>
          <p className="mb-6 text-center text-sm font-mono">Choose one item to add to your inventory.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {collectibles.map((item) => (
              <button
                key={item.id}
                className="bg-[#e6d2b3] hover:bg-[#d9c4a3] border-2 border-[#8b5a2b] p-4 rounded-sm transition-colors transform hover:scale-105"
                onClick={() => handleCollectibleSelection(item.id)}
              >
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 flex items-center justify-center mb-2">
                    <img
                      src={getItemImageUrl(item.name) || "/placeholder.svg"}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <span className="text-sm font-mono uppercase tracking-wide text-center">{item.name}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="bg-[#f8f0dd] border-2 border-[#8b5a2b] p-4 rounded-sm mb-4 min-h-[80px] relative">
            <div className="absolute inset-0 bg-[url('/aged-parchment.png')] opacity-5 pointer-events-none"></div>
            <p className="text-sm text-center italic font-mono">Select an item to see its description</p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => setShowCollectibleSelector(false)}
              className="bg-[#e6d2b3] hover:bg-[#d9c4a3] px-4 py-2 rounded-sm border-2 border-[#8b5a2b] font-mono uppercase tracking-wide"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Add a helper function to get the image URL for each item
  function getItemImageUrl(name: string): string {
    switch (name) {
      case "Golden Running Shoes":
        return "/images/collectibles/golden_running_shoes.png"
      case "Sunset Yoga Mat":
        return "/images/collectibles/yoga_mat.png"
      case "Heart Rate Monitor Watch":
        return "/images/collectibles/heart_rate_monitor.png"
      case "Sunshine Orb":
        return "/images/collectibles/sunlight_orb.png"
      case "Resistance Band Set":
        return "/images/collectibles/resistance_bands.png"
      default:
        return "/placeholder.svg"
    }
  }

  // Replace the return JSX to remove the room info overlay and update the notification style
  return (
    <div className="relative w-full h-screen">
      <canvas ref={canvasRef} className="w-full h-full" />
      {/* Debug info overlay */}
      {showDebug && (
        <div className="absolute bottom-4 right-4 bg-[#222222] border-2 border-[#444444] p-3 rounded-md text-white max-w-xs">
          <h3 className="font-bold text-sm mb-1">Debug Info</h3>
          <p className="text-xs">
            Player Position: ({playerPosition.x}, {playerPosition.y})
          </p>
          <p className="text-xs">Cell Type: {getCellType(playerPosition.x, playerPosition.y)}</p>
          <p className="text-xs">
            Levers Activated:{" "}
            {
              Object.values({
                lever1: levers.lever1,
                lever2: levers.lever2,
                lever3: levers.lever3,
              }).filter(Boolean).length
            }
            /3
          </p>
          <p className="text-xs">Lever 1: {levers.lever1 ? "Activated" : "Deactivated"}</p>
          <p className="text-xs">Lever 2: {levers.lever2 ? "Activated" : "Deactivated"}</p>
          <p className="text-xs">Lever 3: {levers.lever3 ? "Activated" : "Deactivated"}</p>
          <p className="text-xs">Lever 4: {levers.lever4 ? "Activated" : "Deactivated"}</p>
          <p className="text-xs">Lever S: {levers.leverS ? "Activated" : "Deactivated"}</p>
          <p className="text-xs">Decoy Activated: {decoyLeverActivated ? "Yes" : "No"}</p>
          <p className="text-xs">Door Unlocked: {areAllLeversActivated() ? "Yes" : "No"}</p>
          <p className="text-xs">Special Door: {levers.leverS ? "Unlocked" : "Locked"}</p>
          <p className="text-xs">Box Opened: {boxOpened ? "Yes" : "No"}</p>
          <p className="text-xs mt-2 text-gray-400">Press Ctrl+H to toggle debug view</p>
        </div>
      )}
      {/* Lever toggle prompt */}
      {showLeverPrompt && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#f8f0dd]/95 backdrop-blur-sm border-2 border-[#8b5a2b] p-3 rounded-sm text-[#5c4033] text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/aged-parchment.png')] opacity-10 pointer-events-none"></div>
          <p className="font-mono uppercase tracking-wide">Press E to toggle the lever</p>
        </div>
      )}
      {/* Box interaction prompt */}
      {showBoxPrompt && !boxOpened && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#f8f0dd]/95 backdrop-blur-sm border-2 border-[#8b5a2b] p-3 rounded-sm text-[#5c4033] text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/aged-parchment.png')] opacity-10 pointer-events-none"></div>
          <p className="font-mono uppercase tracking-wide">Press E to open the box</p>
        </div>
      )}
      {/* Tooltip notification - smaller and more concise */}
      {showNotification && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-[#f8f0dd]/95 backdrop-blur-sm border-2 border-[#8b5a2b] px-4 py-2 rounded-sm text-[#5c4033] text-center animate-fade-in-out relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/aged-parchment.png')] opacity-10 pointer-events-none"></div>
          <p className="text-sm font-mono uppercase tracking-wide">{showNotification}</p>
        </div>
      )}
      {/* Collectible selector */}
      {showCollectibleSelector && <CollectibleSelector />}
      {/* Global UI Controls */}
      <div className="absolute top-4 right-4 flex gap-2">
        <KeyIndicator keyLabel="E" text="Interact" />
        <KeyIndicator keyLabel="I" text="Inventory" />
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
    </div>
  )
}
