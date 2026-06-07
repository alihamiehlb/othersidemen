import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/contexts/ThemeContext'
import { resolveImage } from '@/utils/resolveImage'

const HERO_DESKTOP = resolveImage('hero.model')
const HERO_MOBILE = resolveImage('hero.modelMobile')

export function HeroSection() {
  const [loaded, setLoaded] = useState(false)
  const { theme } = useTheme()
  const isLight = theme === 'light'

  return (
    <section className="relative min-h-[100svh] overflow-hidden pt-16 safe-top" aria-label="Hero">
      <div
        className={`absolute inset-0 ${
          isLight
            ? 'bg-gradient-to-br from-[#f7f7f7] via-[#ececec] to-[#fafafa]'
            : 'bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0d0d0d]'
        }`}
      >
        {HERO_DESKTOP && (
          <picture>
            <source media="(max-width: 768px)" srcSet={HERO_MOBILE ?? HERO_DESKTOP} />
            <img
              src={HERO_DESKTOP}
              alt="OTHER SIDE Men — dark and light streetwear"
              className={`h-full w-full object-cover transition-opacity duration-700 max-lg:object-[50%_18%] lg:object-[50%_35%] ${loaded ? 'opacity-100' : 'opacity-0'} ${isLight ? 'max-lg:brightness-[1.02] lg:brightness-[1.03] contrast-[0.98]' : 'max-lg:brightness-[1.05]'}`}
              fetchPriority="high"
              decoding="async"
              onLoad={() => setLoaded(true)}
            />
          </picture>
        )}

        <div
          className={`absolute top-0 bottom-0 left-0 hidden w-[42%] max-w-xl lg:block ${
            isLight
              ? 'bg-gradient-to-r from-white/55 via-white/20 to-transparent'
              : 'bg-gradient-to-r from-black/35 via-black/10 to-transparent'
          }`}
          aria-hidden="true"
        />
        <div
          className={`hero-mobile-overlay absolute inset-x-0 bottom-0 h-[48%] lg:hidden ${isLight ? 'hero-overlay-light' : 'hero-overlay-dark'}`}
          aria-hidden="true"
        />
        <div
          className={`hero-bottom-fade absolute inset-x-0 bottom-0 h-24 sm:h-32 lg:h-40 ${isLight ? 'hero-fade-light' : 'hero-fade-dark'}`}
          aria-hidden="true"
        />
        <div
          className={`absolute inset-x-0 top-0 h-16 lg:h-20 ${isLight ? 'bg-gradient-to-b from-white/40 to-transparent' : 'bg-gradient-to-b from-black/35 to-transparent'}`}
          aria-hidden="true"
        />
        <div
          className={`absolute top-0 bottom-0 left-1/2 hidden w-px -translate-x-1/2 lg:block ${isLight ? 'bg-black/10' : 'bg-white/10'}`}
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 flex min-h-[calc(100svh-4rem)] flex-col justify-end lg:grid lg:grid-cols-2 lg:justify-center">
        <div className="flex flex-col justify-end px-4 pb-[max(1.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-10 lg:justify-center lg:px-10 lg:py-16 xl:px-24">
          <div className="hero-cta-panel hero-glass-panel mx-auto w-full max-w-md px-5 py-5 sm:max-w-xl sm:px-7 sm:py-7 lg:mx-0 lg:max-w-2xl lg:px-10 lg:py-10">
            <p
              className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] sm:mb-3 sm:tracking-[0.3em] ${
                isLight ? 'text-neutral-800/90' : 'text-white/85'
              }`}
            >
              OTHERSIDE DNA — MEN
            </p>
            <h1
              className={`mb-3 text-[1.65rem] font-black uppercase leading-[0.95] tracking-tight text-balance sm:mb-5 sm:text-4xl md:text-5xl lg:mb-6 lg:text-6xl xl:text-7xl ${
                isLight ? 'text-neutral-950' : 'text-white drop-shadow-md'
              }`}
            >
              Two Sides.
              <br />
              One Identity.
            </h1>
            <p
              className={`mb-5 max-w-md text-sm leading-relaxed sm:mb-7 lg:mb-10 ${
                isLight ? 'text-neutral-800/90' : 'text-white/90'
              }`}
            >
              Tailored for modern men. Designed to make every side yours.
            </p>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-4">
              <Link to="/shop" className="w-full sm:w-auto">
                <Button
                  variant="solid"
                  fullWidth
                  className={`sm:w-auto ${isLight ? 'bg-neutral-950 text-white hover:bg-neutral-800' : ''}`}
                >
                  Shop Men&apos;s Collection
                </Button>
              </Link>
              <Link to="/shop?category=looks" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  fullWidth
                  className={`sm:w-auto ${isLight ? 'border-neutral-900/70 text-neutral-950 hover:bg-neutral-950 hover:text-white' : 'border-white/70'}`}
                >
                  New Arrivals
                </Button>
              </Link>
            </div>
          </div>

          <div
            className={`mt-5 flex items-center justify-center gap-2 text-[10px] font-medium uppercase tracking-widest sm:mt-8 lg:absolute lg:bottom-8 lg:left-12 lg:justify-start xl:left-20 ${
              isLight ? 'text-neutral-800/80' : 'text-white/75 drop-shadow-sm'
            }`}
          >
            <span>Scroll to Discover</span>
            <ChevronDown size={14} className="animate-bounce" />
          </div>
        </div>

        <div className="hidden lg:block" aria-hidden="true" />
      </div>
    </section>
  )
}
