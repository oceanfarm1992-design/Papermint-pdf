import { useEffect } from 'react'
import { ADSENSE_CLIENT, ADSENSE_SLOT } from '@/data/meta'
import { ADS_ENABLED, adsAllowedOnThisPage, loadAdScript } from '@/utils/ads'

/**
 * Google AdSense, isolated from the PDF tools.
 *
 * - Ads render only on guide articles (/guides/<slug>). public/_headers gives
 *   those URLs a CSP that allows Google's ad scripts; every other page keeps
 *   the strict CSP that blocks all third-party scripts.
 * - If a visitor moves from a guide to any other page inside the app, the page
 *   is fully reloaded (useAdIsolation in src/utils/ads.ts), so the ad script is gone before a tool
 *   ever touches a file.
 * - With no publisher ID configured in src/data/meta.ts nothing is rendered
 *   and nothing is loaded.
 *
 * AdSlot: one responsive display ad, clearly labelled.
 */
export default function AdSlot() {
  useEffect(() => {
    if (!adsAllowedOnThisPage()) return
    loadAdScript()
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      /* ad blocked or slot already filled — the page works the same without it */
    }
  }, [])

  if (!ADS_ENABLED) return null
  return (
    <aside
      aria-label="Advertisement"
      className="my-10 border-y border-neutral-200 py-4 dark:border-neutral-800"
    >
      <p className="mb-2 text-center text-xs tracking-wide text-neutral-400 uppercase">Advertisement</p>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight: 250 }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  )
}

/** Short disclosure shown at the top of guide articles while ads are on. */
export function AdDisclosure() {
  if (!ADS_ENABLED) return null
  return (
    <p className="mt-4 rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-4 py-2.5 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
      <span aria-hidden>🔒 </span>
      This article shows ads to keep our PDF tools free. Ads never see your documents: the tools run on
      your device, never upload or store your files, and show no ads.{' '}
      <a href="/privacy#advertising" className="underline">
        How ads work here
      </a>
    </p>
  )
}
