import { Globe, Headphones, Lock, RefreshCw, Shield } from 'lucide-react'
import { VALUE_PROPS } from '@/data/mockData'

const iconMap = {
  globe: Globe,
  shield: Shield,
  refresh: RefreshCw,
  lock: Lock,
  headphones: Headphones,
} as const

export function ValuePropsBar() {
  return (
    <section className="section-shell border-y border-theme-border bg-brand-dark" aria-label="Value propositions">
      <div className="store-container grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {VALUE_PROPS.map((prop) => {
          const Icon = iconMap[prop.icon as keyof typeof iconMap]
          return (
            <div key={prop.id} className="value-prop-card flex flex-col items-center text-center">
              <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full border border-theme-subtle bg-brand-black/30">
                <Icon size={18} strokeWidth={1.5} className="text-brand-muted" />
              </span>
              <h3 className="text-[10px] font-bold uppercase tracking-widest">{prop.title}</h3>
              <p className="mt-1.5 text-[10px] leading-relaxed text-theme-secondary">{prop.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
