interface PositionMetricProps {
  gridPosition: { x: number; y: number }
  pixelPosition: { x: number; y: number }
}

export default function PositionMetric({ gridPosition, pixelPosition }: PositionMetricProps) {
  return (
    <div className="absolute top-16 left-0 bg-black/70 text-white p-2 rounded-r-md text-xs font-mono">
      <h3 className="font-bold mb-1">Position Metrics</h3>
      <div className="grid grid-cols-2 gap-x-4">
        <div>
          <span className="text-green-400">Grid:</span> ({gridPosition.x}, {gridPosition.y})
        </div>
        <div>
          <span className="text-blue-400">Pixel:</span> ({pixelPosition.x}, {pixelPosition.y})
        </div>
      </div>
    </div>
  )
}
