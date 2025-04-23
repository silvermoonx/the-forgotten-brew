# 🐻☕ Latte Animation System

This directory contains the "Sacred File" for Latte's pixel-perfect walk animation in the BEAR RPG.

## 🛡️ Animation Lock Protocol

The animation logic in `latteAnimator.ts` is carefully tuned to provide smooth, consistent walking animations across all game conditions. This file is considered a "Sacred File" and should not be modified unless absolutely necessary.

### Key Features

- **Pixel-perfect movement**: Animation frames are synced to actual distance traveled, not frame rate
- **Consistent walk cycles**: One full walk cycle completes every 32 pixels
- **Direction-aware sprites**: Handles all four movement directions

### Usage

\`\`\`typescript
import { getLatteAnimationFrame, ANIMATION_LOCK_MODE } from "../animation/latteAnimator"

// Get the appropriate sprite key
const spriteKey = getLatteAnimationFrame(
  player.direction,
  player.isMoving,
  globalWalkCounter
)

// Use the sprite key to render the character
ctx.drawImage(assets[spriteKey].image, x, y, width, height)
\`\`\`

## ⚠️ Warning

Modifying the core animation logic may result in visual glitches such as:
- Frame skipping
- Animation stuttering
- Inconsistent walk cycles

Always test any changes thoroughly across all game conditions.
