"use client"

import type React from "react"

import { useState } from "react"
import { X, Copy, Share2, Brain, Clock, Users, Dumbbell } from "lucide-react"

interface QuestSelectionUIProps {
  onClose: () => void
}

interface QuestType {
  id: string
  name: string
  icon: React.ReactNode
  color: string
}

interface Quest {
  id: string
  title: string
  description: string
  reward: string
  type: string
}

export default function QuestSelectionUI({ onClose }: QuestSelectionUIProps) {
  const [activeTab, setActiveTab] = useState("social")
  const [walletConnected, setWalletConnected] = useState(false)
  const [referralCode] = useState("BREW1337")
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)

  const questTypes: QuestType[] = [
    { id: "social", name: "Social Wealth", icon: <Users size={18} />, color: "bg-blue-500" },
    { id: "physical", name: "Physical Wealth", icon: <Dumbbell size={18} />, color: "bg-green-500" },
    { id: "mental", name: "Mental Wealth", icon: <Brain size={18} />, color: "bg-purple-500" },
    { id: "time", name: "Time Wealth", icon: <Clock size={18} />, color: "bg-amber-500" },
  ]

  const quests: Record<string, Quest[]> = {
    social: [
      {
        id: "social-1",
        title: "Complete the Game",
        description: "Finish the game to receive a Soulbound Token that proves your journey.",
        reward: "Soulbound Token",
        type: "social",
      },
      {
        id: "social-2",
        title: "Refer 5 Friends to Complete the Game",
        description: "Share your referral code with 5 friends who complete the game.",
        reward: "1000 $GRIND",
        type: "social",
      },
      {
        id: "social-3",
        title: "Refer 10 Friends to MakingCoffee.com",
        description: "Share your referral code with 10 friends who buy coffee from makingcoffee.com.",
        reward: "1000 $GRIND",
        type: "social",
      },
      {
        id: "social-4",
        title: "Refer 15 Friends to MakingCoffee.com",
        description: "Share your referral code with 15 friends who buy coffee from makingcoffee.com.",
        reward: "Abstract XP & Badge",
        type: "social",
      },
    ],
    physical: [
      {
        id: "physical-1",
        title: "Join Grind Together",
        description: "Join the community fitness challenge and track your progress.",
        reward: "$GRIND Allocation",
        type: "physical",
      },
    ],
    mental: [
      {
        id: "mental-1",
        title: "Buy a Coffee, Support a Farmer",
        description:
          "When you buy a friend coffee from makingcoffee.com, $GRIND is allocated to a real-world fund supporting the farmers behind your favourite brew.",
        reward: "$GRIND Allocation + Abstract XP",
        type: "mental",
      },
    ],
    time: [
      {
        id: "time-1",
        title: "Create AI Artwork",
        description: "Generate an AI image featuring Bearish and $GRIND IP that represents time wealth.",
        reward: "$GRIND Allocation + Abstract XP",
        type: "time",
      },
    ],
  }

  const handleCopyReferralCode = () => {
    navigator.clipboard.writeText(referralCode)
    setCopiedToClipboard(true)
    setTimeout(() => setCopiedToClipboard(false), 2000)
  }

  const handleConnectWallet = () => {
    // In a real implementation, this would connect to MetaMask or WalletConnect
    setWalletConnected(true)
  }

  const handleStartQuest = (questId: string) => {
    // In a real implementation, this would start the quest
    console.log(`Starting quest: ${questId}`)
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-orange-500/50 rounded-md max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-mono text-orange-400 tracking-wide">CHOOSE YOUR PATH TO WEALTH</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 px-2">
          {questTypes.map((type) => (
            <button
              key={type.id}
              className={`flex items-center gap-2 px-4 py-3 font-mono text-sm transition-colors ${
                activeTab === type.id
                  ? `text-white border-b-2 ${type.color.replace("bg-", "border-")}`
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setActiveTab(type.id)}
            >
              {type.icon}
              {type.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quests[activeTab].map((quest) => (
              <div
                key={quest.id}
                className="bg-gray-800 border border-gray-700 rounded-md p-4 hover:border-orange-500/50 transition-colors"
              >
                <h3 className="text-lg font-mono text-white mb-2">{quest.title}</h3>
                <p className="text-gray-300 text-sm mb-4">{quest.description}</p>
                <div className="flex justify-between items-center">
                  <div className="bg-gray-900 px-3 py-1 rounded-full text-xs font-mono text-orange-400">
                    Reward: {quest.reward}
                  </div>
                  <button
                    onClick={() => handleStartQuest(quest.id)}
                    disabled={!walletConnected}
                    className={`px-3 py-1 rounded-md text-xs font-mono ${
                      walletConnected
                        ? "bg-orange-500 text-white hover:bg-orange-600"
                        : "bg-gray-700 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Begin Quest
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Wallet Connection */}
            <div>
              {!walletConnected ? (
                <button
                  onClick={handleConnectWallet}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-mono text-sm transition-colors"
                >
                  Connect Wallet
                </button>
              ) : (
                <div className="bg-gray-800 px-4 py-2 rounded-md font-mono text-sm text-green-400">
                  Wallet Connected
                </div>
              )}
            </div>

            {/* Referral Code */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-mono text-sm">Your Code:</span>
              <div className="bg-gray-800 px-3 py-1 rounded-md font-mono text-orange-400">{referralCode}</div>
              <button
                onClick={handleCopyReferralCode}
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors relative"
              >
                <Copy size={16} />
                {copiedToClipboard && (
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded">
                    Copied!
                  </span>
                )}
              </button>
              <button className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors">
                <Share2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
