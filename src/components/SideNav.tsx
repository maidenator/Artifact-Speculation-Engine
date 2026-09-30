import { useState, useEffect, useRef } from "react"

export type AppPage = "speculator" | "sandbox"

interface SideNavProps {
  currentPage: AppPage
  onNavigate: (page: AppPage) => void
}

export function SideNav({ currentPage, onNavigate }: SideNavProps) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open])

  return (
    <>
      {/* Hamburger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed top-5 left-5 z-[10001] w-10 h-10 rounded-lg bg-card border border-line flex items-center justify-center cursor-pointer hover:border-gold hover:text-gold text-muted transition-all duration-200 shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
        aria-label="Toggle navigation menu"
        aria-expanded={open}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform duration-200"
        >
          {open ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </>
          )}
        </svg>
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-[10000] transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
      />

      {/* Side Panel */}
      <div
        ref={panelRef}
        className={`fixed top-0 left-0 h-full w-[280px] bg-card border-r border-line z-[10002] shadow-[4px_0_24px_rgba(0,0,0,0.4)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Panel Header */}
        <div className="px-5 pt-6 pb-4 border-b border-line">
          <h2 className="font-genshin font-bold text-[18px] text-gold m-0 tracking-[0.5px]">Navigation</h2>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-2 p-4">
          <button
            type="button"
            onClick={() => {
              onNavigate("speculator")
              setOpen(false)
            }}
            className={`font-genshin w-full text-left px-4 py-3 rounded-lg border cursor-pointer transition-all duration-200 flex items-center gap-3 ${currentPage === "speculator"
              ? "bg-gold/15 border-gold text-gold"
              : "bg-transparent border-line text-muted hover:border-gold/50 hover:text-ink hover:bg-white/5"
              }`}
          >
            <img src="/icons/speculation.png" alt="" className="w-10 h-10 object-contain opacity-100" />
            <div>
              <span className="block text-[14px] font-semibold">Speculation Engine</span>
              <span className="block text-[11px] opacity-70">Simulate resin spending</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onNavigate("sandbox")
              setOpen(false)
            }}
            className={`font-genshin w-full text-left px-4 py-3 rounded-lg border cursor-pointer transition-all duration-200 flex items-center gap-3 ${currentPage === "sandbox"
              ? "bg-gold/15 border-gold text-gold"
              : "bg-transparent border-line text-muted hover:border-gold/50 hover:text-ink hover:bg-white/5"
              }`}
          >
            <img src="/icons/domain.png" alt="" className="w-10 h-10 object-contain opacity-100" />
            <div>
              <span className="block text-[14px] font-semibold">Artifact Sandbox</span>
              <span className="block text-[11px] opacity-70">Generate &amp; upgrade artifacts</span>
            </div>
          </button>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 px-5 py-4 border-t border-line">
          <p className="font-genshin text-muted text-[11px] m-0 opacity-60">Artifact Speculation Engine</p>
        </div>
      </div>
    </>
  )
}
