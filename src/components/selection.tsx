import { useState, useRef, useEffect } from "react"

interface Option {
  label: string
  value: string | number
  icon?: string
}

interface GenshinSelectProps {
  value: string | number
  onChange: (value: string | number) => void
  options: Option[]
  maxHeight?: string // <--- 1. Add this here
}

export function GenshinSelect({ value, onChange, options, maxHeight = "220px" }: GenshinSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value) || options[0]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="genshin-select-container" ref={dropdownRef} style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        className="font-genshin text-lg"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--input-bg, rgba(15, 23, 42, 0.6))",
          border: "1px solid var(--input-border, rgba(255, 255, 255, 0.15))",
          borderRadius: "6px",
          padding: "8px 12px",
          color: "inherit",
          cursor: "pointer",
          textAlign: "left"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {selectedOption.icon && <img src={selectedOption.icon} alt="" style={{ width: "20px", height: "20px" }} />}
          <span>{selectedOption.label}</span>
        </div>
        <span style={{ fontSize: "0.8em", opacity: 0.8, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
      </button>

      {isOpen && (
        <div
          className="font-genshin"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            width: "100%",
            marginTop: "4px",
            maxHeight: maxHeight,     // <--- 2. Use it here
            overflowY: "auto",      // <--- 3. Makes it scrollable
            zIndex: 50,
            background: "#0f172a",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "6px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            scrollbarWidth: "thin",
          }}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value)
                setIsOpen(false)
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 12px",
                cursor: "pointer",
                background: opt.value === value ? "rgba(245, 158, 11, 0.15)" : "transparent",
                color: opt.value === value ? "var(--gold, #f59e0b)" : "inherit",
                borderBottom: "1px solid rgba(255, 255, 255, 0.05)"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = opt.value === value ? "rgba(245, 158, 11, 0.15)" : "transparent")}
            >
              {opt.icon && <img src={opt.icon} alt="" style={{ width: "20px", height: "20px" }} />}
              <span>{opt.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}