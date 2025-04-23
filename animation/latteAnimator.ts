import type { Direction, Character } from "../components/rpg-game"

// Animation lock mode - set to true to ensure animation logic is not modified
export const ANIMATION_LOCK_MODE = true

// Define the AnimationState interface
export interface AnimationState {
  direction: Direction
  isMoving: boolean
  walkDistance: number
  spriteKey: string
}

// Function to initialize the animation state
export function initAnimationState(character: Character, overrideType = "NONE"): AnimationState {
  return {
    direction: character.direction,
    isMoving: character.isMoving,
    walkDistance: 0,
    spriteKey: getLatteAnimationFrame(character.direction, character.isMoving, 0),
  }
}

// Function to update the animation state based on character movement
export function updateAnimationState(
  character: Character,
  prevPosition: { pixelX: number; pixelY: number },
  animState: AnimationState,
): AnimationState {
  // Calculate distance moved
  const distanceX = Math.abs(character.pixelX - prevPosition.pixelX)
  const distanceY = Math.abs(character.pixelY - prevPosition.pixelY)
  const distance = distanceX + distanceY // Simple 1D distance

  // Update walk distance
  const newWalkDistance = animState.walkDistance + distance

  // Get the new sprite key
  const newSpriteKey = getLatteAnimationFrame(character.direction, character.isMoving, newWalkDistance)

  return {
    direction: character.direction,
    isMoving: character.isMoving,
    walkDistance: newWalkDistance,
    spriteKey: newSpriteKey,
  }
}

// Animation constants - these values are carefully tuned for smooth animation
const WALK_CYCLE_PIXELS = 32 // One full walk cycle completes every 32 pixels
const WALK_FRAME_SWITCH = 16 // Switch animation frame halfway through cycle

/**
 * Get the appropriate sprite key for Latte based on direction, movement state, and walk distance
 * This is the core animation logic that ensures smooth, consistent walking animations
 */
export function getLatteAnimationFrame(direction: Direction, isMoving: boolean, walkDistance: number): string {
  // If not moving, use standing sprite
  if (!isMoving) {
    switch (direction) {
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

  // Calculate which walking frame to use based on distance traveled
  // This ensures animation is tied to actual movement, not frame rate
  const stridePhase = Math.floor((walkDistance % WALK_CYCLE_PIXELS) / WALK_FRAME_SWITCH)
  const walkFrame = stridePhase + 1 // Either 1 or 2

  // Return the appropriate walking frame based on direction
  switch (direction) {
    case "left":
      return `bearLeftWalk${walkFrame}`
    case "right":
      return `bearRightWalk${walkFrame}`
    case "up":
      return `bearUpWalk${walkFrame}`
    case "down":
      return `bearDownWalk${walkFrame}`
  }
}

export const getLatteSpriteFrame = getLatteAnimationFrame

export function getCurrentSpriteInfo() {
  return "stub"
}
