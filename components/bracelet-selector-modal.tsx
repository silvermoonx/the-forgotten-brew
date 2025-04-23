"use client"

import { useState } from "react"
import Image from "next/image"

export interface Bracelet {
  id: string
  name: string
  description: string
  selected?: boolean
}

interface BraceletSelectorModalProps {
  bracelets: Bracelet[]
  onSelect: (bracelet: Bracelet) => void
  onClose: () => void
}

// Update the modal styling to match the game's UI system more closely
export default function BraceletSelectorModal({ bracelets, onSelect, onClose }: BraceletSelectorModalProps) {
  const [selectedBraceletId, setSelectedBraceletId] = useState<string | null>(null)

  const handleSelect = () => {
    console.log("Button clicked, selectedBraceletId:", selectedBraceletId)
    const selected = bracelets.find((b) => b.id === selectedBraceletId)
    console.log("Selected bracelet:", selected)
    if (selected) {
      console.log("Calling onSelect with:", selected)
      onSelect(selected)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
      <div className="bg-[#f8f0dd] border-4 border-[#8b5a2b] p-6 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden relative">
        {/* Paper texture overlay */}
        <div className="absolute inset-0 bg-[url('/aged-parchment.png')] opacity-10 pointer-events-none"></div>

        <div className="flex justify-between items-center mb-6 border-b-2 border-[#8b5a2b] pb-3">
          <h2 className="text-2xl font-bold text-[#5c4033]">Choose a Friendship Bracelet</h2>
          <button onClick={onClose} className="text-[#5c4033] hover:text-[#8b5a2b] transition-colors">
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
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <p className="text-[#5c4033] mb-6 font-mono">
          Select one friendship bracelet to add to your inventory. Choose carefully - you can only select one!
        </p>

        <div className="overflow-y-auto max-h-[45vh] pr-2 mb-8">
          <div className="grid grid-cols-1 gap-4">
            {bracelets.map((bracelet) => (
              <div
                key={bracelet.id}
                className={`
                  flex items-center p-4 rounded-lg cursor-pointer transition-all
                  ${
                    selectedBraceletId === bracelet.id
                      ? "bg-[#e6d2b3] border-2 border-[#8b5a2b]"
                      : "bg-[#f8f0dd] border-2 border-[#e6d2b3] hover:border-[#8b5a2b]/50"
                  }
                `}
                onClick={() => setSelectedBraceletId(bracelet.id)}
              >
                <div className="flex-shrink-0 w-24 h-24 mr-4 relative">
                  <Image
                    src={getBraceletImagePath(bracelet.id) || "/placeholder.svg"}
                    alt={bracelet.name}
                    width={96}
                    height={96}
                    className="object-contain"
                  />
                </div>

                <div className="flex-grow">
                  <h3 className="text-lg font-bold text-[#5c4033] mb-1 font-mono uppercase">{bracelet.name}</h3>
                  <p className="text-[#5c4033] text-sm font-mono">{bracelet.description}</p>
                </div>

                <div className="flex-shrink-0 ml-4">
                  <div
                    className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center
                    ${
                      selectedBraceletId === bracelet.id
                        ? "border-[#8b5a2b] bg-[#8b5a2b]"
                        : "border-[#8b5a2b] bg-transparent"
                    }
                  `}
                  >
                    {selectedBraceletId === bracelet.id && <div className="w-3 h-3 rounded-full bg-white"></div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center mt-12 mb-4 sticky bottom-0 bg-[#f8f0dd] pt-4 border-t border-[#8b5a2b]/30">
          <button
            onClick={handleSelect}
            disabled={!selectedBraceletId}
            className={`
              px-10 py-4 rounded-lg font-bold font-mono uppercase tracking-wide text-lg
              transition-all duration-200 transform
              ${
                selectedBraceletId
                  ? "bg-[#8b5a2b] text-white hover:bg-[#6d4522] hover:scale-105 shadow-lg"
                  : "bg-gray-400 text-gray-200 cursor-not-allowed"
              }
            `}
          >
            {selectedBraceletId ? "Add to Inventory" : "Select a Bracelet"}
          </button>
        </div>
      </div>
    </div>
  )
}

function getBraceletImagePath(id: string): string {
  switch (id) {
    case "growing":
      return "/images/bracelets/growing-together.png"
    case "space":
      return "/images/bracelets/dark-hour-friends.png"
    case "quality":
      return "/images/bracelets/quality-quantity.png"
    case "busy":
      return "/images/bracelets/never-too-busy.png"
    case "showedUp":
      return "/images/bracelets/showed-up.png"
    default:
      // Fallback to growing together if no match
      return "/images/bracelets/growing-together.png"
  }
}
