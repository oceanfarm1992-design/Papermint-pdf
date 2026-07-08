import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-6xl font-bold text-neutral-200 dark:text-neutral-700">404</p>
      <h1 className="mt-4 text-xl font-semibold">This page doesn’t exist</h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        The tool or page you’re looking for couldn’t be found.
      </p>
      <Link to="/" className="btn-primary mt-6 inline-flex">
        Browse all tools
      </Link>
    </div>
  )
}
