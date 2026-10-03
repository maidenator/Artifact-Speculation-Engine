import { Settings } from "lucide-react" // keep settings icon as placeholder

export type AppPage = "speculator" | "sandbox" | "uid"

interface SideNavProps {
  currentPage: AppPage
  onNavigate: (page: AppPage) => void
}

export function SideNav({ currentPage, onNavigate }: SideNavProps) {
  return (
    <div className="fixed top-0 left-0 h-full bg-[#121620] z-[10002] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] w-[72px] hover:w-[240px] group overflow-hidden border-r border-white/10 flex flex-col shadow-2xl">
      <nav className="flex flex-col gap-2 p-3 mt-2 flex-1">
        <button
          type="button"
          onClick={() => onNavigate("speculator")}
          className={`flex items-center w-full h-12 rounded-lg cursor-pointer transition-colors duration-200 shrink-0 relative border ${
            currentPage === "speculator" 
              ? "bg-gold/15 border-gold text-gold" 
              : "bg-transparent border-transparent text-muted hover:bg-white/5 hover:border-white/10 hover:text-white"
          }`}
        >
          <div className="w-12 h-12 flex items-center justify-center shrink-0">
            <img src="/icons/speculation.png" alt="" className={`w-7 h-7 object-contain transition-opacity ${currentPage === "speculator" ? "opacity-100" : "opacity-70"}`} />
          </div>
          <span className="whitespace-nowrap font-genshin text-[14px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-1 font-semibold">Speculation Engine</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate("sandbox")}
          className={`flex items-center w-full h-12 rounded-lg cursor-pointer transition-colors duration-200 shrink-0 relative border ${
            currentPage === "sandbox" 
              ? "bg-gold/15 border-gold text-gold" 
              : "bg-transparent border-transparent text-muted hover:bg-white/5 hover:border-white/10 hover:text-white"
          }`}
        >
          <div className="w-12 h-12 flex items-center justify-center shrink-0">
            <img src="/icons/domain.png" alt="" className={`w-7 h-7 object-contain transition-opacity ${currentPage === "sandbox" ? "opacity-100" : "opacity-70"}`} />
          </div>
          <span className="whitespace-nowrap font-genshin text-[14px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-1 font-semibold">Artifact Sandbox</span>
        </button>

      </nav>
    </div>
  )
}
