"use client"
import { useState } from "react"
import Ipad from "./ipad"
import TilePuzzle from "./tile-puzzle"

interface IpadModalProps {
  onClose: () => void
  onSuccess: () => void
  onFailure: () => void
}

export default function IpadModal({ onClose, onSuccess, onFailure }: IpadModalProps) {
  const [showPuzzle, setShowPuzzle] = useState(false)

  // Handle successful code entry
  const handleCodeSuccess = () => {
    // Show the puzzle instead of immediately calling onSuccess
    setShowPuzzle(true)
  }

  // Handle puzzle completion
  const handlePuzzleComplete = () => {
    console.log("Puzzle completed in IpadModal, calling onSuccess immediately")

    // Close the puzzle first to avoid any UI issues
    setShowPuzzle(false)

    // Add a small delay before calling onSuccess to ensure UI updates first
    setTimeout(() => {
      // Call the success callback with error handling
      try {
        if (onSuccess) {
          onSuccess()
        } else {
          console.error("onSuccess callback is undefined!")
          // If onSuccess is undefined, try to close the modal at least
          onClose()
        }
      } catch (error) {
        console.error("Error calling onSuccess:", error)
        // If there's an error, try to close the modal at least
        onClose()
      }
    }, 100)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
      {showPuzzle ? (
        <TilePuzzle
          onComplete={handlePuzzleComplete}
          onClose={() => {
            console.log("Closing puzzle")
            setShowPuzzle(false)
          }}
        />
      ) : (
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Security Access</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          <Ipad
            onCorrectCode={() => {
              console.log("Correct code entered, showing puzzle")
              handleCodeSuccess()
            }}
            onClose={onClose}
            onIncorrectCode={onFailure}
          />
        </div>
      )}
    </div>
  )
}
