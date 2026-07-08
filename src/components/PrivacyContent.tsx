import { FileText, FolderInput, HardDriveDownload, ShieldCheck } from 'lucide-react'

/**
 * SEO / marketing content rendered below the tool grid on the homepage.
 * Original copy (not templated from any competitor). All claims are written to
 * be truthful for this app — note the OCR offline caveat is stated explicitly.
 */

const STEPS = [
  {
    icon: FolderInput,
    title: 'Open your file',
    body: 'Your browser reads the PDF straight from your disk with the File API. No upload, no network request — the file is just handed to the page.',
  },
  {
    icon: FileText,
    title: 'Process in your browser',
    body: 'pdf.js, pdf-lib and WebAssembly parse, render and edit the document entirely in your device’s memory. Nothing is sent anywhere while you work.',
  },
  {
    icon: HardDriveDownload,
    title: 'Download the result',
    body: 'The finished PDF is built as a file in the browser and saved straight to your device. It never touches a server, because there isn’t one to touch.',
  },
]

const AUDIENCES = [
  {
    title: 'Healthcare & clinics',
    body: 'Patient records and referral forms contain sensitive health information. Keeping them in the browser means they’re never sent to a third-party service.',
  },
  {
    title: 'Legal professionals',
    body: 'Contracts, briefs and client files are confidential. Editing them locally avoids handing privileged documents to an outside server.',
  },
  {
    title: 'Finance & accounting',
    body: 'Tax returns, statements and payroll data stay on your machine — no cloud upload step to worry about.',
  },
  {
    title: 'Students & researchers',
    body: 'Unpublished drafts and research data often can’t go through cloud services. Browser-only processing keeps them where they belong.',
  },
  {
    title: 'Corporate & IT-restricted',
    body: 'When company policy blocks upload-based cloud tools for internal documents, a tool that never uploads simply sidesteps the problem.',
  },
  {
    title: 'Chromebook users',
    body: 'No installs, no Linux, no admin rights needed. Everything runs in Chrome — ideal for locked-down school and work devices.',
  },
]

const COMPARISON: { feature: string; us: string; them: string }[] = [
  {
    feature: 'Your file is sent to a server',
    us: 'Never — it stays in your browser',
    them: 'Yes — uploaded and processed remotely',
  },
  { feature: 'Account required', us: 'No', them: 'Often, for full features' },
  { feature: 'Watermark on the result', us: 'No', them: 'Sometimes, on free tiers' },
  { feature: 'Works offline after first load', us: 'Yes*', them: 'No — needs their servers' },
  {
    feature: 'You can verify it yourself',
    us: 'Yes — the Network tab shows no file leaves',
    them: 'Not really',
  },
  { feature: 'Price', us: 'Free, unlimited', them: 'Free tier is usually limited' },
]

export default function PrivacyContent() {
  return (
    <section
      aria-labelledby="why-private"
      className="mt-16 border-t border-neutral-200/70 pt-14 dark:border-neutral-800"
    >
      <div className="mx-auto max-w-3xl">
        <h2 id="why-private" className="text-2xl font-bold tracking-tight sm:text-3xl">
          Private PDF tools that never upload your files
        </h2>
        <div className="mt-4 space-y-4 leading-relaxed text-neutral-600 dark:text-neutral-300">
          <p>
            Most popular PDF tools — including big cloud services like iLovePDF and Smallpdf — work by
            sending your document to their servers, processing it there, and sending it back. Privacy PDF
            Tools works the opposite way: every operation runs inside your own browser tab using
            JavaScript and WebAssembly. Your file is read from your disk, processed in your device’s
            memory, and saved back — it never travels to a server, because we don’t run one that could
            receive it.
          </p>
          <p>
            That’s not a policy promise you have to trust; it’s how the app is built. Open your browser’s
            developer tools, watch the Network tab, and you’ll see your file never leaves the page.
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="mx-auto mt-12 max-w-5xl">
        <h3 className="text-center text-lg font-semibold">How it works — without uploading</h3>
        <ol className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <li key={step.title} className="card p-5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
                    {i + 1}
                  </span>
                  <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" aria-hidden />
                </div>
                <h4 className="mt-3 font-semibold">{step.title}</h4>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{step.body}</p>
              </li>
            )
          })}
        </ol>
      </div>

      {/* Comparison */}
      <div className="mx-auto mt-12 max-w-3xl">
        <h3 className="text-lg font-semibold">Privacy PDF Tools vs upload-based tools</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left dark:border-neutral-700">
                <th className="py-2 pr-4 font-medium">Feature</th>
                <th className="py-2 pr-4 font-medium text-brand-700 dark:text-brand-400">
                  Privacy PDF Tools
                </th>
                <th className="py-2 font-medium text-neutral-500 dark:text-neutral-400">
                  Typical upload-based tools
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.feature} className="border-b border-neutral-100 dark:border-neutral-800/70">
                  <td className="py-2.5 pr-4 font-medium text-neutral-700 dark:text-neutral-300">
                    {row.feature}
                  </td>
                  <td className="py-2.5 pr-4 text-neutral-700 dark:text-neutral-300">{row.us}</td>
                  <td className="py-2.5 text-neutral-500 dark:text-neutral-400">{row.them}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-neutral-400">
          *Every tool works offline after the first load, except OCR, which downloads a small open-source
          language pack once and caches it. That download never contains your document.
        </p>
      </div>

      {/* Who it's for */}
      <div className="mx-auto mt-12 max-w-5xl">
        <h3 className="text-lg font-semibold">Who needs a no-upload PDF editor?</h3>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIENCES.map((a) => (
            <div key={a.title} className="card p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand-600 dark:text-brand-400" aria-hidden />
                <h4 className="font-semibold">{a.title}</h4>
              </div>
              <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400">{a.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
