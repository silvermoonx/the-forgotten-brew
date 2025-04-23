"use client"

import GameEngine from "./game-engine"

// Re-export the GameEngine component as the default export
export default GameEngine

// Export types and interfaces
export type CharacterType = "BEAR" | "HAMSTER" | "BULL_GUARD"
export type ItemType = "BULL_COSTUME" | "CORN"
export type Direction = "up" | "down" | "left" | "right"

export interface Position {
  x: number
  y: number
}

export interface Character {
  type: CharacterType
  position: Position
  direction: Direction
  asleep?: boolean
  visible?: boolean
  name: string
  fallingAsleep?: boolean
  pixelX: number
  pixelY: number
  isMoving: boolean
  targetPixelX?: number
  targetPixelY?: number
  nextDirection?: Direction
  animationFrame: number
}

export interface Item {
  type: ItemType
  position: Position
  collected: boolean
  name: string
  description: string
  inventorySlot?: number // Add this property
}

export interface CollectibleItem {
  name: string
  description: string
  collected: boolean
  emoji: string
}
