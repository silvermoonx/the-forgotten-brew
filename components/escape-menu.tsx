"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface EscapeMenuProps {
  onResume: () => void
  onRestart: () => void
  onMainMenu: () => void
}

export default function EscapeMenu({ onResume, onRestart, onMainMenu }: EscapeMenuProps) {
  const [showJoke, setShowJoke] = useState(false)
  const joke =
    'A bear walks into a bar and says, "I\'ll have a gin and... tonic." The bartender asks, "Why the big pause?" The bear looks down at his hands and says, "I\'ve had them all my life."'

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#f8f0dd]/95 border-4 border-[#8b5a2b] p-6 rounded-sm shadow-lg max-w-md w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/aged-parchment.png')] opacity-10 pointer-events-none"></div>

        <h2 className="text-2xl font-mono uppercase tracking-wide mb-6 text-[#5c4033] text-center border-b-2 border-[#8b5a2b] pb-2">
          Game Paused
        </h2>

        <div className="flex flex-col gap-4 mb-6">
          <button
            onClick={onResume}
            className="bg-[#e6d2b3] hover:bg-[#d9c4a3] active:bg-[#c8b393] text-[#5c4033] py-3 px-4 rounded-sm border-2 border-[#8b5a2b] transition-colors font-mono uppercase tracking-wide"
          >
            Resume Game
          </button>

          <button
            onClick={onRestart}
            className="bg-[#e6d2b3] hover:bg-[#d9c4a3] active:bg-[#c8b393] text-[#5c4033] py-3 px-4 rounded-sm border-2 border-[#8b5a2b] transition-colors font-mono uppercase tracking-wide"
          >
            Restart Room
          </button>

          <button
            onClick={onMainMenu}
            className="bg-[#e6d2b3] hover:bg-[#d9c4a3] active:bg-[#c8b393] text-[#5c4033] py-3 px-4 rounded-sm border-2 border-[#8b5a2b] transition-colors font-mono uppercase tracking-wide"
          >
            Main Menu
          </button>

          <button
            onClick={() => setShowJoke(!showJoke)}
            className="bg-[#e6d2b3] hover:bg-[#d9c4a3] active:bg-[#c8b393] text-[#5c4033] py-3 px-4 rounded-sm border-2 border-[#8b5a2b] transition-colors font-mono uppercase tracking-wide"
          >
            {showJoke ? "Hide Joke" : "See a Joke"}
          </button>
        </div>

        <AnimatePresence>
          {showJoke && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#e6d2b3] border-2 border-[#8b5a2b] p-4 rounded-sm mb-4 overflow-hidden"
            >
              <p className="text-[#5c4033] font-mono text-sm leading-relaxed">{joke}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center text-xs text-[#8b5a2b] mt-4 font-mono">Press ESC again to resume game</div>
      </div>
    </div>
  )
}
