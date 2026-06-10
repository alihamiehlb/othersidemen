import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { PolicyDocument } from './policies'
import { SeoHead, buildBreadcrumbJsonLd, buildFaqJsonLd } from '@/components/seo/SeoHead'

interface PolicyPageProps {
  doc: PolicyDocument
  slug: string
}

export function PolicyPage({ doc, slug }: PolicyPageProps) {
  const description = doc.intro ?? `${doc.title} — OTHER SIDE Men, men's streetwear from Lebanon.`

  const jsonLd = useMemo(() => {
    const crumbs = buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: doc.title, path: `/${slug}` },
    ])
    if (slug === 'faq') {
      return [crumbs, buildFaqJsonLd(doc.sections)]
    }
    return crumbs
  }, [doc, slug])

  return (
    <>
      <SeoHead
        title={doc.title}
        description={description}
        canonicalPath={`/${slug}`}
        ogType="article"
        jsonLd={jsonLd}
      />
      <div className="page-enter mx-auto max-w-3xl px-6 py-16 lg:px-10">
        <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-brand-muted">Legal</p>
        <h1 className="mb-2 text-3xl font-black uppercase tracking-tight">{doc.title}</h1>
        <p className="mb-10 text-[10px] text-brand-muted">Last updated: {doc.updated}</p>

        {doc.intro && <p className="mb-8 text-sm leading-relaxed text-brand-muted">{doc.intro}</p>}

        <div className="space-y-10">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-widest">{section.heading}</h2>
              <ul className="space-y-2">
                {section.body.map((line) => (
                  <li key={line} className="text-sm leading-relaxed text-brand-muted">
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-4 border-t border-theme-border pt-8 text-[10px] uppercase tracking-widest">
          <Link to="/privacy" className="text-brand-muted hover:text-brand-white">
            Privacy
          </Link>
          <Link to="/terms" className="text-brand-muted hover:text-brand-white">
            Terms
          </Link>
          <Link to="/cookies" className="text-brand-muted hover:text-brand-white">
            Cookies
          </Link>
          <Link to="/security-policy" className="text-brand-muted hover:text-brand-white">
            Security
          </Link>
        </div>
      </div>
    </>
  )
}
