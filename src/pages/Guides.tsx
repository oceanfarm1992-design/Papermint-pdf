import { useParams } from 'react-router-dom'
import GuideArticle, { GuidesList } from '@/components/GuideArticle'
import { guideBySlug } from '@/data/guides'
import { useSeo } from '@/hooks/useSeo'
import { GUIDES_DESCRIPTION, GUIDES_TITLE } from '@/data/seo'
import NotFound from '@/pages/NotFound'

export function GuidesIndex() {
  useSeo({ title: GUIDES_TITLE, description: GUIDES_DESCRIPTION, path: '/guides' })
  return <GuidesList />
}

export function GuidePage() {
  const { slug } = useParams()
  const guide = slug ? guideBySlug(slug) : undefined
  useSeo(
    guide
      ? { title: guide.title, description: guide.description, path: `/guides/${guide.slug}` }
      : { title: 'Page not found — Privacy PDF Tools', noindex: true },
  )
  if (!guide) return <NotFound />
  return <GuideArticle guide={guide} />
}
