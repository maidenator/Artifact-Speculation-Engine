import { useState, useRef, useEffect } from "react";

export interface Option {
  label: string;
  value: number | string;
  icon?: string;
}

interface GenshinSelectProps {
  value: number | string;
  onChange: (value: any) => void;
  options: Option[];
}

export function GenshinSelect({ value, onChange, options }: GenshinSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div className="custom-select-container" ref={containerRef}>
      <button
        type="button"
        className="custom-select-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {selectedOption.icon && (
            <img src={selectedOption.icon} alt="" style={{ width: 20, height: 20, objectFit: "contain", filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.3))" }} />
          )}
          <span>{selectedOption.label}</span>
        </div>
        <svg className={`chevron ${isOpen ? "open" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <ul className="custom-select-dropdown" role="listbox">
          {options.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={value === opt.value}
              className={`custom-select-option ${value === opt.value ? "selected" : ""}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              {opt.icon && (
                <img src={opt.icon} alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />
              )}
              <span>{opt.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}