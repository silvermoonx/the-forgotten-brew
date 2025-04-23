"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

// Update the props interface to remove the remainingTries prop
interface ComputerScreenViewProps {
  onClose: () => void
  onSuccess?: () => void
  showDebug?: boolean
}

// Update the component to remove the tries limit
export default function ComputerScreenView({ onClose, onSuccess, showDebug = false }: ComputerScreenViewProps) {
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lastAttempt, setLastAttempt] = useState("")

  // Add state for hint visibility
  const [showHint, setShowHint] = useState(false)

  // Add code to reset the password field when the component mounts
  useEffect(() => {
    // Clear password field when component mounts
    setPassword("")
    setMessage("")
    setShowSuccess(false)
    setAttempts(0)
    setLastAttempt("")
    setShowHint(false)
  }, [])

  // Change the correct password to 524891
  const correctPassword = "524891"

  // Add keyboard handler for ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault() // Prevent the event from bubbling up
        e.stopPropagation() // Stop propagation to parent elements
        onClose()
      }
      if (e.key === "Enter" && password) {
        e.preventDefault() // Prevent the event from bubbling up
        e.stopPropagation() // Stop propagation to parent elements
        handleSubmit()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose, password])

  // Update the handleSubmit function to allow infinite attempts
  const handleSubmit = () => {
    setAttempts((prev) => prev + 1)
    setLastAttempt(password)

    if (password === correctPassword) {
      setMessage("Access Granted! Vault Override Successful.")
      setShowSuccess(true)

      // Call onSuccess after a short delay
      setTimeout(() => {
        if (onSuccess) onSuccess()
        onClose()
      }, 2000)
    } else {
      setMessage("Access Denied. Try again.")
      setTimeout(() => setMessage(""), 2000)
    }
  }

  // In the JSX, remove references to remainingTries
  return (
    <div
      className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50"
      onClick={(e) => {
        // Prevent clicks from bubbling to elements below
        e.stopPropagation()
      }}
    >
      <div className="relative bg-gray-800/95 border-4 border-gray-600 p-6 rounded-sm shadow-lg max-w-4xl w-full">
        {/* Debug info for computer screen */}
        {showDebug && (
          <div className="absolute top-4 left-4 bg-black/70 text-white p-2 rounded-md text-xs font-mono z-20">
            <h3 className="font-bold mb-1 text-yellow-300">Computer Debug</h3>
            <p>Current Input: {password}</p>
            <p>Input Length: {password.length}</p>
            <p>Correct Password: {correctPassword}</p>
            <p>Attempts: {attempts}</p>
            <p>Last Attempt: {lastAttempt || "None"}</p>
            <p>Success: {showSuccess ? "Yes" : "No"}</p>
            <p>Message: {message || "None"}</p>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation() // Prevent event bubbling
            onClose()
          }}
          className="absolute top-4 right-4 bg-gray-700 hover:bg-gray-600 p-2 rounded-sm border-2 border-gray-500 transition-colors z-10"
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
            className="text-gray-300"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <div className="relative w-full aspect-[16/9] border-2 border-gray-600 rounded-sm overflow-hidden bg-black">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/vault%20room%20computer%20screen-Y0sfOWpeQTb8cBwrDRtW105mEk9qQ0.png"
            alt="Computer Screen"
            fill
            className="object-contain"
            priority
          />

          {/* Modify the password input overlay to remove the tries counter */}
          <div className="absolute inset-0">
            <div className="absolute w-[20%] bg-[#c5e8e0]/80 backdrop-blur-sm p-3 rounded-sm top-[40%] left-[150px]">
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Password"
                className="w-full bg-[#d8f0e8] border-2 border-[#6a9e9a] p-2 text-[#2a5a58] font-mono text-lg text-center uppercase tracking-widest focus:outline-none focus:border-[#4a7e7a]"
                autoFocus
                disabled={showSuccess}
                onClick={(e) => e.stopPropagation()} // Prevent event bubbling
              />

              {/* Password hint button */}
              <div className="flex justify-center mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowHint(!showHint)
                  }}
                  className="text-white text-xs flex items-center bg-[#4a7e7a] hover:bg-[#3a6e6a] px-2 py-1 rounded-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <path d="M12 17h.01" />
                  </svg>
                  Password Hint
                </button>
              </div>

              {/* Password hint display */}
              {showHint && (
                <div className="absolute left-full top-0 ml-2 p-3 bg-black/80 text-green-400 text-xs font-mono rounded-sm max-w-[300px] overflow-auto shadow-lg border border-green-800 animate-fadeIn">
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-black/80"></div>
                  P = [(e^(ln(16)×√7) × 10^3) × (sin(π/6) + cos(π/4))^2 × 10^4] ÷ [√(2π×9) × (9/e)^9 ÷ 10 + 5000] -
                  260795
                </div>
              )}
            </div>

            {/* Message display */}
            {message && (
              <div
                className={`px-4 py-2 rounded-sm font-mono text-center ${
                  showSuccess ? "bg-green-500/80 text-white" : "bg-red-500/80 text-white"
                }`}
              >
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
