"use client"

interface DevRoomSelectorProps {
  onSelectRoom: (room: string) => void
}

export default function DevRoomSelector({ onSelectRoom }: DevRoomSelectorProps) {
  return (
    <div className="absolute inset-0 bg-[#f8f0dd] flex flex-col items-center justify-center relative">
      <div className="absolute inset-0 bg-[url('/aged-parchment.png')] opacity-10 pointer-events-none"></div>
      <div className="max-w-md w-full p-8 border-4 border-[#8b5a2b] rounded-sm shadow-lg bg-[#f8f0dd]/95 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/aged-parchment.png')] opacity-10 pointer-events-none"></div>
        <h2 className="text-2xl font-mono uppercase tracking-wide mb-6 text-[#5c4033] text-center border-b-2 border-[#8b5a2b] pb-2">
          Development Room Selector
        </h2>
        <p className="text-[#5c4033] mb-6 text-center text-sm italic font-mono">
          This menu is for development purposes only and will be removed in the final version.
        </p>

        <div className="grid gap-4">
          <button
            onClick={() => onSelectRoom("INTRO")}
            className="bg-[#e6d2b3] hover:bg-[#d9c4a3] active:bg-[#c8b393] text-[#5c4033] py-3 px-4 rounded-sm border-2 border-[#8b5a2b] transition-colors font-mono uppercase tracking-wide"
          >
            Start Normal Game
          </button>

          <button
            onClick={() => onSelectRoom("ROOM0")}
            className="bg-[#e6d2b3] hover:bg-[#d9c4a3] active:bg-[#c8b393] text-[#5c4033] py-3 px-4 rounded-sm border-2 border-[#8b5a2b] transition-colors font-mono uppercase tracking-wide"
          >
            Grid Test Area
          </button>

          <button
            onClick={() => onSelectRoom("PLAYING")}
            className="bg-[#e6d2b3] hover:bg-[#d9c4a3] active:bg-[#c8b393] text-[#5c4033] py-3 px-4 rounded-sm border-2 border-[#8b5a2b] transition-colors font-mono uppercase tracking-wide"
          >
            Main World
          </button>

          <button
            onClick={() => onSelectRoom("ROOM2")}
            className="bg-[#e6d2b3] hover:bg-[#d9c4a3] active:bg-[#c8b393] text-[#5c4033] py-3 px-4 rounded-sm border-2 border-[#8b5a2b] transition-colors font-mono uppercase tracking-wide"
          >
            Bull.SH Coffee HQ
          </button>

          <button
            onClick={() => onSelectRoom("ROOM3")}
            className="bg-[#e6d2b3] hover:bg-[#d9c4a3] active:bg-[#c8b393] text-[#5c4033] py-3 px-4 rounded-sm border-2 border-[#8b5a2b] transition-colors font-mono uppercase tracking-wide"
          >
            Vault Room
          </button>

          <button
            onClick={() => onSelectRoom("ROOM4")}
            className="bg-[#e6d2b3] hover:bg-[#d9c4a3] active:bg-[#c8b393] text-[#5c4033] py-3 px-4 rounded-sm border-2 border-[#8b5a2b] transition-colors font-mono uppercase tracking-wide"
          >
            Ventilation Maze
          </button>

          <button
            onClick={() => onSelectRoom("ROOM5")}
            className="bg-[#e6d2b3] hover:bg-[#d9c4a3] active:bg-[#c8b393] text-[#5c4033] py-3 px-4 rounded-sm border-2 border-[#8b5a2b] transition-colors font-mono uppercase tracking-wide"
          >
            Secret Chamber
          </button>

          <div className="border-t-2 border-[#8b5a2b] my-4"></div>

          <button
            onClick={() => onSelectRoom("COLLECTIBLE_SELECTION")}
            className="bg-[#e6d2b3] hover:bg-[#d9c4a3] active:bg-[#c8b393] text-[#5c4033] py-2 px-4 rounded-sm border-2 border-[#8b5a2b] transition-colors font-mono uppercase tracking-wide"
          >
            Test Collectible Selection
          </button>
        </div>
      </div>
    </div>
  )
}
