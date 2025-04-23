// Animation system tests
// Run these tests to ensure animation logic remains consistent

import { getLatteSpriteFrame, initAnimationState, updateAnimationState } from "./latteAnimator"
import type { Character } from "../components/rpg-game"
import { describe, expect, test } from "vitest"

// Mock character for testing
const mockCharacter: Character = {
  type: "BEAR",
  position: { x: 10, y: 1 },
  direction: "right",
  visible: true,
  name: "Latte",
  pixelX: 320, // 10 * 32
  pixelY: 32, // 1 * 32
  isMoving: true,
  animationFrame: 0,
}

describe("Latte Animation System", () => {
  test("Standing frames are correct", () => {
    expect(getLatteSpriteFrame("up", false, 0)).toBe("latte_up_standing")
    expect(getLatteSpriteFrame("down", false, 15)).toBe("latte_down_standing")
    expect(getLatteSpriteFrame("left", false, 31)).toBe("latte_left_standing")
    expect(getLatteSpriteFrame("right", false, 100)).toBe("latte_right_standing")
  })

  test("Walking frames sync with 32px cycles", () => {
    // First half of cycle - walking1
    expect(getLatteSpriteFrame("right", true, 0)).toBe("latte_right_walking1")
    expect(getLatteSpriteFrame("right", true, 15)).toBe("latte_right_walking1")

    // Second half of cycle - walking2
    expect(getLatteSpriteFrame("right", true, 16)).toBe("latte_right_walking2")
    expect(getLatteSpriteFrame("right", true, 31)).toBe("latte_right_walking2")

    // Cycle repeats
    expect(getLatteSpriteFrame("right", true, 32)).toBe("latte_right_walking1")
    expect(getLatteSpriteFrame("right", true, 48)).toBe("latte_right_walking2")
  })

  test("Animation state updates correctly with movement", () => {
    // Initialize animation state
    const animState = initAnimationState(mockCharacter)

    // Move character 5 pixels to the right
    const newCharacter = {
      ...mockCharacter,
      pixelX: mockCharacter.pixelX + 5,
    }

    // Update animation state
    const newAnimState = updateAnimationState(
      newCharacter,
      { pixelX: mockCharacter.pixelX, pixelY: mockCharacter.pixelY },
      animState,
    )

    // Walk distance should increase by 5
    expect(newAnimState.walkDistance).toBe(5)

    // Move another 11 pixels (total 16)
    const newerCharacter = {
      ...newCharacter,
      pixelX: newCharacter.pixelX + 11,
    }

    // Update animation state again
    const newerAnimState = updateAnimationState(
      newerCharacter,
      { pixelX: newCharacter.pixelX, pixelY: newCharacter.pixelY },
      newAnimState,
    )

    // Walk distance should now be 16, which should trigger frame switch
    expect(newerAnimState.walkDistance).toBe(16)

    // Frame should now be walking2
    const frame = getLatteSpriteFrame(newerAnimState.direction, newerAnimState.isMoving, newerAnimState.walkDistance)
    expect(frame).toBe("latte_right_walking2")
  })
})
