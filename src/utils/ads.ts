import { useEffect } from 'react'
import { ADSENSE_CLIENT, ADSENSE_SLOT } from '@/data/meta'

/** Ads are on only when a valid publisher ID and ad slot are set in src/data/meta.ts. */
export const ADS_ENABLED = /^ca-pub-\d{10,20}$/.test(ADSENSE_CLIENT) && /^\d+$/.test(ADSENSE_SLOT)

const SCRIPT_ID = 'adsbygoogle-js'

/** Paths allowed to show ads. Must match the /guides/* rule in public/_headers. */
export function isAdPath(pathname: string) {
  return /^\/guides\/[^/]+\/?$/.test(pathname)
}

// A page's CSP comes from the URL it was first loaded on (public/_headers) and
// cannot change during in-app navigation, so remember which kind it was.
const DOCUMENT_ON_AD_PATH = typeof window !== 'undefined' && isAdPath(window.location.pathname)

/** True when this page was loaded as a guide article, so its CSP allows the ad script. */
export function adsAllowedOnThisPage() {
  return ADS_ENABLED && DOCUMENT_ON_AD_PATH
}

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

export function loadAdScript() {
  if (document.getElementById(SCRIPT_ID)) return
  const script = document.createElement('script')
  script.id = SCRIPT_ID
  script.async = true
  script.crossOrigin = 'anonymous'
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`
  document.head.appendChild(script)
}

/**
 * Call on every route change (Layout does). Crossing between guide articles and
 * any other page reloads it, so each page always runs under its own CSP:
 * - leaving a guide: the new page starts clean, with no ad code, under the
 *   strict no-third-party CSP before any tool touches a file;
 * - entering a guide from another page: the reload picks up the guide CSP, so
 *   the ad can load instead of leaving an empty slot.
 * Moving from one guide to another stays a fast in-app navigation.
 */
export function useAdIsolation(pathname: string) {
  useEffect(() => {
    const onAdPath = isAdPath(pathname)
    const leaving =
      !onAdPath && ((ADS_ENABLED && DOCUMENT_ON_AD_PATH) || !!document.getElementById(SCRIPT_ID))
    const entering = onAdPath && ADS_ENABLED && !DOCUMENT_ON_AD_PATH
    if (leaving || entering) window.location.replace(window.location.href)
  }, [pathname])
}
