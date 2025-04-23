"use client"

import { useEffect } from "react"

interface FirstTimeModalProps {
  onClose: () => void
  onRefresh: () => void
  onContinue: () => void
}

export default function FirstTimeModal({ onClose, onRefresh, onContinue }: FirstTimeModalProps) {
  // Set up keyboard listeners for the modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  // Handle the "I Already Did" button click
  const handleContinue = () => {
    // Set localStorage to remember that assets are loaded
    localStorage.setItem("assetsLoaded", "true")
    onContinue()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#2A1A0A] border-4 border-[#8B5A2B] rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl transform transition-all">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-amber-200 mb-4">First time playing?</h2>
          <p className="text-amber-100 mb-6">
            To make sure all the game assets load properly, we recommend a quick refresh.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onRefresh}
              className="px-5 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-md font-medium transition-colors flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh Now
            </button>
            <button
              onClick={handleContinue}
              className="px-5 py-2 bg-green-700 hover:bg-green-600 text-white rounded-md font-medium transition-colors flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              I Already Did
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
