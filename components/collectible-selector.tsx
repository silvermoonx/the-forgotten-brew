"use client"

import { useState } from "react"
import Image from "next/image"
import type { CollectibleItem } from "./rpg-game"

interface CollectibleSelectorProps {
  collectibles: CollectibleItem[]
  onSelect: (collectibleName: string) => void
}

export default function CollectibleSelector({ collectibles, onSelect }: CollectibleSelectorProps) {
  const [hoveredItem, setHoveredItem] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)

  const handleSelect = (name) => {
    setSelectedItem(name)
  }

  const handleConfirm = () => {
    if (selectedItem) {
      onSelect(selectedItem)
    }
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#f8f0dd]/95 border-4 border-[#8b5a2b] p-6 rounded-sm shadow-lg max-w-3xl w-full relative overflow-hidden">
        {/* Paper texture overlay */}
        <div className="absolute inset-0 bg-[url('/aged-parchment.png')] opacity-10 pointer-events-none"></div>

        <h2 className="text-2xl font-mono uppercase tracking-wide mb-4 text-[#5c4033] text-center border-b-2 border-[#8b5a2b] pb-2">
          {collectibles[0]?.name?.includes("Yoga") || collectibles[0]?.name?.includes("Running")
            ? "Choose a Physical Wealth Item"
            : collectibles[0]?.name?.includes("Gratitude") || collectibles[0]?.name?.includes("Mind")
              ? "Choose a Mental Wealth Matchbox"
              : "Choose a Collectible Item"}
        </h2>
        <p className="text-[#5c4033] mb-6 text-center font-mono text-sm">Select one item to add to your inventory.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {collectibles.map((item) => (
            <div
              key={item.name}
              className={`relative flex flex-col items-center p-4 rounded-sm transition-all cursor-pointer ${
                selectedItem === item.name
                  ? "bg-[#e6d2b3] border-2 border-[#8b5a2b] shadow-md transform scale-105"
                  : hoveredItem === item.name
                    ? "bg-[#e6d2b3] border-2 border-[#8b5a2b]/50 shadow-sm"
                    : "bg-[#e6d2b3] hover:bg-[#d9c4a3] border-2 border-transparent hover:border-[#8b5a2b]"
              }`}
              onMouseEnter={() => setHoveredItem(item.name)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => handleSelect(item.name)}
            >
              <div className="w-full h-32 relative mb-2 flex items-center justify-center">
                <Image
                  src={getImagePath(item.name) || "/placeholder.svg"}
                  alt={item.name}
                  width={180}
                  height={100}
                  className="object-contain"
                />
              </div>
              <span className="text-[#5c4033] text-sm font-mono uppercase tracking-wide text-center">{item.name}</span>
              {selectedItem === item.name && (
                <div className="absolute -top-2 -right-2 bg-[#8b5a2b] text-white rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Description box */}
        <div className="bg-[#f8f0dd] border-2 border-[#8b5a2b] p-4 rounded-sm min-h-[80px] mb-6 shadow-inner relative">
          <div className="absolute inset-0 bg-[url('/aged-parchment.png')] opacity-5 pointer-events-none"></div>
          {hoveredItem ? (
            <p className="text-[#5c4033] font-mono text-sm leading-relaxed">
              {collectibles.find((item) => item.name === hoveredItem)?.description || ""}
            </p>
          ) : selectedItem ? (
            <p className="text-[#5c4033] font-mono text-sm leading-relaxed">
              {collectibles.find((item) => item.name === selectedItem)?.description || ""}
            </p>
          ) : (
            <p className="text-[#5c4033] text-center italic font-mono text-sm">
              Hover over an item to see its description
            </p>
          )}
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleConfirm}
            disabled={!selectedItem}
            className={`px-8 py-3 rounded-sm font-mono uppercase tracking-wide transition-all duration-200 ${
              selectedItem
                ? "bg-[#8b5a2b] text-[#f8f0dd] hover:bg-[#7a4a24] border-2 border-[#8b5a2b] transform hover:scale-105 shadow-md"
                : "bg-gray-400 text-gray-200 cursor-not-allowed border-2 border-gray-400"
            }`}
          >
            {selectedItem ? "Confirm Selection" : "Select an Item"}
          </button>
        </div>
      </div>
    </div>
  )
}

// Update the getImagePath function to include the physical wealth collectibles
function getImagePath(name: string): string {
  // For the physical wealth collectibles
  if (name === "Golden Running Shoes") {
    return "/images/collectibles/golden_running_shoes.png"
  } else if (name === "Sunset Yoga Mat") {
    return "/images/collectibles/yoga_mat.png"
  } else if (name === "Heart Rate Monitor Watch") {
    return "/images/collectibles/heart_rate_monitor.png"
  } else if (name === "Sunshine Orb") {
    return "/images/collectibles/sunlight_orb.png"
  } else if (name === "Resistance Band Set") {
    return "/images/collectibles/resistance_bands.png"
  }

  // For the mental wealth matchbox items
  if (name === "Gratitude Rock") {
    return "/images/matchboxes/gratitude_matchbox.png"
  } else if (name === "Attention Management") {
    return "/images/matchboxes/attention_management_matchbox.png"
  } else if (name === "Check In With Yourself") {
    return "/images/matchboxes/check_in_with_yourself_matchbox.png"
  } else if (name === "Sit With Your Feelings") {
    return "/images/matchboxes/sit_with_your_feelings_matchbox.png"
  } else if (name === "Let Your Mind Wander") {
    return "/images/matchboxes/let_your_mind_wander_matchbox.png"
  }

  // Keep the original mappings for other items
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
