import GameEngine from "@/components/game-engine"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-0 bg-amber-800 overflow-hidden">
      <GameEngine />
    </main>
  )
}
