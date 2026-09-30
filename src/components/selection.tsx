import { Listbox } from "@headlessui/react"

interface Option {
  label: string
  value: string | number | undefined
  icon?: string
}

interface GenshinSelectProps {
  value: string | number | undefined
  onChange: (value: string | number) => void
  options: Option[]
  maxHeight?: string
}

export function GenshinSelect({ value, onChange, options, maxHeight = "220px" }: GenshinSelectProps) {
  const selectedOption = options.find((opt) => opt.value === value) || options[0]

  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative w-full">
        <Listbox.Button className="font-genshin w-full flex items-center justify-between bg-[var(--input-bg,rgba(15,23,42,0.6))] border border-white/15 rounded-md px-3 py-2 text-inherit cursor-pointer text-left text-[0.85rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50">
          {({ open }) => (
            <>
              <div className="flex items-center gap-2">
                {selectedOption.icon && <img src={selectedOption.icon} alt="" className="w-5 h-5" />}
                <span className="truncate">{selectedOption.label}</span>
              </div>
              <span className={`text-[0.8em] opacity-80 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▼</span>
            </>
          )}
        </Listbox.Button>

        <Listbox.Options
          className="font-genshin absolute top-full left-0 w-full mt-1 overflow-y-auto z-50 bg-[#0f172a] border border-white/15 rounded-md shadow-[0_10px_25px_rgba(0,0,0,0.5)] text-[0.80rem] focus:outline-none"
          style={{ maxHeight, scrollbarWidth: "thin" }}
        >
          {options.map((opt) => (
            <Listbox.Option
              key={String(opt.value)}
              value={opt.value}
              className={({ active, selected }) =>
                `flex items-center gap-2 px-3 py-2.5 cursor-pointer border-b border-white/5 transition-colors focus:outline-none ${
                  selected 
                    ? "bg-[rgba(245,158,11,0.15)] text-[var(--gold,#f59e0b)]" 
                    : active 
                    ? "bg-white/10" 
                    : "hover:bg-white/5"
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