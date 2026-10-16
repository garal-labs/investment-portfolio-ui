import type { Metadata } from 'next'
import { MarkdownDocument } from '@/components/metodologia/MarkdownDocument'
import { readMetodologia } from '@/lib/metodologia'

export const metadata: Metadata = {
  title: 'Cómo se calcula · Garal',
}

export default async function MetodologiaPage() {
  const source = await readMetodologia()

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <header style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="mx-auto flex items-center justify-between gap-4 px-5 py-4" style={{ maxWidth: 720 }}>
          <span className="font-serif text-[20px] font-bold" style={{ color: 'var(--color-primary)' }}>
            Garal
          </span>
          <span className="text-[13px]" style={{ color: 'var(--color-ink-2)' }}>
            Cómo se calcula
          </span>
        </div>
      </header>
      <main className="mx-auto px-5 py-10" style={{ maxWidth: 720 }}>
        <MarkdownDocument source={source} />
      </main>
    </div>
  )
}
