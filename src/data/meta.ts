export const APP_VERSION = '1.0.0'
export const APP_NAME = 'Privacy PDF Tools'
export const CONTACT_EMAIL = 'mmw123450@gmail.com'
export const SITE_URL = 'https://privacypdftools.com'

// Support / donate links shown in the footer. Empty the array to hide them.
export const DONATE_LINKS: { label: string; url: string }[] = [
  { label: 'Buy me a coffee', url: 'https://buymeacoffee.com/sareefirshm' },
  { label: 'Ko-fi', url: 'https://ko-fi.com/irshansareef' },
  { label: 'Liberapay', url: 'https://liberapay.com/~1923459/donate' },
  { label: 'PayPal', url: 'https://www.paypal.me/trendbazaar585' },
]

// Google AdSense. Ads appear ONLY on guide articles (/guides/<slug>), never on
// tool pages. Leave ADSENSE_CLIENT empty to turn ads off completely: no ad code
// is loaded and public/ads.txt stays a placeholder.
// The publisher ID is public by design (Google shows it in page HTML and
// ads.txt), so it is safe to commit to this public repo.
//   1. ADSENSE_CLIENT alone: adds Google's site-verification <meta> tag and a
//      real public/ads.txt so AdSense can approve the site. No ad code loads.
//   2. Once approved, create a "Display" ad unit in AdSense and paste its slot
//      number into ADSENSE_SLOT: ads then show on guide articles only.
//   3. Keep "Auto ads" OFF in AdSense so ads never appear outside guide articles.
export const ADSENSE_CLIENT = 'ca-pub-7747069177703517'
export const ADSENSE_SLOT = ''

// Crypto wallet addresses, shown in a "Crypto" copy-to-clipboard dropdown.
// Empty the array to hide the crypto option.
export const CRYPTO_WALLETS: { label: string; address: string }[] = [
  { label: 'Bitcoin', address: 'bc1qwmet3rxmuc7q74lmhpc20vsxcr0y8e76jd42nh' },
  { label: 'Ethereum', address: '0xa627103D91CBc5d69dcE900a85FdDe9ED008C2e3' },
  { label: 'BNB Chain', address: '0xa627103D91CBc5d69dcE900a85FdDe9ED008C2e3' },
]
