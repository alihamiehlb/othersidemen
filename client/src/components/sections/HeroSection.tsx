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
    <section className="relative min-h-[100svh] overflow-hidden pt-16" aria-label="Hero">
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
              className={`h-full w-full object-cover object-[50%_38%] transition-opacity duration-700 sm:object-[50%_35%] lg:object-[50%_32%] ${loaded ? 'opacity-100' : 'opacity-0'} ${isLight ? 'brightness-[1.03] contrast-[0.98]' : ''}`}
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
          className={`hero-mobile-overlay absolute inset-x-0 bottom-0 h-[70%] lg:hidden ${isLight ? 'hero-overlay-light' : 'hero-overlay-dark'}`}
          aria-hidden="true"
        />
        <div
          className={`hero-bottom-fade absolute inset-x-0 bottom-0 h-32 sm:h-40 ${isLight ? 'hero-fade-light' : 'hero-fade-dark'}`}
          aria-hidden="true"
        />
        <div
          className={`absolute inset-x-0 top-0 h-20 ${isLight ? 'bg-gradient-to-b from-white/70 to-transparent' : 'bg-gradient-to-b from-black/50 to-transparent'}`}
          aria-hidden="true"
        />
        <div
          className={`absolute top-0 bottom-0 left-1/2 hidden w-px -translate-x-1/2 lg:block ${isLight ? 'bg-black/10' : 'bg-white/10'}`}
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 flex min-h-[calc(100svh-4rem)] flex-col justify-end lg:grid lg:grid-cols-2 lg:justify-center">
        <div className="flex flex-col justify-end px-5 pb-10 sm:px-8 sm:pb-12 lg:justify-center lg:px-12 lg:py-16 xl:px-20">
          <div
            className={`max-w-lg rounded-sm px-1 py-2 lg:max-w-xl ${
              isLight ? 'bg-white/75 backdrop-blur-sm' : 'bg-black/45 backdrop-blur-[2px]'
            }`}
          >
            <p
              className={`mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] sm:mb-4 ${
                isLight ? 'text-neutral-700' : 'text-white/85'
              }`}
            >
              OTHERSIDE DNA — MEN
            </p>
            <h1
              className={`mb-4 text-3xl font-black uppercase leading-[0.95] tracking-tight text-balance sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl ${
                isLight ? 'text-neutral-950' : 'text-white drop-shadow-lg'
              }`}
            >
              Two Sides.
              <br />
              One Identity.
            </h1>
            <p
              className={`mb-6 max-w-md text-sm leading-relaxed sm:mb-8 lg:mb-10 ${
                isLight ? 'text-neutral-800' : 'text-white/90'
              }`}
            >
              Tailored for modern men. Designed to make every side yours.
            </p>
            <div className="flex flex-col gap-3 min-[400px]:flex-row min-[400px]:gap-4">
              <Link to="/shop">
                <Button variant="solid" className="w-full min-[400px]:w-auto">Shop Men&apos;s Collection</Button>
              </Link>
              <Link to="/shop?category=looks">
                <Button variant="outline" className="w-full min-[400px]:w-auto">New Arrivals</Button>
              </Link>
            </div>
          </div>

          <div className={`mt-8 flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest sm:mt-12 lg:absolute lg:bottom-8 lg:left-12 xl:left-20 ${isLight ? 'text-neutral-600' : 'text-white/70'}`}>
            <span>Scroll to Discover</span>
            <ChevronDown size={14} className="animate-bounce" />
          </div>
        </div>

        <div className="hidden lg:block" aria-hidden="true" />
      </div>
    </section>
  )
}
