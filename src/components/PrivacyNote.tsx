export default function PrivacyNote() {
  return (
    <p
      role="note"
      className="mx-auto flex max-w-xl items-center justify-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/70 px-4 py-2 text-center text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
    >
      <span aria-hidden>🔒</span>
      <span>
        Your files never leave your device. Everything is processed locally inside your browser.
      </span>
    </p>
  )
}
