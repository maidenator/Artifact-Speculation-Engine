import { Listbox } from "@headlessui/react"
import type { ReactNode } from "react"

interface Option {
  label: ReactNode
  value: string | number | undefined
  icon?: string
}

interface GenshinSelectProps {
  value: string | number | undefined
  onChange: (value: string | number) => void
  options: Option[]
  maxHeight?: string
  theme?: "dark" | "light"
  className?: string
  buttonClassName?: string
}

export function GenshinSelect({ value, onChange, options, maxHeight = "220px", theme = "dark", className = "w-full", buttonClassName = "h-[44px]" }: GenshinSelectProps) {
  const selectedOption = options.find((opt) => opt.value === value) || options[0]

  const isLight = theme === "light"

  return (
    <Listbox value={value} onChange={onChange}>
      <div className={`relative ${className}`}>
        <Listbox.Button 
          className={`font-genshin w-full flex items-center justify-between border rounded-md px-3 cursor-pointer text-left text-[0.85rem] focus:outline-none focus-visible:ring-2 ${buttonClassName} ${
            isLight 
              ? "bg-black/5 border-[#495366]/20 text-[#495366] focus-visible:ring-[#b85b2e]/50 hover:bg-black/10" 
              : "bg-[var(--input-bg,rgba(15,23,42,0.6))] border-white/15 text-inherit focus-visible:ring-gold/50"
          }`}
        >
          {({ open }) => (
            <>
              <div className="flex items-center gap-2 min-w-0 w-full h-full">
                {selectedOption.icon && <img src={selectedOption.icon} alt="" className="w-5 h-5 shrink-0" />}
                <div className="truncate flex items-center justify-center flex-1 h-full">{selectedOption.label}</div>
              </div>
              <span className={`text-[0.8em] transition-transform duration-200 ml-1 ${open ? "rotate-180" : ""} ${isLight ? "text-[#495366]/60" : "opacity-80"}`}>
                {isLight ? "▼" : "▼"}
              </span>
            </>
          )}
        </Listbox.Button>

        <Listbox.Options
          className={`font-genshin absolute top-full left-0 w-full mt-1 overflow-y-auto z-[9999] border rounded-md shadow-[0_10px_25px_rgba(0,0,0,0.5)] text-[0.80rem] focus:outline-none ${
            isLight ? "bg-[#e9e5dc] border-[#495366]/20 text-[#495366]" : "bg-[#0f172a] border-white/15"
          }`}
          style={{ maxHeight, scrollbarWidth: "thin" }}
        >
          {options.map((opt) => (
            <Listbox.Option
              key={String(opt.value)}
              value={opt.value}
              className={({ active, selected }) =>
                `flex items-center gap-2 px-3 py-2.5 cursor-pointer border-b transition-colors focus:outline-none ${
                  isLight ? "border-[#495366]/10" : "border-white/5"
                } ${
                  selected 
                    ? (isLight ? "bg-[#b85b2e]/10 text-[#b85b2e]" : "bg-[rgba(245,158,11,0.15)] text-[var(--gold,#f59e0b)]")
                    : active 
                    ? (isLight ? "bg-black/5" : "bg-white/10")
                    : (isLight ? "hover:bg-black/5" : "hover:bg-white/5")
                }`
              }
            >
              {opt.icon && <img src={opt.icon} alt="" className="w-5 h-5" />}
              <span className="truncate">{opt.label}</span>
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  )
}