"use client"

import { useState } from "react"
import CodeEntryPad from "./code-entry-pad"
import { toast } from "@/components/ui/use-toast"

interface IpadProps {
  onCorrectCode?: () => void
  onClose: () => void
  onIncorrectCode: () => void
}

export default function Ipad({ onCorrectCode, onClose, onIncorrectCode }: IpadProps) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const correctCode = "2477" // The correct code is 2477

  const handleCodeComplete = (code: string) => {
    console.log("Code entered:", code)

    if (code === correctCode) {
      console.log("Correct code entered!")
      setIsUnlocked(true)
      onCorrectCode?.()

      // Show success toast
      toast({
        title: "Access Granted",
        description: "The code was correct!",
        variant: "default",
      })
    } else {
      console.log("Incorrect code entered!")

      // Show error toast
      toast({
        title: "Access Denied",
        description: "Incorrect code entered.",
        variant: "destructive",
      })

      // Trigger bull suspicion immediately
      onIncorrectCode()

      // Close the modal immediately
      onClose()
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
        {/* iPad frame */}
        <div className="bg-black rounded-lg p-3">
          {/* iPad screen */}
          <div className="bg-gray-100 rounded-md p-6 min-h-[400px] flex flex-col items-center justify-center">
            {!isUnlocked ? (
              <div className="text-center">
                <div className="mb-8">
                  <div className="w-20 h-20 mx-auto bg-gray-300 rounded-full flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-10 w-10 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                </div>

                <CodeEntryPad onCodeComplete={handleCodeComplete} />
              </div>
            ) : (
              <div className="text-center">
                <div className="text-2xl font-bold mb-4">iPad Unlocked!</div>
                <div className="text-gray-600">You now have access to the device.</div>
                {/* Here you can add the content that appears after unlocking */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
