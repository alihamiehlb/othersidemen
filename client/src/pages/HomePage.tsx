import { HeroSection } from '@/components/sections/HeroSection'
import { LookbookSection } from '@/components/sections/LookbookSection'
import { NewInSection } from '@/components/sections/NewInSection'
import { StyleDnaSection } from '@/components/sections/StyleDnaSection'
import { ValuePropsBar } from '@/components/sections/ValuePropsBar'

export function HomePage() {
  return (
    <>
      <HeroSection />
      <StyleDnaSection />
      <LookbookSection />
      <NewInSection />
      <ValuePropsBar />
    </>
  )
}
