import { HeroSection } from '@/components/sections/HeroSection'
import { LookbookSection } from '@/components/sections/LookbookSection'
import { NewInSection } from '@/components/sections/NewInSection'
import { StyleDnaSection } from '@/components/sections/StyleDnaSection'
import { ValuePropsBar } from '@/components/sections/ValuePropsBar'
import { SeoHead, buildOrganizationJsonLd } from '@/components/seo/SeoHead'
import { SITE_URL } from '@/config/site'

export function HomePage() {
  return (
    <>
      <SeoHead
        title="OTHER SIDE — Men's Fashion E-Commerce"
        description="Premium men's streetwear. Two sides. One identity. Shop jackets, hoodies, sneakers and more."
        canonicalPath="/"
        jsonLd={[
          buildOrganizationJsonLd(),
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'OTHER SIDE',
            url: SITE_URL,
            potentialAction: {
              '@type': 'SearchAction',
              target: `${SITE_URL}/shop?category={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          },
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
