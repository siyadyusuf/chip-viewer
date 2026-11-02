import { useMemo, useState, useEffect } from 'react'
import data from './data/chips.json'

type Chip = { id: string; name: string; year: string | number | null; category: string; chip: string; tier: string
  embedUrl: string; sourceUrl: string; license: string; safe: boolean; author: string; logo: boolean; modelUrl: string | null; visualScore: number }
const items = data.items as Chip[]
const authorName = (a: string) => a.replace(/\s*\(.*\)\s*$/, '')
const authorUrl = (a: string) => { const m = a.match(/\(([^)]+)\)/); return m ? 'https://' + m[1].replace(/^https?:\/\//, '') : null }

export default function App() {
  const [tier, setTier] = useState<'current' | 'legacy'>('current')
  const [cat, setCat] = useState('')
  const [q, setQ] = useState('')
  const [showRestricted, setShowRestricted] = useState(false)
  const list = useMemo(() => items.filter(i => i.tier === tier && (showRestricted || i.safe) && (!cat || i.category === cat)
    && (!q || `${i.name} ${i.chip} ${i.category} ${i.author}`.toLowerCase().includes(q.toLowerCase()))), [tier, cat, q, showRestricted])
  const cats = useMemo(() => [...new Set(items.filter(i => i.tier === tier && (showRestricted || i.safe)).map(i => i.category))].sort(), [tier, showRestricted])
  const [selId, setSelId] = useState<string | null>(null)
  useEffect(() => { if (!list.find(i => i.id === selId)) setSelId(list[0]?.id ?? null) }, [list, selId])
  useEffect(() => { if (cat && !cats.includes(cat)) setCat('') }, [cats, cat])
  const sel = items.find(i => i.id === selId)
  const btn = (on: boolean) => `px-3 py-1.5 text-sm rounded-md border ${on ? 'bg-fg text-bg border-fg' : 'border-border text-muted hover:text-fg'}`

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#viewer" className="sr-only focus:not-sr-only focus:absolute focus:p-2 focus:bg-card">Skip to viewer</a>
      <header className="border-b border-border px-4 sm:px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight">Chip Viewer</h1>
        <p className="text-sm text-muted">Drag to orbit 3D models of computer chips and components, current and legacy.</p>
      </header>
      <main className="flex-1 grid lg:grid-cols-[380px_1fr] gap-0">
        <section aria-label="Model list" className="border-b lg:border-b-0 lg:border-r border-border p-4 flex flex-col gap-3 lg:max-h-[calc(100vh-140px)]">
          <div role="group" aria-label="Tier" className="flex gap-2">
            <button className={btn(tier === 'current')} aria-pressed={tier === 'current'} onClick={() => setTier('current')}>Current</button>
            <button className={btn(tier === 'legacy')} aria-pressed={tier === 'legacy'} onClick={() => setTier('legacy')}>Legacy</button>
          </div>
          <div className="flex gap-2">
            <label className="sr-only" htmlFor="q">Search models</label>
            <input id="q" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search…"
              className="flex-1 min-w-0 bg-chip border border-border rounded-md px-3 py-1.5 text-sm placeholder:text-subtle" />
            <label className="sr-only" htmlFor="cat">Category</label>
            <select id="cat" value={cat} onChange={e => setCat(e.target.value)} className="bg-chip border border-border rounded-md px-2 py-1.5 text-sm max-w-[45%]">
              <option value="">All categories</option>
              {cats.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={showRestricted} onChange={e => setShowRestricted(e.target.checked)} className="accent-[#4ade80]" />
            Show restricted-license models
          </label>
          <p className="text-xs text-subtle font-mono" aria-live="polite">{list.length} model{list.length === 1 ? '' : 's'}</p>
          <ul className="overflow-y-auto flex flex-col gap-1 max-h-72 lg:max-h-none" aria-label="Models">
            {list.map(i => (
              <li key={i.id}>
                <button onClick={() => setSelId(i.id)} aria-current={i.id === selId}
                  className={`w-full text-left px-3 py-2 rounded-md border ${i.id === selId ? 'border-accent bg-card' : 'border-transparent hover:bg-card'}`}>
                  <span className="block text-sm">{i.name}</span>
                  <span className="block text-xs text-subtle">{i.category} · {i.year ?? 'n/a'}
                    {!i.safe && <span className="ml-2 text-warn font-medium">RESTRICTED</span>}</span>
                </button>
              </li>))}
            {list.length === 0 && <li className="text-sm text-muted px-3">No models match.</li>}
          </ul>
        </section>
        <section id="viewer" aria-label="Viewer" className="p-4 sm:p-6 flex flex-col gap-4">
          {sel ? <>
            <div className="aspect-video w-full bg-card border border-border rounded-lg overflow-hidden">
              <iframe key={sel.id} title={`3D model: ${sel.name}`} src={sel.embedUrl} className="w-full h-full" loading="lazy"
                allow="autoplay; fullscreen; xr-spatial-tracking" allowFullScreen />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{sel.name}</h2>
              {!sel.safe && <p className="mt-1 inline-block text-xs font-medium text-warn border border-warn/40 rounded px-2 py-0.5">Restricted license: not cleared for reuse</p>}
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt className="text-subtle">Chip</dt><dd>{sel.chip}</dd>
                <dt className="text-subtle">Year</dt><dd>{sel.year ?? 'n/a'}</dd>
                <dt className="text-subtle">Category</dt><dd>{sel.category}</dd>
                <dt className="text-subtle">License</dt><dd>{sel.license}</dd>
                <dt className="text-subtle">Author</dt><dd>{authorUrl(sel.author) ? <a className="underline hover:text-accent" href={authorUrl(sel.author)!} target="_blank" rel="noopener noreferrer">{authorName(sel.author)}</a> : authorName(sel.author)}</dd>
                <dt className="text-subtle">Source</dt><dd><a className="underline hover:text-accent" href={sel.sourceUrl} target="_blank" rel="noopener noreferrer">View on Sketchfab</a></dd>
              </dl>
              <p className="mt-3 text-xs text-subtle">“{sel.name}” by {authorName(sel.author)}, licensed {sel.license}, via Sketchfab.</p>
            </div>
          </> : <p className="text-muted">Select a model.</p>}
        </section>
      </main>
      <footer className="border-t border-border px-4 sm:px-6 py-4 text-xs text-subtle">{data.disclaimer}</footer>
    </div>)
}
