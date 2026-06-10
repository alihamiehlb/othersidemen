import { HeroSection } from '@/components/sections/HeroSection'
import { LookbookSection } from '@/components/sections/LookbookSection'
import { NewInSection } from '@/components/sections/NewInSection'
import { StyleDnaSection } from '@/components/sections/StyleDnaSection'
import { ValuePropsBar } from '@/components/sections/ValuePropsBar'
import {
  SeoHead,
  buildClothingStoreJsonLd,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
} from '@/components/seo/SeoHead'
import { DEFAULT_DESCRIPTION } from '@/config/seo'

export function HomePage() {
  return (
    <>
      <SeoHead
        title="OTHER SIDE — Men's Fashion E-Commerce"
        description={DEFAULT_DESCRIPTION}
        canonicalPath="/"
        jsonLd={[
          buildOrganizationJsonLd(),
          buildWebSiteJsonLd(),
          buildClothingStoreJsonLd(),
        ]}
      />
      <HeroSection />
      <StyleDnaSection />
      <LookbookSection />
      <NewInSection />
      <ValuePropsBar />
    </>
  )
}
