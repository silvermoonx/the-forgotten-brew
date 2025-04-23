"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"

interface TilePuzzleProps {
  onComplete: () => void
  onClose: () => void
}

// Define the structure for a puzzle tile
interface PuzzleTile {
  id: number
  currentPosition: number | null
  correctPosition: number
}

export default function TilePuzzle({ onComplete, onClose }: TilePuzzleProps) {
  // Grid size constants
  const GRID_SIZE = 3
  const TOTAL_TILES = GRID_SIZE * GRID_SIZE

  // State for puzzle tiles
  const [tiles, setTiles] = useState<PuzzleTile[]>([])
  const [emptyPositions, setEmptyPositions] = useState<number[]>([2, 5]) // Top-right and middle-right are empty initially
  const [isComplete, setIsComplete] = useState(false)
  const [moveCount, setMoveCount] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Drag and drop state
  const [draggedTile, setDraggedTile] = useState<number | null>(null)
  const [draggedTileId, setDraggedTileId] = useState<number | null>(null)
  const [isDraggingInactive, setIsDraggingInactive] = useState(false)
  const [dragOverPosition, setDragOverPosition] = useState<number | null>(null)

  // Initialize puzzle
  useEffect(() => {
    initializePuzzle()
  }, [])

  // Initialize the puzzle with tiles in correct order, then shuffle
  const initializePuzzle = () => {
    // Create tiles in solved state
    // The correct positions are based on the provided order [0, 2, 1, 6, 8, 7, 3, 5, 4]:
    // [0][2][1] - Top row
    // [6][8][7] - Middle row
    // [3][5][4] - Bottom row
    const initialTiles: PuzzleTile[] = [
      { id: 0, currentPosition: 0, correctPosition: 0 }, // Top-left
      { id: 1, currentPosition: 1, correctPosition: 2 }, // Should be at top-right
      { id: 2, currentPosition: null, correctPosition: 1 }, // Should be at top-middle
      { id: 3, currentPosition: 3, correctPosition: 6 }, // Should be at bottom-left
      { id: 4, currentPosition: 4, correctPosition: 8 }, // Should be at bottom-right
      { id: 5, currentPosition: null, correctPosition: 7 }, // Should be at bottom-middle
      { id: 6, currentPosition: 6, correctPosition: 3 }, // Should be at middle-left
      { id: 7, currentPosition: 7, correctPosition: 5 }, // Should be at middle-right
      { id: 8, currentPosition: 8, correctPosition: 4 }, // Should be at middle-middle
    ]

    // Shuffle the active tiles
    const shuffledTiles = shuffleTiles(initialTiles)
    setTiles(shuffledTiles)

    // Reset game state
    setIsComplete(false)
    setMoveCount(0)
    setEmptyPositions([2, 5]) // Top-right and middle-right are empty initially
  }

  // Shuffle tiles
  const shuffleTiles = (tiles: PuzzleTile[]): PuzzleTile[] => {
    const shuffled = [...tiles]
    const activeTiles = shuffled.filter((tile) => tile.currentPosition !== null)

    // Create a temporary array of positions for active tiles
    const positions = activeTiles.map((tile) => tile.currentPosition as number)

    // Fisher-Yates shuffle algorithm for positions
    let currentIndex = positions.length
    while (currentIndex > 0) {
      const randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex--

      // Swap positions
      const temp = positions[currentIndex]
      positions[currentIndex] = positions[randomIndex]
      positions[randomIndex] = temp
    }

    // Assign shuffled positions back to active tiles
    activeTiles.forEach((tile, index) => {
      tile.currentPosition = positions[index]
    })

    return shuffled
  }

  // Move a tile to an empty position
  const moveTile = (tileIndex: number, targetPosition: number) => {
    // Find the tile at the given position
    const tileToMove = tiles.find((tile) => tile.currentPosition === tileIndex)

    if (!tileToMove) return

    // Check if the target position is empty
    if (!emptyPositions.includes(targetPosition)) return

    // Check if the move is valid (adjacent to the current position)
    const tileRow = Math.floor(tileIndex / GRID_SIZE)
    const tileCol = tileIndex % GRID_SIZE
    const targetRow = Math.floor(targetPosition / GRID_SIZE)
    const targetCol = targetPosition % GRID_SIZE

    const isAdjacent =
      (Math.abs(targetRow - tileRow) === 1 && targetCol === tileCol) ||
      (Math.abs(targetCol - tileCol) === 1 && targetRow === tileRow)

    if (!isAdjacent) return

    // Move the tile to the empty position
    const newTiles = [...tiles]
    const tileToMoveIndex = newTiles.findIndex((t) => t.id === tileToMove.id)

    // Update empty positions
    const newEmptyPositions = [...emptyPositions]
    const emptyPosIndex = newEmptyPositions.indexOf(targetPosition)
    newEmptyPositions[emptyPosIndex] = tileToMove.currentPosition as number

    // Update tile position
    newTiles[tileToMoveIndex].currentPosition = targetPosition

    // Update state
    setTiles(newTiles)
    setEmptyPositions(newEmptyPositions)
    setMoveCount((prev) => prev + 1)

    // Check if puzzle is solved using the improved function
    checkCompletion(newTiles)
  }

  // Place an inactive tile into an empty position
  const placeInactiveTile = (tileId: number, targetPosition: number) => {
    if (!emptyPositions.includes(targetPosition)) return

    const newTiles = [...tiles]
    const tileIndex = newTiles.findIndex((t) => t.id === tileId)

    if (tileIndex === -1 || newTiles[tileIndex].currentPosition !== null) return

    // Place the tile in the empty position
    newTiles[tileIndex].currentPosition = targetPosition

    // Update empty positions
    const newEmptyPositions = emptyPositions.filter((pos) => pos !== targetPosition)

    // Update state
    setTiles(newTiles)
    setEmptyPositions(newEmptyPositions)
    setMoveCount((prev) => prev + 1)

    // Check if puzzle is solved - make sure to call this after state updates
    checkCompletion(newTiles)
  }

  // Check if the puzzle matches the reference image layout
  const checkCompletion = (currentTiles: PuzzleTile[]) => {
    // First check if all tiles are placed (no null positions)
    const allTilesPlaced = currentTiles.every((tile) => tile.currentPosition !== null)

    // Then check if all tiles are in their correct positions
    const isCorrect = allTilesPlaced && currentTiles.every((tile) => tile.currentPosition === tile.correctPosition)

    console.log("Checking completion:", {
      allTilesPlaced,
      isCorrect,
      tiles: currentTiles.map((t) => ({ id: t.id, current: t.currentPosition, correct: t.correctPosition })),
    })

    if (isCorrect) {
      console.log("Puzzle completed! Immediately calling callbacks")
      setIsComplete(true)

      // Force immediate completion with error handling
      try {
        if (onComplete) {
          console.log("Directly calling onComplete callback")
          onComplete()
        } else {
          console.error("onComplete callback is undefined!")
        }
      } catch (error) {
        console.error("Error calling onComplete:", error)
      }

      // Force immediate closure with error handling
      try {
        if (onClose) {
          console.log("Directly calling onClose callback")
          onClose()
        } else {
          console.error("onClose callback is undefined!")
        }
      } catch (error) {
        console.error("Error calling onClose:", error)
      }

      // Add a direct alert for debugging
      console.log("PUZZLE COMPLETED - TRANSITION SHOULD HAPPEN NOW")
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, position: number | null, tileId: number) => {
    try {
      setDraggedTile(position)
      setDraggedTileId(tileId)
      setIsDraggingInactive(position === null)

      // Check if dataTransfer is available
      if (e.dataTransfer) {
        // Set the data first (required for Firefox)
        e.dataTransfer.setData("text/plain", position !== null ? position.toString() : "inactive")
        e.dataTransfer.effectAllowed = "move"

        // Try to set a ghost image, but handle potential failures
        try {
          const img = new Image()
          img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" // Transparent 1x1 pixel
          e.dataTransfer.setDragImage(img, 0, 0)
        } catch (imgError) {
          console.warn("Could not set drag image:", imgError)
          // Continue without custom drag image
        }
      }
    } catch (error) {
      console.error("Error in drag start:", error)
      // Prevent the drag operation if there was an error
      e.preventDefault()
    }
  }

  // Also update the other drag and drop handlers with safety checks
  const handleDragOver = (e: React.DragEvent, position: number) => {
    e.preventDefault()

    // Only proceed if dataTransfer is available
    if (!e.dataTransfer) return

    // Only highlight if this is a valid drop target
    if (emptyPositions.includes(position)) {
      setDragOverPosition(position)
    }

    // If dragging an active tile, check if the move is valid
    if (draggedTile !== null) {
      const tileRow = Math.floor(draggedTile / GRID_SIZE)
      const tileCol = draggedTile % GRID_SIZE
      const targetRow = Math.floor(position / GRID_SIZE)
      const targetCol = position % GRID_SIZE

      const isAdjacent =
        (Math.abs(targetRow - tileRow) === 1 && targetCol === tileCol) ||
        (Math.abs(targetCol - tileCol) === 1 && targetRow === tileRow)

      if (emptyPositions.includes(position) && isAdjacent) {
        e.dataTransfer.dropEffect = "move"
      } else {
        e.dataTransfer.dropEffect = "none"
      }
    }
    // If dragging an inactive tile, any empty position is valid
    else if (isDraggingInactive) {
      if (emptyPositions.includes(position)) {
        e.dataTransfer.dropEffect = "move"
      } else {
        e.dataTransfer.dropEffect = "none"
      }
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverPosition(null)
  }

  const handleDrop = (e: React.DragEvent, position: number) => {
    e.preventDefault()
    setDragOverPosition(null)

    // Check if this is a valid drop target
    if (!emptyPositions.includes(position)) return

    // Handle dropping an active tile
    if (draggedTile !== null) {
      moveTile(draggedTile, position)
    }
    // Handle dropping an inactive tile
    else if (isDraggingInactive && draggedTileId !== null) {
      placeInactiveTile(draggedTileId, position)
    }

    // Reset drag state
    setDraggedTile(null)
    setDraggedTileId(null)
    setIsDraggingInactive(false)
  }

  const handleDragEnd = () => {
    setDraggedTile(null)
    setDraggedTileId(null)
    setIsDraggingInactive(false)
    setDragOverPosition(null)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
      <div className="bg-[#f8f0dd] border-4 border-[#8b5a2b] p-6 rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#5c4033]">Security Override Puzzle</h2>
          <button onClick={onClose} className="text-[#5c4033] hover:text-[#8b5a2b] transition-colors">
            ✕
          </button>
        </div>

        {/* Instructions */}
        <p className="text-sm text-[#5c4033] mb-4 text-center">
          Drag and drop tiles to complete the image. Tiles can only move to adjacent empty spaces.
        </p>

        {/* Full image preview (hidden until puzzle is complete) */}
        {isComplete && (
          <div className="mb-4 flex justify-center">
            <div className="relative w-64 h-64 border-2 border-[#8b5a2b]">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sliding_tile_asset-locMaEuxlQrBl9e89imXJeZUwqCf09.png"
                alt="WORK. EAT. GRIND. REPEAT."
                fill
                className="object-cover"
                onLoad={() => setImageLoaded(true)}
              />
            </div>
          </div>
        )}

        <div className="flex gap-4">
          {/* Main puzzle grid */}
          <div className="grid grid-cols-3 gap-1 bg-[#8b5a2b] p-1 rounded aspect-square" style={{ width: "240px" }}>
            {Array.from({ length: TOTAL_TILES }).map((_, index) => {
              // Find the tile at this position in the grid
              const tile = tiles.find((t) => t.currentPosition === index)

              // If no tile is at this position, it's an empty slot
              if (!tile) {
                return (
                  <div
                    key={`empty-${index}`}
                    className={`
                      bg-[#8b5a2b] aspect-square border border-white/20
                      ${dragOverPosition === index ? "border-2 border-yellow-400 bg-[#8b5a2b]/70" : ""}
                      ${emptyPositions.includes(index) ? "cursor-pointer" : ""}
                    `}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                  />
                )
              }

              return (
                <div
                  key={tile.id}
                  draggable={!isComplete}
                  onDragStart={(e) => handleDragStart(e, index, tile.id)}
                  onDragEnd={handleDragEnd}
                  className={`
                    relative bg-[#f8f0dd] hover:bg-[#e6dcc9] cursor-grab active:cursor-grabbing
                    transition-all duration-200 aspect-square overflow-hidden
                    ${isComplete ? "border-none" : "border border-[#8b5a2b]/50"}
                    ${draggedTile === index ? "opacity-50" : "opacity-100"}
                    w-full h-full p-0 m-0
                  `}
                >
                  {/* Tile image */}
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage: `url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sliding_tile_asset-locMaEuxlQrBl9e89imXJeZUwqCf09.png)`,
                      backgroundSize: "300%", // 300% because we have 3 tiles in each dimension
                      backgroundPosition: `${-(tile.id % GRID_SIZE) * 50}% ${-Math.floor(tile.id / GRID_SIZE) * 50}%`,
                    }}
                  />
                </div>
              )
            })}
          </div>

          {/* Inactive tiles section */}
          <div className="flex flex-col gap-2 justify-center">
            {tiles
              .filter((tile) => tile.currentPosition === null)
              .map((tile) => (
                <div
                  key={tile.id}
                  draggable={!isComplete}
                  onDragStart={(e) => handleDragStart(e, null, tile.id)}
                  onDragEnd={handleDragEnd}
                  className={`
                    relative overflow-hidden aspect-square
                    cursor-grab active:cursor-grabbing hover:scale-105
                    transition-all duration-200
                    border border-[#8b5a2b]/50 bg-[#f8f0dd]
                    ${draggedTileId === tile.id ? "opacity-50" : "opacity-100"}
                  `}
                  style={{ width: "75px", height: "75px" }}
                >
                  {/* Tile image */}
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage: `url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sliding_tile_asset-locMaEuxlQrBl9e89imXJeZUwqCf09.png)`,
                      backgroundSize: "300%", // 300% because we have 3 tiles in each dimension
                      backgroundPosition: `${-(tile.id % GRID_SIZE) * 50}% ${-Math.floor(tile.id / GRID_SIZE) * 50}%`,
                    }}
                  />
                </div>
              ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-[#5c4033]">Moves: {moveCount}</div>

          <div className="flex gap-2">
            <button
              onClick={initializePuzzle}
              className="px-3 py-1 bg-[#8b5a2b] text-white rounded hover:bg-[#6d4522] transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Success message */}
        {isComplete && (
          <div className="mt-4 p-2 bg-green-100 border border-green-500 text-green-700 rounded text-center">
            Puzzle solved! Security door unlocked.
          </div>
        )}
      </div>
    </div>
  )
}
