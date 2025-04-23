interface KeyIndicatorProps {
  keyLabel: string
  text: string
}

export default function KeyIndicator({ keyLabel, text }: KeyIndicatorProps) {
  return (
    <div className="flex items-center bg-[#f8f0dd]/90 backdrop-blur-sm border-2 border-[#8b5a2b] text-[#5c4033] px-2 py-1 rounded-sm text-sm shadow-md">
      <span className="bg-[#e6d2b3] px-1 rounded-sm mr-1 font-mono border border-[#8b5a2b] uppercase">{keyLabel}</span>
      <span className="font-mono tracking-wide uppercase text-xs">{text}</span>
    </div>
  )
}
