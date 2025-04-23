"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import KeyIndicator from "../key-indicator"
import ComputerScreenView from "../computer-screen-view"
import MessageBoardView from "../message-board-view"
import Image from "next/image"
// Add import for BlinkingArrow at the top of the file
import BlinkingArrow from "../blinking-arrow"
// Add DialogueBox import at the top with the other imports
import DialogueBox from "../dialogue-box"

// Update the Room3Props interface to include the new props
interface Room3Props {
  onExit?: () => void
  onUnlockVault?: () => void
  savedPosition?: { x: number; y: number }
  onPositionChange?: (position: { x: number; y: number }) => void
  specialBlocksDeactivated?: boolean
  vaultOpen?: boolean
}

// Helper function to get the correct matchbox image path
const getMatchboxImagePath = (itemName: string): string => {
  switch (itemName) {
    case "Gratitude Rock":
      return "/images/matchboxes/gratitude_matchbox.png"
    case "Attention Management":
      return "/images/matchboxes/attention_management_matchbox.png"
    case "Check In With Yourself":
      return "/images/matchboxes/check_in_with_yourself_matchbox.png"
    case "Sit With Your Feelings":
      return "/images/matchboxes/sit_with_your_feelings_matchbox.png"
    case "Let Your Mind Wander":
      return "/images/matchboxes/let_your_mind_wander_matchbox.png"
    default:
      // Fallback to the old pattern if we don't have a specific mapping
      return `/images/matchboxes/${itemName.toLowerCase().replace(/ /g, "_")}_matchbox.png`
  }
}

interface CollectibleItem {
  id: string
  name: string
  description: string
  collected: boolean
}

interface InventoryItem {
  type: string
  position: { x: number; y: number }
  collected: boolean
  name: string
  description: string
}

// Update the Room3 component to use the props for initial state
export default function Room3({
  onExit,
  onUnlockVault,
  savedPosition,
  onPositionChange,
  specialBlocksDeactivated: initialSpecialBlocksDeactivated = false,
  vaultOpen: initialVaultOpen = false,
}: Room3Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  // Use savedPosition if provided, otherwise use the default starting position
  const [playerPosition, setPlayerPosition] = useState(savedPosition || { x: 1, y: 2 })

  // Use the props for initial state if provided
  const [specialBlocksDeactivated, setSpecialBlocksDeactivated] = useState(initialSpecialBlocksDeactivated)
  const [vaultOpen, setVaultOpen] = useState(initialVaultOpen)

  // Add an effect to report position changes to the parent
  useEffect(() => {
    if (onPositionChange) {
      onPositionChange(playerPosition)
    }
  }, [playerPosition, onPositionChange])

  const [showDebug, setShowDebug] = useState(false)
  const keysRef = useRef<Record<string, boolean>>({})
  const [backgroundLoaded, setBackgroundLoaded] = useState(false)
  const [playerDirection, setPlayerDirection] = useState<"up" | "down" | "left" | "right">("down")

  // Add state for computer interaction
  const [nearComputer, setNearComputer] = useState(false)
  const [showComputerScreen, setShowComputerScreen] = useState(false)
  // Add a new state to track render count for performance monitoring
  const [renderCount, setRenderCount] = useState(0)
  // Add a state to track the last key pressed
  const [lastKeyPressed, setLastKeyPressed] = useState<string | null>(null)
  // Add a state to track movement attempts
  const [movementAttempts, setMovementAttempts] = useState({
    total: 0,
    successful: 0,
    blocked: 0,
  })

  // Update the collectibles state variable at the beginning of the component (around line 50-70)
  // to match the new mental wealth-themed items:

  const [collectibles, setCollectibles] = useState<CollectibleItem[]>([
    {
      id: "item1",
      name: "Gratitude Rock",
      description: "A tiny rock that keeps you grounded.",
      collected: false,
    },
    {
      id: "item2",
      name: "Attention Management",
      description: "They don't want your time, they want your attention. Guard it like gold.",
      collected: false,
    },
    {
      id: "item3",
      name: "Check In With Yourself",
      description: "You check your phone a hundred times a day. How often do you check in with you?",
      collected: false,
    },
    {
      id: "item4",
      name: "Sit With Your Feelings",
      description: "Sometimes to get through the noise, you need to sit with your feelings.",
      collected: false,
    },
    {
      id: "item5",
      name: "Let Your Mind Wander",
      description: "Let go of the grind for a sec. Some of your best ideas are hiding when you sit in silence.",
      collected: false,
    },
  ])

  // Computer position
  const COMPUTER_POSITION = { x: 3, y: 5 }

  // Add a new constant for the message board position
  const MESSAGE_BOARD_POSITION = { x: 6, y: 6 }

  // Add a state for message board interaction
  const [nearMessageBoard, setNearMessageBoard] = useState(false)
  const [showMessageBoard, setShowMessageBoard] = useState(false)

  // Add a new constant for the safety box position
  const SAFETY_BOX_POSITION = { x: 16, y: 2 }

  // Add a state for safety box interaction
  const [nearSafetyBox, setNearSafetyBox] = useState(false)
  const [safetyBoxOpened, setSafetyBoxOpened] = useState(false)
  const [showCollectibleSelector, setShowCollectibleSelector] = useState(false)

  // Add a new constant for the vault controls position after the MESSAGE_BOARD_POSITION
  const VAULT_CONTROLS_POSITION = { x: 12, y: 5 }

  // Add state for vault controls interaction after the message board state
  const [nearVaultControls, setNearVaultControls] = useState(false)
  const [showVaultControls, setShowVaultControls] = useState(false)

  // Add these state variables after the showVaultControls state
  const [buttonSequence, setButtonSequence] = useState<string[]>([])
  const [sequenceCorrect, setSequenceCorrect] = useState<boolean | null>(null)
  const correctSequence = ["red", "green", "yellow", "blue"]

  // Add a new state variable to track whether to show the arrow
  const [showArrow, setShowArrow] = useState(false)

  // Add these new state variables after the showArrow state
  const [showIntroDialogue, setShowIntroDialogue] = useState(true)
  const [isTyping, setIsTyping] = useState(true)
  const [dialogueData, setDialogueData] = useState({
    character: "HAMSTER" as "BEAR" | "HAMSTER" | "BULL_GUARD",
    text: [
      "Right, we're in the vault room. See that wall? That's all that stands between us and what we're looking for.",
      "But how do we get through?",
      "The vault manager's computer - over there. We need his 6-digit passcode to open the vault controls. Here's the tricky bit: there's a danger code. Type that by mistake, and the bulls will be on us faster than you can say \"hands up.\"",
      "What's the danger code?",
      "Don't know. But it's 6 digits, just like the real password. We can try as many times as we need, but one wrong move...",
      "So we need to find clues for the real password AND avoid the danger code?",
      "Exactly. Remember when we were planning - this was the one missing piece. Now that we're here, the code could be anywhere. Check scraps of paper, look for patterns in the floor tiles, examine the noticeboard - anything out of place. Even the computer wallpaper might have clues.",
      "That's a lot of places to search.",
      "The manager's clever, but not clever enough. Just remember - if you see anything that feels like a warning, that might be the danger code. Stay sharp.",
      "Got it. Let's search.",
      "Clock's ticking. Find that password, unlock the controls, and we're home free. But enter that danger code... and we're done for.",
    ],
    currentLine: 0,
    speakerName: "Mocha",
    speakerNames: ["Mocha", "Latte", "Mocha", "Latte", "Mocha", "Latte", "Mocha", "Latte", "Mocha", "Latte", "Mocha"],
  })

  // Add these new state variables after the dialogueData state
  const [showSuccessDialogue, setShowSuccessDialogue] = useState(false)
  const [successDialogueData, setSuccessDialogueData] = useState({
    character: "HAMSTER" as "BEAR" | "HAMSTER" | "BULL_GUARD",
    text: [
      "Nice, we got it! And we didn't trigger the alarms. Now we just need to open the vault mechanism.",
      "Great, what's the combination?",
      "That's the thing - I would help, but I think they just got a new one installed. I'm sure the combination's somewhere in this room.",
      "More searching then?",
      "Afraid so. Look for anything that might be a vault combination - numbers, symbols, anything unusual.",
    ],
    currentLine: 0,
    speakerName: "Mocha",
    speakerNames: ["Mocha", "Latte", "Mocha", "Latte", "Mocha"],
  })
  const [isSuccessTyping, setIsSuccessTyping] = useState(true)

  // Add these new state variables after the successDialogueData state
  const [showVaultSuccessDialogue, setShowVaultSuccessDialogue] = useState(false)
  const [vaultSuccessDialogueData, setVaultSuccessDialogueData] = useState({
    character: "HAMSTER" as "BEAR" | "HAMSTER" | "BULL_GUARD",
    text: [
      "You got the sequence! Let's get in there, grab the stuff and get out.",
      "(sounds of vault opening) We're in!",
      "Quick now, time's running out.",
    ],
    currentLine: 0,
    speakerName: "Mocha",
    speakerNames: ["Mocha", "Latte", "Mocha"],
  })
  const [isVaultSuccessTyping, setIsVaultSuccessTyping] = useState(true)

  // Collision grid where:
  // 0 = walkable
  // 1 = wall/collision
  // 2 = special area (like water or a bridge)
  const ROOM_GRID = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 9 (top row)
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 8
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 7
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 6
    [0, 1, 1, 1, 0, 0, 0, 2, 2, 2, 0, 1, 0, 0, 0, 0], // Row 5
    [0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0], // Row 4
    [0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0], // Row 3
    [0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 1], // Row 2
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 1 (bottom row)
  ]

  // Reset key state function
  const resetKeyState = () => {
    Object.keys(keysRef.current).forEach((key) => {
      keysRef.current[key] = false
    })
  }

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

  // Grid size based on dimensions
  const cellWidth = dimensions.width / 16
  const cellHeight = dimensions.height / 9

  // Add this to draw the safety box on the canvas
  // Draw the safety box at position (16,2)
  const safetyBoxX = (SAFETY_BOX_POSITION.x - 1) * cellWidth
  const safetyBoxY = (9 - SAFETY_BOX_POSITION.y) * cellHeight

  // Update the canMoveToPosition function to treat type '2' as impassable by default
  // unless they've been deactivated
  const canMoveToPosition = useCallback(
    (x: number, y: number): boolean => {
      // Make sure position is within bounds (adjusting for 1-based indexing)
      if (x < 1 || x > 16 || y < 1 || y > 9) return false

      // Get the grid cell type
      // The y-coordinate needs to be mapped correctly: y=1 corresponds to index 8, y=9 to index 0
      const gridY = 9 - y // This maps y=1 to index 8, y=9 to index 0
      const gridX = x - 1 // x is 1-based, array is 0-based

      // Ensure we're not accessing outside the array bounds
      if (gridY < 0 || gridY >= ROOM_GRID.length || gridX < 0 || gridX >= ROOM_GRID[0].length) {
        return false
      }

      const cellType = ROOM_GRID[gridY][gridX]

      // Check if the cell is walkable:
      // - Type 0 is always walkable
      // - Type 2 is only walkable if special blocks are deactivated
      return cellType === 0 || (cellType === 2 && specialBlocksDeactivated)
    },
    [specialBlocksDeactivated],
  )

  // Update the useEffect that checks for nearby interactive elements to include the vault controls
  // Modify the existing useEffect that checks for nearby elements
  useEffect(() => {
    // Calculate distance to computer
    const distanceToComputer = Math.sqrt(
      Math.pow(playerPosition.x - COMPUTER_POSITION.x, 2) + Math.pow(playerPosition.y - COMPUTER_POSITION.y, 2),
    )

    // Calculate distance to message board
    const distanceToMessageBoard = Math.sqrt(
      Math.pow(playerPosition.x - MESSAGE_BOARD_POSITION.x, 2) +
        Math.pow(playerPosition.y - MESSAGE_BOARD_POSITION.y, 2),
    )

    // Calculate distance to safety box
    const distanceToSafetyBox = Math.sqrt(
      Math.pow(playerPosition.x - SAFETY_BOX_POSITION.x, 2) + Math.pow(playerPosition.y - SAFETY_BOX_POSITION.y, 2),
    )

    // Calculate distance to vault controls
    const distanceToVaultControls = Math.sqrt(
      Math.pow(playerPosition.x - VAULT_CONTROLS_POSITION.x, 2) +
        Math.pow(playerPosition.y - VAULT_CONTROLS_POSITION.y, 2),
    )

    // Player is within 1 block radius of the computer
    if (distanceToComputer <= 1) {
      setNearComputer(true)
    } else {
      setNearComputer(false)
    }

    // Player is within 1 block radius of the message board
    if (distanceToMessageBoard <= 1) {
      setNearMessageBoard(true)
    } else {
      setNearMessageBoard(false)
    }

    // Player is within 1 block radius of the safety box
    if (distanceToSafetyBox <= 1) {
      setNearSafetyBox(true)
    } else {
      setNearSafetyBox(false)
    }

    // Player is within 1 block radius of the vault controls
    if (distanceToVaultControls <= 1) {
      setNearVaultControls(true)
    } else {
      setNearVaultControls(false)
    }
  }, [playerPosition])

  // Add a function to interact with the message board
  const interactWithMessageBoard = useCallback(() => {
    if (nearMessageBoard) {
      setShowMessageBoard(true)
    }
  }, [nearMessageBoard])

  // Add a function to interact with the vault controls after the interactWithMessageBoard function
  const interactWithVaultControls = useCallback(() => {
    if (nearVaultControls) {
      setShowVaultControls(true)
    }
  }, [nearVaultControls])

  // Add this function after the interactWithVaultControls function
  const handleButtonPress = (color: string) => {
    // Only allow adding buttons if we haven't reached 4 yet
    if (buttonSequence.length < 4) {
      const newSequence = [...buttonSequence, color]
      setButtonSequence(newSequence)

      // Only check if the sequence is correct after all 4 buttons have been pressed
      if (newSequence.length === 4) {
        // Compare the entered sequence with the correct sequence
        const isCorrect = newSequence.every((buttonColor, index) => buttonColor === correctSequence[index])

        setSequenceCorrect(isCorrect)

        if (isCorrect) {
          // Unlock the special blocks after a short delay
          setTimeout(() => {
            unlockSpecialBlocks()
            setShowVaultControls(false)
            setShowVaultSuccessDialogue(true) // Show the vault success dialogue instead of immediately showing the arrow
          }, 1500)
        } else {
          // Reset the sequence after a short delay if incorrect
          setTimeout(() => {
            setButtonSequence([])
            setSequenceCorrect(null)
          }, 1500)
        }
      }
    }
  }

  // Add a function to interact with the safety box
  const interactWithSafetyBox = useCallback(() => {
    if (nearSafetyBox && !safetyBoxOpened) {
      setShowCollectibleSelector(true)
    } else if (nearSafetyBox && safetyBoxOpened) {
      // Show a notification that the box is already opened
      // You can add a notification system here if needed
    }
  }, [nearSafetyBox, safetyBoxOpened])

  // Add a function to advance dialogue after the handleCollectibleSelection function
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
      setShowIntroDialogue(false)
    }
  }

  // Add a function to advance the success dialogue
  const advanceSuccessDialogue = () => {
    // Only allow advancing if not currently typing
    if (isSuccessTyping) return

    if (successDialogueData.currentLine < successDialogueData.text.length - 1) {
      // Update the speaker name if we have a speakerNames array
      const nextLine = successDialogueData.currentLine + 1
      const nextSpeakerName =
        successDialogueData.speakerNames && successDialogueData.speakerNames[nextLine]
          ? successDialogueData.speakerNames[nextLine]
          : successDialogueData.speakerName

      setSuccessDialogueData({
        ...successDialogueData,
        currentLine: nextLine,
        speakerName: nextSpeakerName,
      })
      setIsSuccessTyping(true)
    } else {
      // End dialogue
      setShowSuccessDialogue(false)
    }
  }

  // Add a function to advance the vault success dialogue after the advanceSuccessDialogue function
  const advanceVaultSuccessDialogue = () => {
    // Only allow advancing if not currently typing
    if (isVaultSuccessTyping) return

    if (vaultSuccessDialogueData.currentLine < vaultSuccessDialogueData.text.length - 1) {
      // Update the speaker name if we have a speakerNames array
      const nextLine = vaultSuccessDialogueData.currentLine + 1
      const nextSpeakerName =
        vaultSuccessDialogueData.speakerNames && vaultSuccessDialogueData.speakerNames[nextLine]
          ? vaultSuccessDialogueData.speakerNames[nextLine]
          : vaultSuccessDialogueData.speakerName

      setVaultSuccessDialogueData({
        ...vaultSuccessDialogueData,
        currentLine: nextLine,
        speakerName: nextSpeakerName,
      })
      setIsVaultSuccessTyping(true)
    } else {
      // End dialogue and show the arrow to proceed
      setShowVaultSuccessDialogue(false)
      setShowArrow(true)
    }
  }

  const [showNotification, setShowNotification] = useState<string | null>(null)
  const [boxOpened, setBoxOpened] = useState(false)

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

      // Add to inventory - specifically to slot 3
      const collectibleItem: InventoryItem = {
        type: "COLLECTIBLE",
        position: { x: 0, y: 0 },
        collected: true,
        name: selectedItem.name,
        description: selectedItem.description,
        inventorySlot: 3, // Explicitly set to slot 3
      }

      // Show notification
      setShowNotification(`You obtained: ${selectedItem.name}`)
      setTimeout(() => {
        setShowNotification(null)
      }, 3000)

      // Mark the box as opened
      setBoxOpened(true)
    }
  }

  // Handle computer interaction
  const interactWithComputer = useCallback(() => {
    if (nearComputer) {
      setShowComputerScreen(true)
    }
  }, [nearComputer])

  // Modify the unlockSpecialBlocks function to trigger the success dialogue
  const unlockSpecialBlocks = useCallback(() => {
    // Only unlock and call onUnlockVault if not already unlocked
    if (!specialBlocksDeactivated) {
      setSpecialBlocksDeactivated(true)
      setVaultOpen(true) // Set vault to open when special blocks are deactivated
      setShowSuccessDialogue(true) // Show the success dialogue
      if (onUnlockVault) {
        onUnlockVault()
      }
    }
  }, [onUnlockVault, specialBlocksDeactivated])

  // Modify the movePlayer function to check for transportation to Room4
  const movePlayer = useCallback(() => {
    // Skip movement if computer screen is open
    if (showComputerScreen || showVaultControls) return

    let newX = playerPosition.x
    let newY = playerPosition.y
    let newDirection = playerDirection
    let moved = false
    let attemptedMove = false

    // Check keys from ref
    if (keysRef.current["w"] || keysRef.current["arrowup"]) {
      newY += 1 // Up means increasing Y
      newDirection = "up"
      moved = true
      attemptedMove = true
    } else if (keysRef.current["s"] || keysRef.current["arrowdown"]) {
      newY -= 1 // Down means decreasing Y
      newDirection = "down"
      moved = true
      attemptedMove = true
    } else if (keysRef.current["a"] || keysRef.current["arrowleft"]) {
      newX -= 1
      newDirection = "left"
      moved = true
      attemptedMove = true
    } else if (keysRef.current["d"] || keysRef.current["arrowright"]) {
      newX += 1
      newDirection = "right"
      moved = true
      attemptedMove = true
    }

    // Update direction even if we can't move
    if (newDirection !== playerDirection) {
      setPlayerDirection(newDirection)
    }

    // Only track movement attempts when player is trying to move to a valid-looking position
    // (not obviously into a wall or out of bounds)
    if (attemptedMove) {
      const canMove = canMoveToPosition(newX, newY)

      // Check if this is a special block that looks passable but isn't
      const gridY = 9 - newY
      const gridX = newX - 1
      const isSpecialBlock =
        gridY >= 0 &&
        gridY < ROOM_GRID.length &&
        gridX >= 0 &&
        gridX < ROOM_GRID[0].length &&
        ROOM_GRID[gridY][gridX] === 2 &&
        !specialBlocksDeactivated

      // Only count as a blocked move if it's a special case (like a deactivated special block)
      // not if it's an obvious wall or out of bounds
      if (!canMove && isSpecialBlock) {
        setMovementAttempts((prev) => ({
          total: prev.total + 1,
          successful: prev.successful,
          blocked: prev.blocked + 1,
        }))
      } else if (canMove) {
        setMovementAttempts((prev) => ({
          total: prev.total + 1,
          successful: prev.successful + 1,
          blocked: prev.blocked,
        }))
      }
    }

    // Only update position if a movement key was pressed and the new position is valid
    if (moved && canMoveToPosition(newX, newY)) {
      // Check if player should be transported to Room4
      // Modified to require both vaultOpen AND showArrow to be true
      if (
        vaultOpen &&
        showArrow &&
        ((newX === 14 && newY === 5) || (newX === 15 && newY === 5) || (newX === 16 && newY === 5))
      ) {
        // Transport to Room4
        if (onExit) {
          onExit()
        }
        return
      }

      setPlayerPosition({ x: newX, y: newY })
      // Position is updated, so onPositionChange will be called via the useEffect
    }
  }, [
    playerPosition,
    playerDirection,
    canMoveToPosition,
    showComputerScreen,
    showVaultControls,
    specialBlocksDeactivated,
    vaultOpen,
    showArrow, // Add showArrow to the dependency array
    onExit,
  ])

  // Update the key press handler to include the toggle for special blocks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip key handling if computer screen is open (except ESC)
      if (
        (showComputerScreen || showMessageBoard || showCollectibleSelector || showVaultControls) &&
        e.key !== "Escape"
      )
        return

      // Add this to the key press handler useEffect to handle dialogue advancement
      // Find the existing handleKeyDown function and add this condition:
      // Inside the handleKeyDown function, add this condition:
      if (showIntroDialogue && !isTyping && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault()
        advanceDialogue()
        return
      }

      // Update the key press handler to include the success dialogue advancement
      // Find the handleKeyDown function in the useEffect and add this condition:
      // Inside the handleKeyDown function, add this condition after the showIntroDialogue condition:
      if (showSuccessDialogue && !isSuccessTyping && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault()
        advanceSuccessDialogue()
        return
      }

      // Update the key press handler to include the vault success dialogue advancement
      // Find the handleKeyDown function in the useEffect and add this condition:
      // Inside the handleKeyDown function, add this condition after the showSuccessDialogue condition:
      if (showVaultSuccessDialogue && !isVaultSuccessTyping && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault()
        advanceVaultSuccessDialogue()
        return
      }

      // Set the last key pressed
      setLastKeyPressed(e.key)

      // Prevent default behavior for movement keys to avoid scrolling
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(e.key.toLowerCase())) {
        e.preventDefault()
      }

      keysRef.current[e.key.toLowerCase()] = true

      // Toggle debug mode with Ctrl+H
      // Remove the key handler for Ctrl+H that toggles debug mode
      // Find this code in the handleKeyDown function inside the useEffect:
      // Toggle debug mode with Ctrl+H
      // if (e.key.toLowerCase() === "h" && e.ctrlKey) {
      //   setShowDebug((prev) => !prev)
      //   e.preventDefault()
      // }

      // Handle ESC key to exit the room or close computer screen or message board
      // In the handleKeyDown function, remove or comment out the ESC key handling:
      // if (e.key === "Escape") {
      //   if (showComputerScreen) {
      //     setShowComputerScreen(false)
      //     e.preventDefault() // Prevent default
      //     e.stopPropagation() // Stop propagation to parent
      //   } else if (showMessageBoard) {
      //     setShowMessageBoard(false)
      //     e.preventDefault() // Prevent default
      //     e.stopPropagation() // Stop propagation to parent
      //   } else if (showCollectibleSelector) {
      //     setShowCollectibleSelector(false)
      //     e.preventDefault() // Prevent default
      //     e.stopPropagation() // Stop propagation to parent
      //   } else if (showVaultControls) {
      //     setShowVaultControls(false)
      //     e.preventDefault() // Prevent default
      //     e.stopPropagation() // Stop propagation to parent
      //   } else {
      //     // Let the event bubble up to the parent GameEngine component
      //     // which will show the menu without resetting the room
      //   }
      // }

      // Handle E key for interactions
      if (e.key.toLowerCase() === "e") {
        if (
          nearComputer &&
          !showComputerScreen &&
          !showMessageBoard &&
          !showCollectibleSelector &&
          !showVaultControls
        ) {
          interactWithComputer()
        } else if (
          nearMessageBoard &&
          !showComputerScreen &&
          !showMessageBoard &&
          !showCollectibleSelector &&
          !showVaultControls
        ) {
          interactWithMessageBoard()
        } else if (
          nearSafetyBox &&
          !showComputerScreen &&
          !showMessageBoard &&
          !showCollectibleSelector &&
          !showVaultControls
        ) {
          interactWithSafetyBox()
        } else if (
          nearVaultControls &&
          !showComputerScreen &&
          !showMessageBoard &&
          !showCollectibleSelector &&
          !showVaultControls
        ) {
          interactWithVaultControls()
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false
    }

    // Add a window blur handler to reset all keys when focus is lost
    const handleBlur = () => {
      // Reset all keys when window loses focus
      Object.keys(keysRef.current).forEach((key) => {
        keysRef.current[key] = false
      })
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    window.addEventListener("blur", handleBlur)

    // Also reset keys when component mounts to ensure clean state
    Object.keys(keysRef.current).forEach((key) => {
      keysRef.current[key] = false
    })

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("blur", handleBlur)
    }
  }, [
    onExit,
    nearComputer,
    interactWithComputer,
    showComputerScreen,
    nearMessageBoard,
    interactWithMessageBoard,
    showMessageBoard,
    nearSafetyBox,
    interactWithSafetyBox,
    showCollectibleSelector,
    nearVaultControls,
    interactWithVaultControls,
    showVaultControls,
    showIntroDialogue,
    isTyping,
    showSuccessDialogue, // Add this
    isSuccessTyping, // Add this
    showVaultSuccessDialogue, // Add this
    isVaultSuccessTyping, // Add this
  ])

  // Add a function to programmatically unlock the special blocks
  // This will be called by the puzzle mini-game in the future

  // Update player movement
  useEffect(() => {
    const interval = setInterval(() => {
      const hasKeyInput =
        keysRef.current["w"] ||
        keysRef.current["a"] ||
        keysRef.current["s"] ||
        keysRef.current["d"] ||
        keysRef.current["arrowup"] ||
        keysRef.current["arrowdown"] ||
        keysRef.current["arrowleft"] ||
        keysRef.current["arrowright"]

      if (hasKeyInput) {
        movePlayer()
      }
    }, 150)

    return () => clearInterval(interval)
  }, [movePlayer])

  // Add this useEffect to track render count
  useEffect(() => {
    setRenderCount((prev) => prev + 1)
  }, [])

  // Add this useEffect to show the intro dialogue when the component mounts
  useEffect(() => {
    // Show intro dialogue when first entering Room 3
    setShowIntroDialogue(true)
  }, [])

  // Focus the canvas when the component mounts
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.focus()
    }
  }, [])

  return (
    <div className="relative w-full h-screen">
      {/* Background image - changes based on vault state */}
      <div className="absolute inset-0 z-0">
        <Image
          src={vaultOpen ? "/images/room3-vault-opened.png" : "/images/room3-vault-closed.png"}
          alt={vaultOpen ? "Vault Room with Open Vault" : "Vault Room with Closed Vault"}
          fill
          className="object-cover"
          priority
        />
      </div>

      <canvas
        ref={canvasRef}
        className="w-full h-full relative z-10"
        tabIndex={0} // Make canvas focusable
        onBlur={() => resetKeyState()}
        style={{ outline: "none" }} // Remove outline when focused
      />

      {/* Room info overlay */}
      {showDebug && (
        <div className="absolute top-4 left-4 bg-[#f8f0dd]/95 backdrop-blur-sm border-2 border-[#8b5a2b] p-3 rounded-sm text-[#5c4033] shadow-md relative overflow-hidden z-20">
          <div className="absolute inset-0 bg-[url('/aged-parchment.png')] opacity-10 pointer-events-none"></div>
          <p className="font-mono uppercase tracking-wide text-sm">Room 3: Vault Room</p>
          <p className="text-xs font-mono tracking-wide">Use WASD or arrow keys to move around. Press ESC to exit.</p>
          <p className="text-xs font-mono tracking-wide mt-1">
            Special blocks status: {specialBlocksDeactivated ? "Deactivated (passable)" : "Active (impassable)"}
          </p>
        </div>
      )}

      {/* Debug info */}
      {showDebug && (
        <div
          className="absolute top-20 left-4 bg-black/70 text-white p-2 rounded-md text-xs font-mono max-h-[80vh] overflow-y-auto z-20"
          style={{ minWidth: "300px" }}
        >
          <h3 className="font-bold mb-1 text-yellow-300">Debug Info</h3>

          {/* Player Info */}
          <div className="mb-2">
            <h4 className="text-blue-300 border-b border-blue-700 mb-1">Player</h4>
            <p>
              Position: ({playerPosition.x}, {playerPosition.y})
            </p>
            <p>Direction: {playerDirection}</p>
            <p>
              Pixel Position: ({Math.round((playerPosition.x - 1) * cellWidth)},{" "}
              {Math.round((9 - playerPosition.y) * cellHeight)})
            </p>
            <div className="mt-1 border-t border-gray-700 pt-1">
              <p>Movement Attempts: {movementAttempts.total}</p>
              <p>Successful Moves: {movementAttempts.successful}</p>
              <p>Special Block Collisions: {movementAttempts.blocked}</p>
              <p className="text-xs text-gray-400 italic">
                Note: Only tracks collisions with special blocks (water/bridges)
              </p>
            </div>
          </div>

          {/* Game State */}
          <div className="mb-2">
            <h4 className="text-green-300 border-b border-green-700 mb-1">Game State</h4>
            <p>
              Special Blocks:{" "}
              <span className={specialBlocksDeactivated ? "text-green-400" : "text-red-400"}>
                {specialBlocksDeactivated ? "Deactivated (passable)" : "Active (impassable)"}
              </span>
            </p>
            <p>
              Vault Status:{" "}
              <span className={vaultOpen ? "text-green-400" : "text-red-400"}>{vaultOpen ? "Open" : "Closed"}</span>
            </p>
            <p>
              Near Computer:{" "}
              <span className={nearComputer ? "text-green-400" : "text-red-400"}>{nearComputer ? "Yes" : "No"}</span>
            </p>
            <p>
              Computer Screen:{" "}
              <span className={showComputerScreen ? "text-green-400" : "text-red-400"}>
                {showComputerScreen ? "Open" : "Closed"}
              </span>
            </p>
            <p>
              Near Message Board:{" "}
              <span className={nearMessageBoard ? "text-green-400" : "text-red-400"}>
                {nearMessageBoard ? "Yes" : "No"}
              </span>
            </p>
            <p>
              Message Board:{" "}
              <span className={showMessageBoard ? "text-green-400" : "text-red-400"}>
                {showMessageBoard ? "Open" : "Closed"}
              </span>
            </p>
            <p>
              Near Safety Box:{" "}
              <span className={nearSafetyBox ? "text-green-400" : "text-red-400"}>{nearSafetyBox ? "Yes" : "No"}</span>
            </p>
            <p>
              Safety Box Opened:{" "}
              <span className={safetyBoxOpened ? "text-green-400" : "text-red-400"}>
                {safetyBoxOpened ? "Yes" : "No"}
              </span>
            </p>
            <p>
              Collectible Selector:{" "}
              <span className={showCollectibleSelector ? "text-green-400" : "text-red-400"}>
                {showCollectibleSelector ? "Open" : "Closed"}
              </span>
            </p>
            <p>
              Near Vault Controls:{" "}
              <span className={nearVaultControls ? "text-green-400" : "text-red-400"}>
                {nearVaultControls ? "Yes" : "No"}
              </span>
            </p>
            <p>
              Vault Controls:{" "}
              <span className={showVaultControls ? "text-green-400" : "text-red-400"}>
                {showVaultControls ? "Open" : "Closed"}
              </span>
            </p>
          </div>

          {/* Keyboard Inputs */}
          <div className="mb-2">
            <h4 className="text-purple-300 border-b border-purple-700 mb-1">Keyboard Inputs</h4>
            <div className="grid grid-cols-3 gap-1">
              <div
                className={`border ${keysRef.current["w"] || keysRef.current["arrowup"] ? "bg-white text-black" : "border-white"} px-1 text-center`}
              >
                W
              </div>
              <div
                className={`border ${keysRef.current["a"] || keysRef.current["arrowleft"] ? "bg-white text-black" : "border-white"} px-1 text-center`}
              >
                A
              </div>
              <div
                className={`border ${keysRef.current["s"] || keysRef.current["arrowdown"] ? "bg-white text-black" : "border-white"} px-1 text-center`}
              >
                S
              </div>
              <div
                className={`border ${keysRef.current["d"] || keysRef.current["arrowright"] ? "bg-white text-black" : "border-white"} px-1 text-center`}
              >
                D
              </div>
              <div
                className={`border ${keysRef.current["e"] ? "bg-white text-black" : "border-white"} px-1 text-center`}
              >
                E
              </div>
              <div
                className={`border ${keysRef.current["escape"] ? "bg-white text-black" : "border-white"} px-1 text-center`}
              >
                ESC
              </div>
            </div>
            <p className="mt-1">
              Active Keys:{" "}
              {Object.entries(keysRef.current)
                .filter(([_, pressed]) => pressed)
                .map(([key]) => key.toUpperCase())
                .join(", ") || "None"}
            </p>
            <p>Last Key Pressed: {lastKeyPressed || "None"}</p>
          </div>

          {/* Collision Info */}
          <div className="mb-2">
            <h4 className="text-orange-300 border-b border-orange-700 mb-1">Collision Info</h4>
            <p>
              Current Cell Type: {(() => {
                const gridY = 9 - playerPosition.y
                const gridX = playerPosition.x - 1
                if (gridY >= 0 && gridY < ROOM_GRID.length && gridX >= 0 && gridX < ROOM_GRID[0].length) {
                  const cellType = ROOM_GRID[gridY][gridX]
                  return cellType === 0
                    ? "0 (Walkable)"
                    : cellType === 1
                      ? "1 (Wall)"
                      : cellType === 2
                        ? "2 (Special)"
                        : cellType
                }
                return "Out of bounds"
              })()}
            </p>
            <p>Can Move Up: {canMoveToPosition(playerPosition.x, playerPosition.y + 1) ? "Yes" : "No"}</p>
            <p>Can Move Down: {canMoveToPosition(playerPosition.x, playerPosition.y - 1) ? "Yes" : "No"}</p>
            <p>Can Move Left: {canMoveToPosition(playerPosition.x - 1, playerPosition.y) ? "Yes" : "No"}</p>
            <p>Can Move Right: {canMoveToPosition(playerPosition.x + 1, playerPosition.y) ? "Yes" : "No"}</p>
          </div>

          {/* Computer Info */}
          <div className="mb-2">
            <h4 className="text-cyan-300 border-b border-cyan-700 mb-1">Computer Info</h4>
            <p>
              Computer Position: ({COMPUTER_POSITION.x}, {COMPUTER_POSITION.y})
            </p>
            <p>
              Distance to Computer:{" "}
              {Math.sqrt(
                Math.pow(playerPosition.x - COMPUTER_POSITION.x, 2) +
                  Math.pow(playerPosition.y - COMPUTER_POSITION.y, 2),
              ).toFixed(2)}{" "}
              blocks
            </p>
            <p>
              Interaction Range:{" "}
              {Math.sqrt(
                Math.pow(playerPosition.x - COMPUTER_POSITION.x, 2) +
                  Math.pow(playerPosition.y - COMPUTER_POSITION.y, 2),
              ) <= 1
                ? "In Range"
                : "Out of Range"}
            </p>
          </div>

          {/* Add Message Board Info section */}
          <div className="mb-2">
            <h4 className="text-yellow-300 border-b border-yellow-700 mb-1">Message Board Info</h4>
            <p>
              Message Board Position: ({MESSAGE_BOARD_POSITION.x}, {MESSAGE_BOARD_POSITION.y})
            </p>
            <p>
              Distance to Message Board:{" "}
              {Math.sqrt(
                Math.pow(playerPosition.x - MESSAGE_BOARD_POSITION.x, 2) +
                  Math.pow(playerPosition.y - MESSAGE_BOARD_POSITION.y, 2),
              ).toFixed(2)}{" "}
              blocks
            </p>
            <p>
              Interaction Range:{" "}
              {Math.sqrt(
                Math.pow(playerPosition.x - MESSAGE_BOARD_POSITION.x, 2) +
                  Math.pow(playerPosition.y - MESSAGE_BOARD_POSITION.y, 2),
              ).toFixed(2)}{" "}
              blocks
            </p>
            <p>
              Interaction Range:{" "}
              {Math.sqrt(
                Math.pow(playerPosition.x - MESSAGE_BOARD_POSITION.x, 2) +
                  Math.pow(playerPosition.y - MESSAGE_BOARD_POSITION.y, 2),
              ) <= 1
                ? "In Range"
                : "Out of Range"}
            </p>
          </div>

          {/* Add Safety Box Info section */}
          <div className="mb-2">
            <h4 className="text-pink-300 border-b border-pink-700 mb-1">Safety Box Info</h4>
            <p>
              Safety Box Position: ({SAFETY_BOX_POSITION.x}, {SAFETY_BOX_POSITION.y})
            </p>
            <p>
              Distance to Safety Box:{" "}
              {Math.sqrt(
                Math.pow(playerPosition.x - SAFETY_BOX_POSITION.x, 2) +
                  Math.pow(playerPosition.y - SAFETY_BOX_POSITION.y, 2),
              ).toFixed(2)}{" "}
              blocks
            </p>
            <p>
              Interaction Range:{" "}
              {Math.sqrt(
                Math.pow(playerPosition.x - SAFETY_BOX_POSITION.x, 2) +
                  Math.pow(playerPosition.y - SAFETY_BOX_POSITION.y, 2),
              ) <= 1
                ? "In Range"
                : "Out of Range"}
            </p>
            <p>
              Safety Box Opened:{" "}
              <span className={safetyBoxOpened ? "text-green-400" : "text-red-400"}>
                {safetyBoxOpened ? "Yes" : "No"}
              </span>
            </p>
            <p>
              Show Collectible Selector:{" "}
              <span className={showCollectibleSelector ? "text-green-400" : "text-red-400"}>
                {showCollectibleSelector ? "Open" : "Closed"}
              </span>
            </p>
          </div>

          {/* Add a new section for Vault Controls Info in the debug panel */}
          <div className="mb-2">
            <h4 className="text-indigo-300 border-b border-indigo-700 mb-1">Vault Controls Info</h4>
            <p>
              Vault Controls Position: ({VAULT_CONTROLS_POSITION.x}, {VAULT_CONTROLS_POSITION.y})
            </p>
            <p>
              Distance to Vault Controls:{" "}
              {Math.sqrt(
                Math.pow(playerPosition.x - VAULT_CONTROLS_POSITION.x, 2) +
                  Math.pow(playerPosition.y - VAULT_CONTROLS_POSITION.y, 2),
              ).toFixed(2)}{" "}
              blocks
            </p>
            <p>
              Interaction Range:{" "}
              {Math.sqrt(
                Math.pow(playerPosition.x - VAULT_CONTROLS_POSITION.x, 2) +
                  Math.pow(playerPosition.y - VAULT_CONTROLS_POSITION.y, 2),
              ) <= 1
                ? "In Range"
                : "Out of Range"}
            </p>
          </div>

          {/* Performance */}
          <div>
            <h4 className="text-red-300 border-b border-red-700 mb-1">Performance</h4>
            <p>
              Canvas Size: {dimensions.width} x {dimensions.height}
            </p>
            <p>
              Cell Size: {Math.round(cellWidth)} x {Math.round(cellHeight)}
            </p>
            <p>Background Loaded: {backgroundLoaded ? "Yes" : "No"}</p>
            <p>Render Count: {renderCount}</p>
          </div>
        </div>
      )}

      {/* Safety Box Prompt */}
      {nearSafetyBox && !safetyBoxOpened && !showComputerScreen && !showMessageBoard && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#f8f0dd]/95 backdrop-blur-sm border-2 border-[#8b5a2b] p-3 rounded-sm text-[#5c4033] text-center relative overflow-hidden z-30">
          <div className="absolute inset-0 bg-[url('/aged-parchment.png')] opacity-10 pointer-events-none"></div>
          <p className="font-mono uppercase tracking-wide">Press E to open the safety box</p>
        </div>
      )}

      {/* Add the vault controls prompt to the JSX
Add this after the safety box prompt */}
      {nearVaultControls &&
        !showComputerScreen &&
        !showMessageBoard &&
        !showCollectibleSelector &&
        !showVaultControls && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#f8f0dd]/95 backdrop-blur-sm border-2 border-[#8b5a2b] p-3 rounded-sm text-[#5c4033] text-center relative overflow-hidden z-30">
            <div className="absolute inset-0 bg-[url('/aged-parchment.png')] opacity-10 pointer-events-none"></div>
            <p className="font-mono uppercase tracking-wide">Press E to access vault controls</p>
          </div>
        )}

      {/* Collectible Selector */}
      {showCollectibleSelector && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="bg-[#f8f0dd]/95 backdrop-blur-sm border-4 border-[#8b5a2b] p-6 rounded-sm text-[#5c4033] max-w-2xl w-full relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/aged-parchment.png')] opacity-10 pointer-events-none"></div>
            <h2 className="text-xl font-mono uppercase tracking-wide mb-4 text-center border-b-2 border-[#8b5a2b] pb-2">
              Select a Mental Wealth Matchbox
            </h2>
            <p className="mb-6 text-center text-sm font-mono">Choose one matchbox to add to your inventory.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {collectibles.map((item) => (
                <button
                  key={item.id}
                  className="bg-[#e6d2b3] hover:bg-[#d9c4a3] border-2 border-[#8b5a2b] p-3 rounded-sm transition-colors"
                  onClick={() => handleCollectibleSelection(item.id)}
                >
                  <div className="flex flex-col items-center">
                    <div className="w-full h-24 flex items-center justify-center mb-2">
                      <img
                        src={getMatchboxImagePath(item.name) || "/placeholder.svg"}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <span className="text-sm font-mono uppercase tracking-wide">{item.name}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-[#f8f0dd] border-2 border-[#8b5a2b] p-3 rounded-sm mb-4 min-h-[80px] relative">
              <div className="absolute inset-0 bg-[url('/aged-parchment.png')] opacity-5 pointer-events-none"></div>
              <p className="text-sm text-center italic font-mono">Select a matchbox to see its description</p>
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
      )}

      {/* Global UI Controls - Update to include safety box interaction */}
      <div className="absolute top-4 right-4 flex gap-2 z-30">
        <KeyIndicator keyLabel="WASD" text="Move" />
        {nearComputer && !showComputerScreen && !showMessageBoard && !showCollectibleSelector && !showVaultControls && (
          <KeyIndicator keyLabel="E" text="Use Computer" />
        )}
        {nearMessageBoard &&
          !showComputerScreen &&
          !showMessageBoard &&
          !showCollectibleSelector &&
          !showVaultControls && <KeyIndicator keyLabel="E" text="View Board" />}
        {nearSafetyBox &&
          !safetyBoxOpened &&
          !showComputerScreen &&
          !showMessageBoard &&
          !showCollectibleSelector &&
          !showVaultControls && <KeyIndicator keyLabel="E" text="Open Box" />}
        {nearVaultControls &&
          !showComputerScreen &&
          !showMessageBoard &&
          !showCollectibleSelector &&
          !showVaultControls && <KeyIndicator keyLabel="E" text="Access Controls" />}
        {/* Remove the KeyIndicator for "CTRL+H" from the UI controls */}
        <KeyIndicator keyLabel="ESC" text="Exit" />
      </div>

      {/* Draw player */}
      <div
        className="absolute z-20"
        style={{
          left: `${(playerPosition.x - 1) * cellWidth}px`,
          top: `${(9 - playerPosition.y) * cellHeight}px`,
          width: `${cellWidth}px`,
          height: `${cellHeight}px`,
        }}
      >
        <div className="w-full h-full flex items-center justify-center">
          {playerDirection === "up" && (
            <img src="/images/latte_up_standing.png" alt="Latte facing up" className="w-full h-full object-contain" />
          )}
          {playerDirection === "down" && (
            <img
              src="/images/latte_down_standing.png"
              alt="Latte facing down"
              className="w-full h-full object-contain"
            />
          )}
          {playerDirection === "left" && (
            <img
              src="/images/latte_left_standing.png"
              alt="Latte facing left"
              className="w-full h-full object-contain"
            />
          )}
          {playerDirection === "right" && (
            <img
              src="/images/latte_right_standing.png"
              alt="Latte facing right"
              className="w-full h-full object-contain"
            />
          )}
        </div>
        <div className="absolute -top-5 left-0 w-full text-center text-white text-xs">Latte</div>
      </div>

      {/* Computer Screen Overlay */}
      {showComputerScreen && (
        <ComputerScreenView
          onClose={() => setShowComputerScreen(false)}
          onSuccess={unlockSpecialBlocks}
          showDebug={showDebug}
        />
      )}

      {/* Message Board Overlay */}
      {showMessageBoard && <MessageBoardView onClose={() => setShowMessageBoard(false)} />}

      {/* Vault Controls Overlay */}
      {showVaultControls && (
        <div
          className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50"
          onClick={(e) => {
            // Prevent clicks from bubbling to elements below
            e.stopPropagation()
          }}
        >
          <div className="relative bg-gray-800/95 border-4 border-gray-600 p-6 rounded-sm shadow-lg max-w-4xl w-full">
            <button
              onClick={(e) => {
                e.stopPropagation() // Prevent event bubbling
                setShowVaultControls(false)
                setButtonSequence([])
                setSequenceCorrect(null)
              }}
              className="absolute top-4 right-4 bg-gray-700 hover:bg-gray-600 p-2 rounded-sm border-2 border-gray-500 transition-colors z-10"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-300"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>

            <div className="relative w-full aspect-[16/9] border-2 border-gray-600 rounded-sm overflow-hidden bg-black p-8">
              <div className="absolute inset-0 flex flex-col items-center justify-start p-8">
                <h2 className="text-2xl text-gray-300 font-mono uppercase tracking-wide mb-4">Vault Controls</h2>

                {/* Sequence instruction and feedback */}
                <div className="mb-8 text-center">
                  <p className="text-gray-300 font-mono">
                    Press the buttons in the correct sequence to unlock the gate.
                  </p>
                  {sequenceCorrect === true && (
                    <p className="text-green-500 font-mono mt-2 animate-pulse">Correct sequence! Unlocking gate...</p>
                  )}
                  {sequenceCorrect === false && (
                    <p className="text-red-500 font-mono mt-2 animate-pulse">Incorrect sequence! Try again.</p>
                  )}
                  <div className="flex justify-center mt-4 space-x-2">
                    {correctSequence.map((_, index) => (
                      <div
                        key={index}
                        className={`w-4 h-4 rounded-full ${
                          index < buttonSequence.length
                            ? buttonSequence[index] === "red"
                              ? "bg-red-500"
                              : buttonSequence[index] === "green"
                                ? "bg-green-500"
                                : buttonSequence[index] === "blue"
                                  ? "bg-blue-500"
                                  : "bg-yellow-500"
                            : "bg-gray-700"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Button grid */}
                <div className="flex flex-col items-center justify-center">
                  {/* Indicator dots showing pressed buttons */}
                  <div className="flex justify-center mb-6 space-x-2">
                    {correctSequence.map((_, index) => (
                      <div
                        key={index}
                        className={`w-4 h-4 rounded-full ${
                          index < buttonSequence.length
                            ? buttonSequence[index] === "red"
                              ? "bg-red-500"
                              : buttonSequence[index] === "green"
                                ? "bg-green-500"
                                : buttonSequence[index] === "blue"
                                  ? "bg-blue-500"
                                  : buttonSequence[index] === "yellow"
                                    ? "bg-yellow-500"
                                    : buttonSequence[index] === "purple"
                                      ? "bg-purple-500"
                                      : "bg-gray-100"
                            : "bg-gray-700"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Button row - without labels */}
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleButtonPress("red")}
                      className="w-20 h-20 bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-md border-4 border-red-800 transition-colors shadow-lg"
                      disabled={buttonSequence.length === correctSequence.length}
                    />
                    <button
                      onClick={() => handleButtonPress("blue")}
                      className="w-20 h-20 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-md border-4 border-blue-800 transition-colors shadow-lg"
                      disabled={buttonSequence.length === correctSequence.length}
                    />
                    <button
                      onClick={() => handleButtonPress("white")}
                      className="w-20 h-20 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-md border-4 border-gray-300 transition-colors shadow-lg"
                      disabled={buttonSequence.length === correctSequence.length}
                    />
                    <button
                      onClick={() => handleButtonPress("green")}
                      className="w-20 h-20 bg-green-600 hover:bg-green-700 active:bg-green-800 rounded-md border-4 border-green-800 transition-colors shadow-lg"
                      disabled={buttonSequence.length === correctSequence.length}
                    />
                    <button
                      onClick={() => handleButtonPress("purple")}
                      className="w-20 h-20 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-md border-4 border-purple-800 transition-colors shadow-lg"
                      disabled={buttonSequence.length === correctSequence.length}
                    />
                    <button
                      onClick={() => handleButtonPress("yellow")}
                      className="w-20 h-20 bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 rounded-md border-4 border-yellow-700 transition-colors shadow-lg"
                      disabled={buttonSequence.length === correctSequence.length}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtle glowing indicators at the teleport positions - only show after vault is unlocked */}
      {showArrow && (
        <>
          <div
            className="absolute z-10 animate-pulse"
            style={{
              left: `${(14 - 1) * cellWidth}px`,
              top: `${(9 - 5) * cellHeight}px`,
              width: `${cellWidth}px`,
              height: `${cellHeight}px`,
            }}
          >
            <div className="w-full h-full bg-green-500/30 rounded-full blur-sm"></div>
          </div>
          <div
            className="absolute z-10 animate-pulse"
            style={{
              left: `${(15 - 1) * cellWidth}px`,
              top: `${(9 - 5) * cellHeight}px`,
              width: `${cellWidth}px`,
              height: `${cellHeight}px`,
            }}
          >
            <div className="w-full h-full bg-green-500/30 rounded-full blur-sm"></div>
          </div>
          <div
            className="absolute z-10 animate-pulse"
            style={{
              left: `${(16 - 1) * cellWidth}px`,
              top: `${(9 - 5) * cellHeight}px`,
              width: `${cellWidth}px`,
              height: `${cellHeight}px`,
            }}
          >
            <div className="w-full h-full bg-green-500/30 rounded-full blur-sm"></div>
          </div>
        </>
      )}

      {/* Blinking Arrow - only show after vault is unlocked */}
      {showArrow && (
        <BlinkingArrow
          x={(15 - 1) * cellWidth + cellWidth / 2}
          y={(9 - 7) * cellHeight + cellHeight}
          direction="down"
          color="green-600"
        />
      )}
      {/* Add the DialogueBox component to the JSX, right before the closing </div> of the main container
Add this right before the final closing </div> of the component: */}
      {showIntroDialogue && (
        <DialogueBox
          character={dialogueData.character}
          text={dialogueData.text[dialogueData.currentLine]}
          speakerName={dialogueData.speakerName}
          isTyping={isTyping}
          setIsTyping={setIsTyping}
          onAdvanceDialogue={advanceDialogue}
        />
      )}
      {showSuccessDialogue && (
        <DialogueBox
          character={successDialogueData.character}
          text={successDialogueData.text[successDialogueData.currentLine]}
          speakerName={successDialogueData.speakerName}
          isTyping={isSuccessTyping}
          setIsTyping={setIsSuccessTyping}
          onAdvanceDialogue={advanceSuccessDialogue}
        />
      )}
      {showVaultSuccessDialogue && (
        <DialogueBox
          character={vaultSuccessDialogueData.character}
          text={vaultSuccessDialogueData.text[vaultSuccessDialogueData.currentLine]}
          speakerName={vaultSuccessDialogueData.speakerName}
          isTyping={isVaultSuccessTyping}
          setIsTyping={setIsVaultSuccessTyping}
          onAdvanceDialogue={advanceVaultSuccessDialogue}
        />
      )}
    </div>
  )
}
