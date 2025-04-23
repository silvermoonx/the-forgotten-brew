interface CoordinateGridProps {
  visible: boolean
}

export default function CoordinateGrid({ visible }: CoordinateGridProps) {
  if (!visible) return null

  return (
    <div className="absolute top-0 left-0 bg-black/70 text-white p-2 rounded-br-md text-xs font-mono">
      <h3 className="font-bold mb-1">Coordinate Grid (1,1 at bottom left)</h3>
      <div className="grid grid-cols-5 gap-1">
        {[9, 7, 5, 3, 1].map((y) => (
          <div key={`row-${y}`} className="flex items-center justify-between">
            <span className="mr-1">y={y}:</span>
            <div className="flex space-x-1">
              {[1, 5, 9, 13, 16].map((x) => (
                <span key={`${x},${y}`}>
                  ({x},{y})
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs">
        <p>Hedge: y=3, x=7-14</p>
        <p>Bulls: (5,5) and (7,5)</p>
        <p>Bear: (10,1)</p>
        <p>Hamster: (12,1)</p>
        <p>Items: Bull Costume (16,1), Corn (14,1)</p>
        <p>Fountain: (12-13, 4-5)</p>
        <p>Crates: (3,9), (3,8)</p>
        <p>Boxes: (15,8)</p>
        <p>Headquarters: (5-7, 6-9)</p>
      </div>
    </div>
  )
}
