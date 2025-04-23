import type { Direction } from "../components/rpg-game"

// Constants
export const ANIMATION_LOCK_MODE = true // Set to true to use the new animation system

// Function to get the correct animation frame for Mocha
export function getMochaAnimationFrame(direction: Direction, isMoving: boolean, walkCounter: number): string {
  // Use the same animation logic as Latte for consistency
  // One full walk cycle completes every 32 pixels
  const WALK_CYCLE_PIXELS = 32
  const WALK_FRAME_SWITCH = 16

  // If not moving, use standing sprite
  if (!isMoving) {
    switch (direction) {
      case "left":
        return "hamsterLeft"
      case "right":
        return "hamsterRight"
      case "up":
        return "hamsterUp"
      case "down":
        return "hamsterDown"
    }
  }

  // Calculate which walking frame to use based on distance traveled
  // This ensures animation is tied to actual movement, not frame rate
  const stridePhase = Math.floor((walkCounter % WALK_CYCLE_PIXELS) / WALK_FRAME_SWITCH)
  const walkFrame = stridePhase + 1 // Either 1 or 2

  // Return the appropriate walking frame based on direction
  switch (direction) {
    case "left":
      return `hamsterLeftWalk${walkFrame}`
    case "right":
      return `hamsterRightWalk${walkFrame}`
    case "up":
      return `hamsterUpWalk${walkFrame}`
    case "down":
      return `hamsterDownWalk${walkFrame}`
  }
}

// Animation state interface for Mocha
export interface MochaAnimationState {
  direction: Direction
  isMoving: boolean
  walkDistance: number // Changed from walkCounter to walkDistance for consistency
}

// Initialize animation state
export function initMochaAnimationState(character: any): MochaAnimationState {
  return {
    direction: character.direction,
    isMoving: character.isMoving,
    walkDistance: 0,
  }
}

// Update animation state based on movement
export function updateMochaAnimationState(
  character: any,
  prevPosition: { pixelX: number; pixelY: number },
  currentState: MochaAnimationState,
): MochaAnimationState {
  // Calculate distance moved
  const dx = character.pixelX - prevPosition.pixelX
  const dy = character.pixelY - prevPosition.pixelY
  const distanceMoved = Math.sqrt(dx * dx + dy * dy)

  // Update walk distance based on distance moved
  const newWalkDistance = currentState.walkDistance + distanceMoved

  // Determine direction based on movement
  let newDirection = currentState.direction
  if (Math.abs(dx) > Math.abs(dy)) {
    newDirection = dx > 0 ? "right" : "left"
  } else if (Math.abs(dy) > 0) {
    newDirection = dy > 0 ? "up" : "down"
  }

  return {
    direction: newDirection,
    isMoving: character.isMoving,
    walkDistance: newWalkDistance,
  }
}
