"use client"

import { useState } from "react"
import Image from "next/image"
import type { Item, CollectibleItem, Character } from "./rpg-game"

interface InventoryProps {
  items: Item[]
  collectibles: CollectibleItem[]
  characters?: Character[] // Add characters prop
  onClose: () => void
}

export default function Inventory({ items, collectibles, characters, onClose }: InventoryProps) {
  const [hoveredItem, setHoveredItem] = useState<Item | CollectibleItem | null>(null)

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-3xl p-8 rounded-sm border-4 border-[#8b5a2b] shadow-2xl bg-[#f8f0dd] bg-opacity-95 relative overflow-hidden">
        {/* Paper texture overlay */}
        <div className="absolute inset-0 bg-[url('/aged-parchment.png')] opacity-10 pointer-events-none"></div>

        <div className="flex justify-between items-center mb-8 relative">
          <h2 className="text-2xl font-mono uppercase tracking-wide text-[#5c4033] border-b-2 border-[#8b5a2b] pb-1">
            Inventory
          </h2>
          <button
            onClick={onClose}
            className="bg-[#e6d2b3] hover:bg-[#d9c4a3] p-2 rounded-sm border-2 border-[#8b5a2b] transition-colors"
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
              className="text-[#5c4033]"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Items section */}
        <div className="mb-8 relative">
          <h3 className="text-xl font-mono uppercase tracking-wide mb-4 text-[#5c4033] border-b border-[#8b5a2b] inline-block">
            Items
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {Array(5)
              .fill(null)
              .map((_, index) => {
                // First check if there's an item specifically assigned to this slot
                const slottedItem = items.find((item) => item.collected && item.inventorySlot === index + 1)

                // If no slotted item, fall back to the old behavior
                const item =
                  slottedItem ||
                  (index === 2
                    ? // For slot 3 (index 2), prioritize collectibles
                      items.find((item) => item.type === "COLLECTIBLE" && item.collected)
                    : // For other slots, use the original logic
                      items.find((item, i) => item.collected && !item.inventorySlot && i === index))

                return (
                  <div
                    key={`item-${index}`}
                    className="bg-[#e6d2b3] border-2 border-[#8b5a2b] w-24 h-24 flex items-center justify-center relative rounded-sm shadow-md"
                    onMouseEnter={() => item && setHoveredItem(item)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {item && (
                      <div className="w-16 h-16 relative">
                        <Image
                          src={
                            item.type === "COLLECTIBLE"
                              ? getCollectibleImagePath(item.name)
                              : getItemImagePath(item.type) || "/placeholder.svg"
                          }
                          alt={item.name}
                          width={64}
                          height={64}
                          className="object-contain"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </div>

        {/* Collectibles section */}
        <div className="relative">
          <h3 className="text-xl font-mono uppercase tracking-wide mb-4 text-[#5c4033] border-b border-[#8b5a2b] inline-block">
            Collectibles
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {Array(5)
              .fill(null)
              .map((_, index) => {
                const collectible = collectibles.find((item, i) => item.collected && i === index)
                return (
                  <div
                    key={`collectible-${index}`}
                    className="bg-[#e6d2b3] border-2 border-[#8b5a2b] w-24 h-24 flex items-center justify-center relative rounded-sm shadow-md"
                    onMouseEnter={() => collectible && setHoveredItem(collectible)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {collectible && (
                      <div className="w-16 h-16 relative">
                        <Image
                          src={getCollectibleImagePath(collectible.name) || "/placeholder.svg"}
                          alt={collectible.name}
                          width={64}
                          height={64}
                          className="object-contain"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </div>

        {/* Mocha section - show when in inventory */}
        {characters && characters.some((char) => char.type === "HAMSTER" && char.inInventory) && (
          <div className="mt-8 border-t-2 border-[#8b5a2b] pt-4 relative">
            <h3 className="text-xl font-mono uppercase tracking-wide mb-4 text-[#5c4033] border-b border-[#8b5a2b] inline-block">
              Partner
            </h3>
            <div className="flex items-center bg-[#e6d2b3] border-2 border-[#8b5a2b] p-4 rounded-sm shadow-md">
              <div className="w-16 h-16 relative mr-4">
                <Image
                  src="/images/Mocha_right_standing.png"
                  alt="Mocha"
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
              <div>
                <div className="font-mono uppercase tracking-wide font-bold text-[#5c4033]">Mocha</div>
                <div className="text-sm text-[#5c4033] font-mono">Your partner in crime, hiding in your bag.</div>
              </div>
            </div>
          </div>
        )}

        {/* Item description tooltip */}
        {hoveredItem && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-[#f8f0dd] text-[#5c4033] p-4 rounded-sm border-2 border-[#8b5a2b] shadow-lg max-w-md">
            <h4 className="font-mono uppercase tracking-wide font-bold mb-1 border-b border-[#8b5a2b]">
              {hoveredItem.name}
            </h4>
            <p className="font-mono text-sm leading-relaxed">{hoveredItem.description}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Update the getItemImagePath function to handle the matchbox items
function getItemImagePath(type: string): string {
  switch (type) {
    case "ID_CARD":
      return "/images/bull-id.png"
    case "BULL_COSTUME":
      return "/images/bull-costume-new.png"
    case "CORN":
      return "/images/corn_new.png"
    case "COLLECTIBLE":
      // For collectibles, we'll handle this in a separate function
      return "/images/matchboxes/gratitude_matchbox.png" // Default to gratitude matchbox
    default:
      return "/placeholder.svg"
  }
}

// Add a new function to get collectible image paths
function getCollectibleImagePath(name: string): string {
  // First check for matchboxes with specific naming patterns
  if (name === "Gratitude Rock") {
    return "/images/matchboxes/gratitude_matchbox.png"
  } else if (name.includes("Attention Management")) {
    return "/images/matchboxes/attention_management_matchbox.png"
  } else if (name.includes("Check In With Yourself")) {
    return "/images/matchboxes/check_in_with_yourself_matchbox.png"
  } else if (name.includes("Sit With Your Feelings")) {
    return "/images/matchboxes/sit_with_your_feelings_matchbox.png"
  } else if (name.includes("Let Your Mind Wander")) {
    return "/images/matchboxes/let_your_mind_wander_matchbox.png"
  }

  // Original collectibles
  switch (name) {
    case "Pocket Timer":
      return "/images/pocket-timer.png"
    case "Hourglass":
      return "/images/hourglass.png"
    case "Daily To-Do Lists":
      return "/images/to-do-list.png"
    case "No Meetings Postcard":
      return "/images/postcard.png"
    case "Later Stamp":
      return "/images/stamp.png"
    default:
      return "/placeholder.svg"
  }
}
