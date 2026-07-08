export const APP_VERSION = '1.0.0'
export const APP_NAME = 'Papermint'
export const CONTACT_EMAIL = 'mmw123450@gmail.com'
export const SITE_URL = 'https://papermint.pages.dev'

// Support / donate links shown in the footer. Empty the array to hide them.
export const DONATE_LINKS: { label: string; url: string }[] = [
  { label: 'Buy me a coffee', url: 'https://buymeacoffee.com/sareefirshm' },
  { label: 'Ko-fi', url: 'https://ko-fi.com/irshansareef' },
  { label: 'Liberapay', url: 'https://liberapay.com/~1923459/donate' },
  { label: 'PayPal', url: 'https://www.paypal.me/trendbazaar585' },
]

// Crypto wallet addresses, shown in a "Crypto" copy-to-clipboard dropdown.
// Empty the array to hide the crypto option.
export const CRYPTO_WALLETS: { label: string; address: string }[] = [
  { label: 'Bitcoin', address: 'bc1qwmet3rxmuc7q74lmhpc20vsxcr0y8e76jd42nh' },
  { label: 'Ethereum', address: '0xa627103D91CBc5d69dcE900a85FdDe9ED008C2e3' },
  { label: 'BNB Chain', address: '0xa627103D91CBc5d69dcE900a85FdDe9ED008C2e3' },
]
