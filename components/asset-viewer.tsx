"use client"

import { useState } from "react"
import Image from "next/image"

export default function AssetViewer() {
  const [loaded, setLoaded] = useState({
    left: false,
    right: false,
    up: false,
    down: false,
  })

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">Latte Character Assets</h2>

        <div className="grid grid-cols-2 gap-8">
          {/* Left Standing */}
          <div className="flex flex-col items-center">
            <div className="bg-gray-100 p-4 rounded-lg mb-2 w-32 h-32 flex items-center justify-center">
              <Image
                src="/images/latte_left_standing.png"
                alt="Latte facing left"
                width={96}
                height={96}
                onLoad={() => setLoaded((prev) => ({ ...prev, left: true }))}
              />
            </div>
            <p className="text-center font-mono text-sm">
              latte_left_standing.png
              {!loaded.left && <span className="block text-red-500">Loading...</span>}
            </p>
          </div>

          {/* Right Standing */}
          <div className="flex flex-col items-center">
            <div className="bg-gray-100 p-4 rounded-lg mb-2 w-32 h-32 flex items-center justify-center">
              <Image
                src="/images/latte_right_standing.png"
                alt="Latte facing right"
                width={96}
                height={96}
                onLoad={() => setLoaded((prev) => ({ ...prev, right: true }))}
              />
            </div>
            <p className="text-center font-mono text-sm">
              latte_right_standing.png
              {!loaded.right && <span className="block text-red-500">Loading...</span>}
            </p>
          </div>

          {/* Up Standing */}
          <div className="flex flex-col items-center">
            <div className="bg-gray-100 p-4 rounded-lg mb-2 w-32 h-32 flex items-center justify-center">
              <Image
                src="/images/latte_up_standing.png"
                alt="Latte facing up"
                width={96}
                height={96}
                onLoad={() => setLoaded((prev) => ({ ...prev, up: true }))}
              />
            </div>
            <p className="text-center font-mono text-sm">
              latte_up_standing.png
              {!loaded.up && <span className="block text-red-500">Loading...</span>}
            </p>
          </div>

          {/* Down Standing */}
          <div className="flex flex-col items-center">
            <div className="bg-gray-100 p-4 rounded-lg mb-2 w-32 h-32 flex items-center justify-center">
              <Image
                src="/images/latte_down_standing.png"
                alt="Latte facing down"
                width={96}
                height={96}
                onLoad={() => setLoaded((prev) => ({ ...prev, down: true }))}
              />
            </div>
            <p className="text-center font-mono text-sm">
              latte_down_standing.png
              {!loaded.down && <span className="block text-red-500">Loading...</span>}
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            These are the standing sprites for Latte in all four directions.
            <br />
            The game also has walking animation frames for each direction.
          </p>
        </div>
      </div>
    </div>
  )
}
