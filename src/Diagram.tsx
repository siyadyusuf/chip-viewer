import { useState } from 'react'

export type DiagramLabel = { x: number; y: number; text: string; desc?: string }
export type DiagramData = { image?: string; imageLicense?: string; imageAuthor?: string; imageSource?: string; labels: DiagramLabel[] }
export type PkgType = 'LGA' | 'BGA' | 'PGA' | 'DIP' | 'Cartridge'
export const PKG_TYPES: PkgType[] = ['LGA', 'BGA', 'PGA', 'DIP', 'Cartridge']

/** Only infer the package when the catalog text says so explicitly; otherwise the user picks. */
export function explicitPkg(text: string): PkgType | null {
  if (/\bDIP\b/i.test(text)) return 'DIP'
  if (/\bBGA\b/i.test(text)) return 'BGA'
  if (/\bLGA\b/i.test(text)) return 'LGA'
  if (/\bPGA\b/i.test(text)) return 'PGA'
  if (/\bslot (1|a)\b|cartridge/i.test(text)) return 'Cartridge'
  return null
}

export function LabeledImage({ d }: { d: DiagramData }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <figure>
      <div className="relative">
        {d.image && <img src={d.image} alt="Chip diagram" className="w-full rounded-md" />}
        {d.labels.map((l, i) => (
          <button key={i} style={{ left: `${l.x}%`, top: `${l.y}%` }} onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-[11px] px-1.5 py-0.5 rounded bg-bg/85 border border-accent">{l.text}</button>))}
      </div>
      {open !== null && d.labels[open].desc && <p className="mt-2 text-sm text-muted" aria-live="polite">{d.labels[open].desc}</p>}
      {d.image && <figcaption className="mt-2 text-xs text-subtle">Image{d.imageAuthor ? ` by ${d.imageAuthor}` : ''}{d.imageLicense ? `, ${d.imageLicense}` : ''}
        {d.imageSource && <> · <a className="underline" href={d.imageSource} target="_blank" rel="noopener noreferrer">source</a></>}</figcaption>}
    </figure>)
}

// Generic, schematic (not to scale) cross-sections. Colors: die #9ca3af, substrate green, IHS silver, TIM pink, metal gold.
const C = { die: '#6b7280', sub: '#166534', ihs: '#cbd5e1', tim: '#f9a8d4', gold: '#d4a84b', mold: '#27272a', pcb: '#14532d', epoxy: '#3f3f46' }
type Part = { key: string; name: string; desc: string }
const PARTS: Record<PkgType, Part[]> = {
  LGA: [
    { key: 'ihs', name: 'Integrated heat spreader (IHS)', desc: 'Metal lid that protects the die and spreads heat to the cooler.' },
    { key: 'tim', name: 'Thermal interface material (TIM)', desc: 'Solder or thermal paste between die and lid that conducts heat.' },
    { key: 'die', name: 'Silicon die', desc: 'The actual chip: transistors and wiring, mounted flip-chip (face down).' },
    { key: 'bumps', name: 'Micro-bumps', desc: 'Tiny solder bumps connecting the flipped die to the substrate.' },
    { key: 'sub', name: 'Package substrate', desc: 'Layered circuit board that fans out die connections to the pads.' },
    { key: 'pads', name: 'Lands (flat pads)', desc: 'Flat contacts on the underside; the pins are in the motherboard socket.' }],
  PGA: [
    { key: 'ihs', name: 'Integrated heat spreader (IHS)', desc: 'Metal lid that protects the die and spreads heat to the cooler.' },
    { key: 'tim', name: 'Thermal interface material (TIM)', desc: 'Material between die and lid that conducts heat.' },
    { key: 'die', name: 'Silicon die', desc: 'The actual chip, mounted face down on the substrate.' },
    { key: 'sub', name: 'Package substrate', desc: 'Circuit layers that route die signals to the pins.' },
    { key: 'pins', name: 'Pins', desc: 'Pins on the package that plug into holes in the socket.' }],
  BGA: [
    { key: 'mold', name: 'Mold compound / lid', desc: 'Protective encapsulant (some BGAs have a bare die or a lid instead).' },
    { key: 'die', name: 'Silicon die', desc: 'The actual chip.' },
    { key: 'sub', name: 'Package substrate', desc: 'Routes die connections out to the solder balls.' },
    { key: 'balls', name: 'Solder balls', desc: 'A grid of balls soldered directly to the circuit board; not socketed.' },
    { key: 'pcb', name: 'Circuit board', desc: 'The board the package is soldered onto.' }],
  DIP: [
    { key: 'mold', name: 'Package body (plastic or ceramic)', desc: 'Encloses and protects the die.' },
    { key: 'die', name: 'Silicon die', desc: 'The chip, mounted face up on a die pad.' },
    { key: 'wires', name: 'Bond wires', desc: 'Very thin wires connecting pads on the die to the lead frame.' },
    { key: 'frame', name: 'Lead frame', desc: 'Metal frame inside the body that carries signals to the leads.' },
    { key: 'pins', name: 'Leads (two rows)', desc: 'Through-hole pins in two parallel rows: the "dual in-line" package.' }],
  Cartridge: [
    { key: 'shell', name: 'Plastic cartridge shell', desc: 'Housing that covers the processor board; a heatsink mounts on it.' },
    { key: 'die', name: 'Processor package', desc: 'The CPU chip package mounted on the small board.' },
    { key: 'cache', name: 'Cache chips', desc: 'Separate memory chips on the same board (in many slot designs).' },
    { key: 'pcb', name: 'Daughterboard', desc: 'Small circuit board carrying the CPU and other chips.' },
    { key: 'edge', name: 'Edge connector', desc: 'Gold contacts along the edge that plug into the motherboard slot.' }],
}

function Shape({ t, hl }: { t: PkgType; hl: (k: string) => { opacity: number; stroke?: string } }) {
  const r = (k: string, x: number, y: number, w: number, h: number, fill: string) => <rect key={k + x} x={x} y={y} width={w} height={h} fill={fill} {...hl(k)} />
  if (t === 'LGA' || t === 'PGA') return <g>
    {r('ihs', 60, 40, 280, 14, C.ihs)}{r('ihs', 60, 54, 14, 36, C.ihs)}{r('ihs', 326, 54, 14, 36, C.ihs)}
    {r('tim', 140, 54, 120, 8, C.tim)}{r('die', 140, 62, 120, 22, C.die)}
    {t === 'LGA' && Array.from({ length: 12 }, (_, i) => r('bumps', 146 + i * 9.5, 84, 5, 6, C.gold))}
    {r('sub', 40, 90, 320, 26, C.sub)}
    {t === 'LGA' ? Array.from({ length: 16 }, (_, i) => r('pads', 48 + i * 19.5, 116, 12, 4, C.gold)) : Array.from({ length: 16 }, (_, i) => r('pins', 52 + i * 19.5, 116, 3, 34, C.gold))}
  </g>
  if (t === 'BGA') return <g>
    {r('mold', 80, 50, 240, 40, C.mold)}{r('die', 140, 66, 120, 18, C.die)}{r('sub', 70, 90, 260, 18, C.sub)}
    {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={86 + i * 20.5} cy={115} r={7} fill={C.gold} {...hl('balls')} />)}
    {r('pcb', 30, 122, 340, 20, C.pcb)}
  </g>
  if (t === 'DIP') return <g>
    {r('mold', 70, 50, 260, 60, C.mold)}{r('frame', 70, 86, 80, 4, C.gold)}{r('frame', 250, 86, 80, 4, C.gold)}
    {r('die', 165, 72, 70, 14, C.die)}
    <path d="M168 72 Q140 50 130 86 M232 72 Q260 50 270 86" stroke={C.gold} strokeWidth={1.5} fill="none" {...hl('wires')} />
    <path d="M70 88 H50 V150 M330 88 H350 V150" stroke={C.gold} strokeWidth={6} fill="none" {...hl('pins')} />
  </g>
  return <g>
    {r('shell', 40, 30, 320, 16, C.mold)}{r('shell', 40, 46, 12, 70, C.mold)}{r('shell', 348, 46, 12, 70, C.mold)}
    {r('die', 150, 78, 100, 20, C.die)}{r('cache', 80, 84, 50, 14, C.epoxy)}{r('cache', 270, 84, 50, 14, C.epoxy)}
    {r('pcb', 60, 98, 280, 12, C.pcb)}{r('edge', 120, 110, 160, 26, C.gold)}
  </g>
}

export function GenericPackage({ initial }: { initial: PkgType | null }) {
  const [t, setT] = useState<PkgType>(initial ?? 'LGA')
  const [sel, setSel] = useState<string | null>(null)
  const hl = (k: string) => ({ opacity: sel && sel !== k ? 0.3 : 1, stroke: sel === k ? '#4ade80' : undefined })
  return (
    <figure>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <h3 className="text-sm font-semibold">Typical {t === 'Cartridge' ? 'slot cartridge' : t} package</h3>
        {!initial && <><label htmlFor="pkg" className="sr-only">Package type</label>
          <select id="pkg" value={t} onChange={e => { setT(e.target.value as PkgType); setSel(null) }} className="bg-chip border border-border rounded px-2 py-1 text-xs">
            {PKG_TYPES.map(p => <option key={p}>{p}</option>)}</select></>}
      </div>
      <svg viewBox="0 0 400 160" className="w-full bg-card border border-border rounded-md" role="img" aria-label={`Schematic cross-section of a typical ${t} package`}>
        <Shape t={t} hl={hl} />
      </svg>
      <ul className="mt-3 grid sm:grid-cols-2 gap-1">
        {PARTS[t].map(p => <li key={p.key}><button onClick={() => setSel(sel === p.key ? null : p.key)} aria-pressed={sel === p.key}
          className={`w-full text-left text-sm px-2 py-1.5 rounded border ${sel === p.key ? 'border-accent' : 'border-border'}`}>
          <span className="font-medium">{p.name}</span><span className="block text-xs text-muted">{p.desc}</span></button></li>)}
      </ul>
      <figcaption className="mt-2 text-xs text-subtle">Generic schematic, not to scale and not this exact chip. {initial ? '' : 'Package type not specified in the catalog; choose one above.'}</figcaption>
    </figure>)
}
