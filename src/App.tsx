import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Home from '@/pages/Home'

const ToolPage = lazy(() => import('@/pages/ToolPage'))
const About = lazy(() => import('@/pages/StaticPages').then((m) => ({ default: m.About })))
const Privacy = lazy(() => import('@/pages/StaticPages').then((m) => ({ default: m.Privacy })))
const Terms = lazy(() => import('@/pages/StaticPages').then((m) => ({ default: m.Terms })))
const Contact = lazy(() => import('@/pages/StaticPages').then((m) => ({ default: m.Contact })))
const Faq = lazy(() => import('@/pages/StaticPages').then((m) => ({ default: m.Faq })))
const NotFound = lazy(() => import('@/pages/NotFound'))
const GuidesIndex = lazy(() => import('@/pages/Guides').then((m) => ({ default: m.GuidesIndex })))
const GuidePage = lazy(() => import('@/pages/Guides').then((m) => ({ default: m.GuidePage })))

function Fallback() {
  return (
    <div className="flex min-h-svh justify-center py-24" role="status" aria-label="Loading">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route
          path="tool/:slug"
          element={
            <Suspense fallback={<Fallback />}>
              <ToolPage />
            </Suspense>
          }
        />
        <Route
          path="about"
          element={
            <Suspense fallback={<Fallback />}>
              <About />
            </Suspense>
          }
        />
        <Route
          path="privacy"
          element={
            <Suspense fallback={<Fallback />}>
              <Privacy />
            </Suspense>
          }
        />
        <Route
          path="terms"
          element={
            <Suspense fallback={<Fallback />}>
              <Terms />
            </Suspense>
          }
        />
        <Route
          path="contact"
          element={
            <Suspense fallback={<Fallback />}>
              <Contact />
            </Suspense>
          }
        />
        <Route
          path="faq"
          element={
            <Suspense fallback={<Fallback />}>
              <Faq />
            </Suspense>
          }
        />
        <Route
          path="guides"
          element={
            <Suspense fallback={<Fallback />}>
              <GuidesIndex />
            </Suspense>
          }
        />
        <Route
          path="guides/:slug"
          element={
            <Suspense fallback={<Fallback />}>
              <GuidePage />
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <Suspense fallback={<Fallback />}>
              <NotFound />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  )
}
