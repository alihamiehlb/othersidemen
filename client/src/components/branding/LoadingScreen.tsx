import { AnimatedLogo } from '@/components/branding/AnimatedLogo'

interface LoadingScreenProps {
  message?: string
}

export function LoadingScreen({ message = 'Loading' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-brand-black">
      <AnimatedLogo size="lg" className="mb-8" />
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="loading-dot h-1.5 w-1.5 rounded-full bg-brand-white"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="mt-6 text-[10px] font-medium uppercase tracking-[0.4em] text-brand-muted">
        {message}
      </p>
    </div>
  )
}
