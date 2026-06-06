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
    <section className="border-y border-white/5 bg-brand-dark px-6 py-12 lg:px-10" aria-label="Value propositions">
      <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
        {VALUE_PROPS.map((prop) => {
          const Icon = iconMap[prop.icon as keyof typeof iconMap]
          return (
            <div key={prop.id} className="flex flex-col items-center text-center">
              <Icon size={20} strokeWidth={1.5} className="mb-3 text-brand-muted" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest">{prop.title}</h3>
              <p className="mt-1 text-[10px] leading-relaxed text-brand-muted">{prop.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
