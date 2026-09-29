import { useEffect, useRef } from "react"

export function useDockedScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const update = () => {
      // Using a larger tolerance (like 150-200px) and checking immediately
      const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 150
      el.toggleAttribute("data-docked", isAtBottom)
    }

    // Run immediately on mount
    update()

    // Listen to both scroll and wheel for instant response
    el.addEventListener("scroll", update, { passive: true })
    el.addEventListener("wheel", update, { passive: true })
    
    const observer = new ResizeObserver(update)
    observer.observe(el)

    return () => {
      el.removeEventListener("scroll", update)
      el.removeEventListener("wheel", update)
      observer.disconnect()
    }
  }, [])

  return ref
}