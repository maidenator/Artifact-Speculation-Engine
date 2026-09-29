import type { ReactNode } from "react"

interface FieldProps {
  id: string
  label: string
  hint?: string
  children: ReactNode
}

export function Field({ id, label, hint, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="font-genshin block text-[13px] font-medium text-muted mb-1.5 tracking-[0.3px]">{label}</label>
      {children}
      {hint && <p className="font-genshin mt-[5px] text-[12.5px] text-muted tracking-[0.3px]">{hint}</p>}
    </div>
  )
}