import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PolicyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Link href="/" className="font-semibold text-green-700 text-sm">Farmmap</Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">
        <article className="prose prose-sm prose-gray max-w-none">
          {children}
        </article>
      </main>
      <footer className="max-w-2xl mx-auto px-4 py-6 text-xs text-gray-400 border-t border-gray-200 mt-4">
        <div className="flex gap-4 flex-wrap">
          <Link href="/privacy" className="hover:text-gray-600">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-gray-600">Terms of Use</Link>
          <Link href="/cookies" className="hover:text-gray-600">Cookie Policy</Link>
          <Link href="/content-policy" className="hover:text-gray-600">Content Policy</Link>
        </div>
        <p className="mt-2">© 2025 Derrywilligan Farm Ltd · NI667971 · 167 Armagh Road, Newry, BT35 6PX</p>
      </footer>
    </div>
  )
}
