"use client"

import { useState, useEffect, useRef, type KeyboardEvent } from "react"

interface CodeEntryPadProps {
  onCodeComplete?: (code: string) => void
}

export default function CodeEntryPad({ onCodeComplete }: CodeEntryPadProps) {
  const [code, setCode] = useState<string[]>(["", "", "", ""])
  const [activeIndex, setActiveIndex] = useState(0)
  const [incorrectSubmission, setIncorrectSubmission] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus the hidden input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Handle keyboard input
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Only allow numbers
    if (/^[0-9]$/.test(e.key)) {
      // Update the current digit
      const newCode = [...code]
      newCode[activeIndex] = e.key
      setCode(newCode)

      // Move to next slot if not at the end
      if (activeIndex < 3) {
        setActiveIndex(activeIndex + 1)
      } else {
        // Code is complete, trigger callback
        const fullCode = newCode.join("")
        onCodeComplete?.(fullCode)
      }
    }
    // Handle backspace
    else if (e.key === "Backspace") {
      const newCode = [...code]

      // If current slot is empty, move back and clear previous slot
      if (code[activeIndex] === "" && activeIndex > 0) {
        newCode[activeIndex - 1] = ""
        setActiveIndex(activeIndex - 1)
      } else {
        // Clear current slot
        newCode[activeIndex] = ""
      }

      setCode(newCode)
    }
    // Handle arrow keys for navigation
    else if (e.key === "ArrowLeft" && activeIndex > 0) {
      setActiveIndex(activeIndex - 1)
    } else if (e.key === "ArrowRight" && activeIndex < 3) {
      setActiveIndex(activeIndex + 1)
    }
    // Handle Enter key to submit code if all digits are filled
    else if (e.key === "Enter") {
      if (code.every((digit) => digit !== "")) {
        const fullCode = code.join("")
        onCodeComplete?.(fullCode)
      } else {
        // Flash red for incomplete code
        setIncorrectSubmission(true)
        setTimeout(() => setIncorrectSubmission(false), 500)
      }
    }

    // Prevent default behavior for all keys to avoid unwanted browser actions
    e.preventDefault()
  }

  // Focus the hidden input when clicked anywhere on the component
  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  // Handle clicking on a specific digit slot
  const handleDigitSlotClick = (index: number) => {
    setActiveIndex(index)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div className="flex flex-col items-center" onClick={handleContainerClick}>
      <div className="mb-6 text-lg font-mono text-gray-700">Enter Passcode</div>

      {/* Digit slots container */}
      <div className="code-entry">
        {code.map((digit, index) => (
          <div
            key={index}
            className={`
              digit-slot
              ${activeIndex === index ? "active" : ""}
              ${incorrectSubmission ? "incorrect" : ""}
            `}
            onClick={() => handleDigitSlotClick(index)}
          >
            {digit || ""}
          </div>
        ))}
      </div>

      {/* Hidden input to capture keyboard events */}
      <input
        ref={inputRef}
        type="text"
        className="opacity-0 absolute h-0 w-0"
        onKeyDown={handleKeyDown}
        autoComplete="off"
        aria-label="Enter 4-digit code"
      />

      {/* Visual keyboard hint */}
      <div className="text-sm text-gray-500 mt-6">Use keyboard to enter code</div>

      <style jsx>{`
        .code-entry {
          display: flex;
          justify-content: center;
          gap: 12px;
        }

        .digit-slot {
          width: 44px;
          height: 50px;
          border: 2px solid #888;
          font-size: 1.25rem;
          font-family: monospace;
          text-align: center;
          line-height: 50px;
          background-color: #fff;
          border-radius: 6px;
          transition: all 0.2s ease;
          user-select: none;
        }

        .digit-slot.active {
          border-color: #333;
          background-color: #eef;
          box-shadow: 0 0 0 2px rgba(0, 0, 255, 0.1);
        }

        .digit-slot.incorrect {
          background-color: #fee;
          border-color: #c00;
          animation: shake 0.4s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-4px); }
          40%, 80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  )
}
