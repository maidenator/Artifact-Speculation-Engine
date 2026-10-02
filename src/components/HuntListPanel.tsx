import { useHuntList } from "../hooks/useHuntList"
import { HuntItemCard } from "./HuntItemCard"
import { HuntItemModal } from "./HuntItemModal"
import { useAutoAnimate } from "@formkit/auto-animate/react"

export function HuntListPanel() {
  const { items, openModal } = useHuntList()
  const [animateParent] = useAutoAnimate()

  return (
    <>
      <section className="bg-card border border-line rounded-lg p-5 mb-4 shadow-[0_8px_24px_rgba(0,0,0,0.2),inset_0_0_0_1px_rgba(255,255,255,0.05)]">
        <h2 className="font-genshin font-bold text-[28px] text-gold mb-2 leading-[1.2] tracking-[0.5px]">
          Hunt List
        </h2>
        <p className="font-genshin text-[12.5px] text-muted mb-5">
          Define the artifacts you want to hunt for
        </p>

        {/* Saved items grid */}
        {items.length > 0 && (
          <div ref={animateParent} className="flex flex-col gap-2.5 mb-4">
            {items.map((item) => (
              <HuntItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Add Artifact button */}
        <button
          onClick={() => openModal()}
          className="w-full group flex items-center justify-center gap-3 py-5 rounded-xl border-2 border-dashed border-white/15 bg-transparent hover:border-gold/50 hover:bg-gold/[0.04] cursor-pointer transition-all duration-200 ease-out hover:scale-[1.02] active:scale-95"
        >
          <div className="relative">
            <img
              src="/icons/slot/flower.png"
              alt=""
              className="w-10 h-10 object-contain opacity-30 group-hover:opacity-50 transition-opacity drop-shadow-md"
            />
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gold/80 text-[#1a1f2e] flex items-center justify-center text-[14px] font-bold leading-none shadow-[0_2px_6px_rgba(0,0,0,0.3)]">
              +
            </span>
          </div>
          <span className="font-genshin text-[13px] text-muted group-hover:text-gold transition-colors">
            Add Artifact
          </span>
        </button>
      </section>

      {/* Modal renders at root level via portal-like fixed positioning */}
      <HuntItemModal />
    </>
  )
}
