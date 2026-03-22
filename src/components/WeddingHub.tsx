'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { CATEGORIES, LOCATIONS, INITIAL_BUDGET, INITIAL_TIMELINE, INITIAL_CHAINS, INITIAL_NOTES, BUDGET_STATES, type BudgetItem, type TimelineEvent, type Chain, type ChainStep, type Note } from './data'

const WD = new Date('2026-11-28T12:00:00')
const daysLeft = () => Math.max(0, Math.ceil((WD.getTime() - Date.now()) / 864e5))
const monthsLeft = () => Math.max(0, Math.round(daysLeft() / 30.4))

async function ld(key: string) { try { const r = await fetch(`/api/data?key=${key}`); const d = await r.json(); return d.value } catch { return null } }
async function sv(key: string, value: any) { try { await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }) }) } catch {} }

const MONTH_ORDER: Record<string, number> = { done: 0, now: 0, mar: 1, apr: 2, may: 3, jun: 4, jul: 5, aug: 5, sep: 6, oct: 6, nov: 7, week: 8, night: 8, day: 9, morning: 9, post: 10 }
function whenToIdx(w: string): number {
  const l = w.toLowerCase()
  for (const [k, v] of Object.entries(MONTH_ORDER)) { if (l.includes(k)) return v }
  if (l.includes('pm') || l.includes('am')) return 9
  return 5
}

const MAP_TIMES = [
  { t: '7:30am', pins: [{ loc: 'bride', label: 'Bride \u2014 hair' }, { loc: 'groom', label: 'Groom' }], desc: 'Hair friend arrives at bride\'s house.' },
  { t: '9:00am', pins: [{ loc: 'bride', label: 'Bride \u2014 makeup' }, { loc: 'groom', label: 'Suiting up' }], desc: 'Makeup artist arrives. Bouquets delivered.' },
  { t: '10:30am', pins: [{ loc: 'bride', label: 'Morning photos' }, { loc: 'groom', label: 'Leaving (45 min)' }], desc: 'Groom + groomsmen leave. Bride doing photos.' },
  { t: '10:45am', pins: [{ loc: 'church', label: 'Sprinter arriving' }], desc: 'Sprinter picks up bride. Everyone heading to church.' },
  { t: '11:30am', pins: [{ loc: 'church', label: 'Everyone at church' }], desc: 'Guests being seated. Ceremony soon.' },
  { t: '12:00pm', pins: [{ loc: 'church', label: 'CEREMONY' }], desc: 'Full Catholic mass.' },
  { t: '1:00pm', pins: [{ loc: 'church', label: 'Family photos' }], desc: 'Ceremony ends. Photos outside church.' },
  { t: '1:15pm', pins: [{ loc: 'ripponlea', label: 'To Ripponlea' }, { loc: 'venue', label: 'Guests driving' }], desc: 'Bride + groom to Ripponlea. Guests to venue.' },
  { t: '2:00pm', pins: [{ loc: 'ripponlea', label: 'Photos' }, { loc: 'venue', label: 'Setup crew + DJ' }], desc: 'Photos at Ripponlea. Setup crew at venue.' },
  { t: '3:00pm', pins: [{ loc: 'ripponlea', label: 'Chilling' }, { loc: 'venue', label: 'Setting up' }, { loc: 'hotel', label: 'Bags drop' }], desc: 'Photos done. Venue setup. Hotel bags drop.' },
  { t: '4:00pm', pins: [{ loc: 'venue', label: 'Cocktails + guests' }], desc: 'VENUE OPENS. Cocktail hour.' },
  { t: '5:00pm', pins: [{ loc: 'venue', label: 'GRAND ENTRANCE' }], desc: 'Bride + groom arrive. Everyone inside.' },
  { t: '6:00pm', pins: [{ loc: 'venue', label: 'Dinner' }], desc: 'Sit-down dinner.' },
  { t: '7:40pm', pins: [{ loc: 'venue', label: 'First dance!' }], desc: 'First dance + dance floor opens.' },
  { t: '10:00pm', pins: [{ loc: 'venue', label: 'Pack-down' }], desc: 'Venue closes. Pack-down crew collecting.' },
  { t: '10:15pm', pins: [{ loc: 'hotel', label: 'Arrived!' }], desc: 'Uber to hotel. Bags waiting.' },
]

// Dynamic Leaflet map to avoid SSR issues
const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false, loading: () => <div style={{ height: 220, background: '#f0eeea', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b5b0aa', fontSize: 12 }}>Loading map...</div> })

export default function WeddingHub() {
  const [scr, setScr] = useState('home')
  const [bud, setB] = useState<BudgetItem[] | null>(null)
  const [tl, setTl] = useState<TimelineEvent[] | null>(null)
  const [chains, setCh] = useState<Chain[] | null>(null)
  const [notes, setN] = useState<Note[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [editB, setEB] = useState<string | null>(null)
  const [editTl, setETl] = useState<string | null>(null)
  const [editStep, setES] = useState<{ cid: string, sid: string } | null>(null)
  const [openChains, setOC] = useState<Set<string>>(new Set())
  const [planTab, setPT] = useState<'zone' | 'chains' | 'timeline'>('zone')
  const [dayView, setDV] = useState<'both' | 'bride' | 'groom'>('both')
  const [mapIdx, setMI] = useState(0)
  const [noteText, setNT] = useState('')
  const [addMode, setAM] = useState<{ text: string, catId: string, chainId: string } | null>(null)
  const [inlineText, setIT] = useState<Record<string, string>>({})
  const timer = useRef<NodeJS.Timeout>()

  useEffect(() => { (async () => {
    const [b, t, c, n] = await Promise.all([ld('wb5'), ld('wtl5'), ld('wch5'), ld('wn5')])
    setB(b || INITIAL_BUDGET); setTl(t || INITIAL_TIMELINE); setCh(c || INITIAL_CHAINS); setN(n || INITIAL_NOTES); setLoading(false)
  })() }, [])

  const ds = useCallback((k: string, v: any) => { clearTimeout(timer.current); timer.current = setTimeout(() => sv(k, v), 500) }, [])
  useEffect(() => { if (bud && !loading) ds('wb5', bud) }, [bud])
  useEffect(() => { if (tl && !loading) ds('wtl5', tl) }, [tl])
  useEffect(() => { if (chains && !loading) ds('wch5', chains) }, [chains])
  useEffect(() => { if (notes && !loading) ds('wn5', notes) }, [notes])

  const ub = (id: string, u: Partial<BudgetItem>) => setB(p => p!.map(b => b.id === id ? { ...b, ...u } : b))
  const utl = (id: string, u: Partial<TimelineEvent>) => setTl(p => p!.map(t => t.id === id ? { ...t, ...u } : t))
  const ucs = (cid: string, sid: string, u: Partial<ChainStep>) => setCh(p => p!.map(c => c.id === cid ? { ...c, steps: c.steps.map(s => s.id === sid ? { ...s, ...u } : s) } : c))
  const addStep = (cid: string, what: string) => setCh(p => p!.map(c => c.id === cid ? { ...c, steps: [...c.steps, { id: 's' + Date.now(), what, who: '', when: '', where: '', notes: '', status: 'planned' as const }] } : c))
  const delStep = (cid: string, sid: string) => setCh(p => p!.map(c => c.id === cid ? { ...c, steps: c.steps.filter(s => s.id !== sid) } : c))
  const addChain = (name: string, catId: string) => { const cat = CATEGORIES.find(c => c.id === catId); setCh(p => [...p!, { id: 'ch' + Date.now(), name, color: cat?.color || '#8a8580', catId, span: '', steps: [] }]) }
  const delChain = (id: string) => setCh(p => p!.filter(c => c.id !== id))
  const toggleChain = (id: string) => setOC(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const addNote = () => { if (!noteText.trim()) return; setN(p => [{ id: 'n' + Date.now(), text: noteText.trim(), createdAt: Date.now() }, ...(p || [])]); setNT('') }
  const delNote = (id: string) => setN(p => p!.filter(n => n.id !== id))
  const go = (s: string) => setScr(s)

  if (loading || !bud || !tl || !chains || !notes) return <div style={S.pg}><p style={{ color: '#b5b0aa', textAlign: 'center', marginTop: 80 }}>Loading...</p></div>

  // Computed
  const allSteps = chains.flatMap(c => c.steps.map(s => ({ ...s, chainName: c.name, chainColor: c.color, chainId: c.id, catId: c.catId })))
  const totalSteps = allSteps.length
  const doneSteps = allSteps.filter(s => s.status === 'done').length
  const gapSteps = allSteps.filter(s => s.status === 'gap').length
  const pct = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0
  const tq = bud.reduce((s, b) => s + (b.amt || 0), 0)
  const td = bud.filter(b => b.st === 'deposited' || b.st === 'paid').reduce((s, b) => s + (b.amt || 0), 0)
  const tp = bud.filter(b => b.st === 'paid').reduce((s, b) => s + (b.amt || 0), 0)
  const pill = (bg: string, tx: string): React.CSSProperties => ({ display: 'inline-block', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: bg, color: tx })
  const stCol = (s: string) => s === 'done' ? { bg: '#e8f5ee', tx: '#3a7a5a' } : s === 'gap' ? { bg: '#fef5e7', tx: '#9a7a3a' } : { bg: '#f5f3f0', tx: '#6a6560' }
  const ms = MAP_TIMES[mapIdx]

  const catProgress = CATEGORIES.map(cat => {
    const steps = allSteps.filter(s => s.catId === cat.id)
    return { ...cat, total: steps.length, done: steps.filter(s => s.status === 'done').length }
  }).filter(c => c.total > 0)

  // Parked tasks (notes with a catId that haven't been assigned to a chain)
  const parkedNotes = notes.filter(n => n.catId)
  const focusTasks = allSteps.filter(s => s.status === 'gap').slice(0, 5)

  const reassurance = pct < 10 ? 'You\'ve got the big things locked in. This month is about getting the details moving.'
    : pct < 30 ? `Good momentum! ${doneSteps} steps sorted.`
    : pct < 60 ? 'Over a third done. You\'re well ahead.'
    : pct < 80 ? 'Most planning is behind you. Home stretch.'
    : 'Almost there. Just the final touches.'

  // Sorted chains for timeline (earliest start first)
  const sortedChains = [...chains].sort((a, b) => {
    const aMin = Math.min(...a.steps.map(s => whenToIdx(s.when)), 9)
    const bMin = Math.min(...b.steps.map(s => whenToIdx(s.when)), 9)
    return aMin - bMin
  })

  const Nav = () => <div style={S.nav}>
    {([['home', 'Home', '\ud83c\udfe0'], ['plan', 'The plan', '\ud83d\udccd'], ['day', 'The day', '\u23f0'], ['budget', 'Budget', '\ud83d\udcb0']] as const).map(([s, l, em]) =>
      <div key={s} style={{ ...S.ni, color: scr === s ? '#c97a6a' : '#b5b0aa' }} onClick={() => go(s)}><span style={{ fontSize: 18 }}>{em}</span><span style={{ fontSize: 10, fontWeight: 600 }}>{l}</span></div>
    )}
  </div>

  // ── HOME ──
  if (scr === 'home') {
    // Build donut segments
    let offset = 0
    const circ = 2 * Math.PI * 36 // ~226.2
    const segments = catProgress.map(cat => {
      const sliceArc = (cat.total / totalSteps) * circ
      const doneArc = (cat.done / totalSteps) * circ
      const o = offset; offset += sliceArc
      return { ...cat, sliceArc, doneArc, offset: o }
    })

    return <div style={S.pg}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 500, color: '#4a4540' }}>Hey you two</div>
        <div style={{ fontSize: 12, color: '#b5b0aa' }}>{monthsLeft()} months to go &middot; 28 November 2026</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <svg width="100" height="100" viewBox="0 0 100 100">
          {segments.map(seg => <g key={seg.id}>
            <circle cx="50" cy="50" r="36" fill="none" stroke={seg.color} strokeWidth="14" strokeDasharray={`${seg.sliceArc} ${circ - seg.sliceArc}`} strokeDashoffset={-seg.offset} transform="rotate(-90 50 50)" opacity="0.15" />
            {seg.doneArc > 0 && <circle cx="50" cy="50" r="36" fill="none" stroke={seg.color} strokeWidth="14" strokeDasharray={`${seg.doneArc} ${circ - seg.doneArc}`} strokeDashoffset={-seg.offset} transform="rotate(-90 50 50)" opacity="0.85" strokeLinecap="round" />}
          </g>)}
          <text x="50" y="46" textAnchor="middle" style={{ fontSize: 18, fontWeight: 500, fill: '#4a4540' }}>{pct}%</text>
          <text x="50" y="62" textAnchor="middle" style={{ fontSize: 9, fill: '#b5b0aa' }}>complete</text>
        </svg>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#4a4540' }}>{doneSteps} of {totalSteps} steps done</div>
          {gapSteps > 0 && <div style={{ fontSize: 12, color: '#c97a6a' }}>{gapSteps} gaps need attention</div>}
          <div style={{ fontSize: 12, color: '#b5b0aa', marginTop: 4, lineHeight: 1.4 }}>{reassurance}</div>
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        {catProgress.map(cat => <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: cat.color, flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: '#4a4540', flex: 1 }}>{cat.name}</div>
          <div style={{ fontSize: 11, color: '#b5b0aa', minWidth: 32, textAlign: 'right' }}>{cat.done}/{cat.total}</div>
          <div style={{ width: 40, height: 4, background: cat.color, opacity: 0.15, borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: cat.total ? (cat.done / cat.total) * 100 + '%' : '0%', background: cat.color, borderRadius: 2, opacity: 1 }} />
          </div>
        </div>)}
      </div>
      {focusTasks.length > 0 && <><div style={S.sh}>Focus this month</div>
        {focusTasks.map(t => <div key={t.id} style={{ ...S.cd, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px' }} onClick={() => { setES({ cid: t.chainId, sid: t.id }); go('stepEdit') }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: t.chainColor, flexShrink: 0 }} />
          <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500, color: '#4a4540' }}>{t.what}</div><div style={{ fontSize: 10, color: '#b5b0aa' }}>{t.chainName}</div></div>
          <span style={pill('#fef5e7', '#9a7a3a')}>gap</span>
        </div>)}
      </>}
      <div style={S.sh}>Quick notes</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <input value={noteText} onChange={e => setNT(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNote()} placeholder="Jot something down..." style={{ ...S.ip, flex: 1, marginBottom: 0, fontSize: 13 }} />
        <button style={S.bp} onClick={addNote}>Add</button>
      </div>
      {notes.filter(n => !n.catId).map(n => <div key={n.id} style={{ ...S.cd, display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px', marginBottom: 4 }}>
        <div style={{ flex: 1, fontSize: 12, color: '#4a4540', lineHeight: 1.4 }}>{n.text}</div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: '#6a8aaa', fontWeight: 500, cursor: 'pointer', padding: '2px 6px', borderRadius: 4, border: '0.5px solid #6a8aaa' }} onClick={() => { setAM({ text: n.text, catId: '', chainId: '' }); go('addTask') }}>Make task</div>
          <div style={{ fontSize: 10, color: '#b5b0aa', cursor: 'pointer', padding: '2px 4px' }} onClick={() => delNote(n.id)}>&times;</div>
        </div>
      </div>)}
      <div style={{ height: 80 }} /><Nav />
    </div>
  }

  // ── ADD TASK ──
  if (scr === 'addTask') {
    const am = addMode || { text: '', catId: '', chainId: '' }
    const matching = am.catId ? chains.filter(c => c.catId === am.catId) : chains
    return <div style={S.pg}>
      <button style={{ ...S.bt, marginBottom: 16 }} onClick={() => { setAM(null); go('home') }}>Cancel</button>
      <div style={{ fontSize: 16, fontWeight: 500, color: '#4a4540', marginBottom: 14 }}>Add task</div>
      <div style={S.fl}>What needs doing?</div>
      <input value={am.text} onChange={e => setAM({ ...am, text: e.target.value })} style={{ ...S.ip, fontSize: 13 }} placeholder="Type here..." />
      <div style={S.fl}>Category</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5, marginBottom: 14 }}>
        {CATEGORIES.map(cat => <div key={cat.id} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 16, border: am.catId === cat.id ? '1.5px solid ' + cat.color : '0.5px solid #e0ddd8', color: am.catId === cat.id ? cat.color : '#8a8580', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, background: '#fff' }} onClick={() => setAM({ ...am, catId: cat.id, chainId: '' })}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: cat.color }} />{cat.name}
        </div>)}
      </div>
      {am.catId && <><div style={S.fl}>Add to a workflow? <span style={{ fontWeight: 400, color: '#b5b0aa' }}>optional</span></div>
        {matching.slice(0, 5).map(ch => <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#fff', border: am.chainId === ch.id ? '1.5px solid #c97a6a' : '0.5px solid #eae7e2', borderRadius: 8, marginBottom: 4, cursor: 'pointer' }} onClick={() => setAM({ ...am, chainId: am.chainId === ch.id ? '' : ch.id })}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: ch.color }} />
          <div style={{ fontSize: 12, fontWeight: 500, color: '#4a4540', flex: 1 }}>{ch.name}</div>
          {am.chainId === ch.id && <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="7" fill="#c97a6a" /><path d="M4 7l2 2 4-4" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>}
        </div>)}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#fff', border: !am.chainId ? '1.5px solid #c97a6a' : '0.5px solid #eae7e2', borderRadius: 8, marginTop: 8, cursor: 'pointer' }} onClick={() => setAM({ ...am, chainId: '' })}>
          <div style={{ width: 20, height: 20, borderRadius: 10, background: '#f5f3f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#b5b0aa' }}>P</div>
          <div><div style={{ fontSize: 12, fontWeight: 500, color: '#4a4540' }}>Park in planning zone</div><div style={{ fontSize: 10, color: '#b5b0aa' }}>Sort into a chain later</div></div>
        </div>
      </>}
      <button style={{ ...S.bp, width: '100%', marginTop: 14 }} onClick={() => {
        if (!am.text.trim() || !am.catId) return
        if (am.chainId) { addStep(am.chainId, am.text.trim()) }
        else { setN(p => [{ id: 'n' + Date.now(), text: am.text.trim(), createdAt: Date.now(), catId: am.catId }, ...(p || [])]) }
        setAM(null); go('plan')
      }}>Add task</button>
      <div style={{ height: 80 }} /><Nav />
    </div>
  }

  // ── STEP EDIT ──
  if (scr === 'stepEdit') {
    const ch = chains.find(c => c.id === editStep?.cid); const st = ch?.steps.find(s => s.id === editStep?.sid)
    if (!ch || !st) { go('plan'); return null }
    return <div style={S.pg}>
      <button style={{ ...S.bt, marginBottom: 16 }} onClick={() => { setES(null); go('plan') }}>Back</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}><div style={{ width: 8, height: 8, borderRadius: 4, background: ch.color }} /><div style={{ fontSize: 12, color: ch.color, fontWeight: 500 }}>{ch.name}</div></div>
      <div style={S.fl}>What</div><input value={st.what} onChange={e => ucs(ch.id, st.id, { what: e.target.value })} style={S.ip} />
      <div style={S.fl}>Who</div><input value={st.who} onChange={e => ucs(ch.id, st.id, { who: e.target.value })} placeholder="Unassigned" style={S.ip} />
      <div style={S.fl}>When</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4, marginBottom: 12 }}>{['Mar', 'Apr', 'May', 'Jun', 'Jul+', 'Sep+', 'Nov', 'Day of'].map(m => <div key={m} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 12, border: st.when === m ? '1.5px solid #4a4540' : '0.5px solid #e0ddd8', color: st.when === m ? '#4a4540' : '#8a8580', cursor: 'pointer', background: st.when === m ? '#f5f3f0' : '#fff' }} onClick={() => ucs(ch.id, st.id, { when: st.when === m ? '' : m })}>{m}</div>)}</div>
      <div style={S.fl}>Where</div><input value={st.where} onChange={e => ucs(ch.id, st.id, { where: e.target.value })} style={S.ip} />
      <div style={S.fl}>Day-of time</div><input value={st.dayTime || ''} onChange={e => ucs(ch.id, st.id, { dayTime: e.target.value })} placeholder="e.g. 2:00pm" style={S.ip} />
      <div style={S.fl}>Status</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>{(['done', 'planned', 'gap'] as const).map(s => { const c = stCol(s); return <button key={s} style={{ ...S.bt, flex: 1, fontSize: 12, background: st.status === s ? c.bg : 'transparent', color: st.status === s ? c.tx : '#b5b0aa', borderColor: st.status === s ? c.tx : '#e0ddd8', fontWeight: st.status === s ? 700 : 400 }} onClick={() => ucs(ch.id, st.id, { status: s })}>{s === 'done' ? 'Done' : s === 'gap' ? 'Gap' : 'Planned'}</button> })}</div>
      <div style={S.fl}>Notes</div><textarea value={st.notes} onChange={e => ucs(ch.id, st.id, { notes: e.target.value })} rows={3} style={{ ...S.ip, resize: 'vertical' as const }} />
      <button style={{ ...S.bt, width: '100%', marginTop: 8, color: '#c97a6a', borderColor: '#c97a6a' }} onClick={() => { delStep(ch.id, st.id); setES(null); go('plan') }}>Delete step</button>
      <div style={{ height: 80 }} /><Nav />
    </div>
  }

  // ── THE PLAN ──
  if (scr === 'plan') return <div style={S.pg}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
      <div style={{ fontSize: 20, fontWeight: 500, color: '#4a4540' }}>The plan</div>
      <button style={{ ...S.bt, fontSize: 12, padding: '6px 12px' }} onClick={() => { setAM({ text: '', catId: '', chainId: '' }); go('addTask') }}>+ Add</button>
    </div>
    <div style={{ display: 'flex', gap: 3, marginBottom: 14, marginTop: 8 }}>
      {(['zone', 'chains', 'timeline'] as const).map(t => <button key={t} style={{ ...S.bt, flex: 1, fontSize: 11, background: planTab === t ? '#4a4540' : 'transparent', color: planTab === t ? '#faf8f5' : '#4a4540', border: planTab === t ? 'none' : undefined }} onClick={() => setPT(t)}>{t === 'zone' ? 'Planning zone' : t === 'chains' ? 'Chains' : 'Timeline'}</button>)}
    </div>

    {/* PLANNING ZONE */}
    {planTab === 'zone' && <>
      <div style={{ fontSize: 12, color: '#b5b0aa', marginBottom: 10, lineHeight: 1.4 }}>Tasks parked here aren't in a workflow yet. Assign them when ready.</div>
      {parkedNotes.length === 0 && <div style={{ textAlign: 'center', padding: '24px 0', color: '#b5b0aa', fontSize: 12, fontStyle: 'italic' }}>No parked tasks yet. Use "+ Add" or "Make task" from home to park something here.</div>}
      {CATEGORIES.filter(cat => parkedNotes.some(n => n.catId === cat.id)).map(cat => {
        const items = parkedNotes.filter(n => n.catId === cat.id)
        return <div key={cat.id} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: cat.color }} />
            <div style={{ fontSize: 13, fontWeight: 500, color: '#4a4540' }}>{cat.name}</div>
            <div style={{ fontSize: 10, color: '#b5b0aa', marginLeft: 'auto' }}>{items.length} parked</div>
          </div>
          {items.map(n => <div key={n.id} style={{ ...S.cd, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 3 }}>
            <div style={{ flex: 1, fontSize: 12, color: '#4a4540' }}>{n.text}</div>
            <div style={{ fontSize: 10, color: '#6a8aaa', fontWeight: 500, cursor: 'pointer', padding: '2px 6px', borderRadius: 4, border: '0.5px solid #6a8aaa' }} onClick={() => {
              setAM({ text: n.text, catId: n.catId || '', chainId: '' }); delNote(n.id); go('addTask')
            }}>Assign</div>
            <div style={{ fontSize: 10, color: '#b5b0aa', cursor: 'pointer' }} onClick={() => delNote(n.id)}>&times;</div>
          </div>)}
        </div>
      })}
    </>}

    {/* CHAINS */}
    {planTab === 'chains' && <>
      {chains.map(ch => { const open = openChains.has(ch.id); const d = ch.steps.filter(s => s.status === 'done').length; const gaps = ch.steps.filter(s => s.status === 'gap').length; const pctC = ch.steps.length ? Math.round((d / ch.steps.length) * 100) : 0
        return <div key={ch.id} style={{ marginBottom: 4 }}>
          <div style={{ ...S.cd, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginBottom: open ? 0 : 4, borderRadius: open ? '12px 12px 0 0' : 12 }} onClick={() => toggleChain(ch.id)}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: ch.color, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 500, color: '#4a4540' }}>{ch.name}</div><div style={{ fontSize: 10, color: '#b5b0aa', display: 'flex', gap: 6 }}><span>{ch.span}</span>{gaps > 0 && <span style={{ color: '#c97a6a', fontWeight: 600 }}>{gaps} gaps</span>}</div></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}><div style={{ width: 32, height: 3, background: '#f0eeea', borderRadius: 2, overflow: 'hidden' }}><div style={{ height: '100%', width: pctC + '%', background: ch.color, borderRadius: 2 }} /></div><span style={{ fontSize: 10, color: '#b5b0aa', minWidth: 24, textAlign: 'right' }}>{d}/{ch.steps.length}</span></div>
            <div style={{ color: '#d4d0cc', fontSize: 12, transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'none' }}>&rsaquo;</div>
          </div>
          {open && <div style={{ background: '#fff', border: '1px solid #eae7e2', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '6px 12px 10px', marginBottom: 4 }}>
            {ch.steps.map((st, si) => { const sc = stCol(st.status)
              return <div key={st.id} style={{ display: 'flex', gap: 6, cursor: 'pointer' }} onClick={() => { setES({ cid: ch.id, sid: st.id }); go('stepEdit') }}>
                <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', width: 16, flexShrink: 0 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 3, background: ch.color, marginTop: 6, flexShrink: 0 }} />
                  {si < ch.steps.length - 1 && <div style={{ width: 1, flex: 1, background: ch.color, opacity: .3 }} />}
                </div>
                <div style={{ flex: 1, padding: '4px 8px', marginBottom: 2, borderRadius: 6, fontSize: 12, background: sc.bg, border: st.status === 'gap' ? '1px dashed ' + sc.tx : '0.5px solid transparent' }}>
                  {st.when && <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 5, background: 'rgba(0,0,0,0.04)', color: '#8a8580', marginRight: 3 }}>{st.when}</span>}
                  <span style={{ fontWeight: 500, color: st.status === 'done' ? '#b5b0aa' : '#4a4540', textDecoration: st.status === 'done' ? 'line-through' : 'none' }}>{st.what}</span>
                  {st.who && <div style={{ fontSize: 10, color: '#3a7a5a', fontWeight: 500, marginTop: 1 }}>{st.who}</div>}
                  {st.notes && <div style={{ fontSize: 10, color: st.status === 'gap' ? '#9a7a3a' : '#b5b0aa', marginTop: 1, fontWeight: st.status === 'gap' ? 600 : 400 }}>{st.notes}</div>}
                </div>
              </div> })}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, border: '1.5px solid #d4d0cc', flexShrink: 0 }} />
              <input value={inlineText[ch.id] || ''} onChange={e => setIT(p => ({ ...p, [ch.id]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter' && inlineText[ch.id]?.trim()) { addStep(ch.id, inlineText[ch.id].trim()); setIT(p => ({ ...p, [ch.id]: '' })) } }} placeholder="Add a step..." style={{ flex: 1, border: '0.5px solid #eae7e2', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#4a4540', background: '#fff', fontFamily: "'DM Sans',sans-serif" }} />
              <button style={{ fontSize: 12, fontWeight: 500, color: '#faf8f5', background: '#4a4540', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }} onClick={() => { if (inlineText[ch.id]?.trim()) { addStep(ch.id, inlineText[ch.id].trim()); setIT(p => ({ ...p, [ch.id]: '' })) } }}>Add</button>
            </div>
          </div>}
        </div> })}
      <button style={{ ...S.bp, width: '100%', marginTop: 8 }} onClick={() => { setAM({ text: '', catId: '', chainId: '' }); go('addTask') }}>+ New task</button>
    </>}

    {/* TIMELINE */}
    {planTab === 'timeline' && <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <div style={{ minWidth: 560 }}>
        <div style={{ display: 'flex', paddingLeft: 90, borderBottom: '0.5px solid #eae7e2', paddingBottom: 4, marginBottom: 6 }}>
          {['Mar', 'Apr', 'May', 'Jun', 'Jul+', 'Sep+', 'Nov', 'Wk', 'Day'].map(m => <div key={m} style={{ flex: 1, fontSize: 9, color: '#b5b0aa', fontWeight: 500, textAlign: 'center' }}>{m}</div>)}
        </div>
        {sortedChains.map(ch => {
          const idxs = ch.steps.map(s => whenToIdx(s.when))
          const mn = Math.min(...idxs); const mx = Math.max(...idxs)
          const left = (mn / 10) * 100; const width = Math.max(((mx - mn + 1) / 10) * 100, 6)
          const gaps = ch.steps.filter(s => s.status === 'gap').length
          const d = ch.steps.filter(s => s.status === 'done').length
          const donePct = ch.steps.length ? (d / ch.steps.length) * 100 : 0
          return <div key={ch.id} style={{ display: 'flex', alignItems: 'center', height: 26, cursor: 'pointer' }} onClick={() => { setPT('chains'); if (!openChains.has(ch.id)) toggleChain(ch.id) }}>
            <div style={{ width: 90, fontSize: 10, fontWeight: 500, color: '#4a4540', textAlign: 'right', paddingRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>{ch.name}</div>
            <div style={{ flex: 1, position: 'relative', height: 12 }}>
              <div style={{ position: 'absolute', left: left + '%', width: width + '%', height: 10, top: 1, borderRadius: 5, background: ch.color, opacity: 0.15, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: donePct + '%', background: ch.color, opacity: 0.85, borderRadius: 5 }} />
              </div>
              {gaps > 0 && <div style={{ position: 'absolute', right: 2, top: -2, fontSize: 9, color: '#c97a6a', fontWeight: 500 }}>{gaps}</div>}
            </div>
          </div>
        })}
      </div>
      <div style={{ fontSize: 10, color: '#b5b0aa', marginTop: 6, display: 'flex', gap: 12 }}>
        <span>Solid = done, faded = remaining</span><span style={{ color: '#c97a6a' }}>N = gaps</span>
      </div>
    </div>}
    <div style={{ height: 80 }} /><Nav />
  </div>

  // ── THE DAY ──
  if (scr === 'day') {
    const filtered = tl.filter(e => dayView === 'both' || e.view === 'both' || e.view === dayView || !e.view)
    return <div style={S.pg}>
      <div style={{ fontSize: 20, fontWeight: 500, color: '#4a4540', marginBottom: 4 }}>28th November 2026</div>
      <div style={{ fontSize: 13, color: '#b5b0aa', marginBottom: 12 }}>The day, minute by minute</div>
      {/* Map */}
      <div style={{ background: '#fff', border: '0.5px solid #eae7e2', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
        <LeafletMap locations={LOCATIONS} pins={ms.pins} />
        <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={{ ...S.bt, padding: '4px 10px', fontSize: 14 }} onClick={() => setMI(Math.max(0, mapIdx - 1))}>&larr;</button>
          <div style={{ flex: 1, textAlign: 'center' }}><div style={{ fontSize: 16, fontWeight: 500, color: '#4a4540' }}>{ms.t}</div><div style={{ fontSize: 11, color: '#b5b0aa' }}>{ms.desc}</div></div>
          <button style={{ ...S.bt, padding: '4px 10px', fontSize: 14 }} onClick={() => setMI(Math.min(MAP_TIMES.length - 1, mapIdx + 1))}>&rarr;</button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {(['both', 'bride', 'groom'] as const).map(v => <button key={v} style={{ ...S.bt, flex: 1, fontSize: 11, background: dayView === v ? '#4a4540' : 'transparent', color: dayView === v ? '#faf8f5' : '#4a4540', border: dayView === v ? 'none' : undefined }} onClick={() => setDV(v)}>{v === 'both' ? 'Both' : v === 'bride' ? 'Bride' : 'Groom'}</button>)}
      </div>
      {filtered.map(item => { const c = item.big ? '#3a7a5a' : '#9a9590'
        return <div key={item.id} style={{ display: 'flex', gap: 10, marginBottom: 2 }}>
          <div style={{ width: 52, fontSize: 11, color: '#b5b0aa', textAlign: 'right' as const, paddingTop: item.big ? 12 : 10, flexShrink: 0, fontWeight: 500 }}>{item.t}</div>
          <div style={{ width: 2, background: c, flexShrink: 0, opacity: .25, borderRadius: 1 }} />
          <div style={{ background: item.big ? c : '#fff', border: item.big ? 'none' : '1px solid #eae7e2', borderRadius: 12, padding: item.big ? '12px 16px' : '10px 14px', flex: 1, marginBottom: 4, cursor: 'pointer' }} onClick={() => { setETl(item.id); go('tlEdit') }}>
            <div style={{ fontSize: 13, fontWeight: item.big ? 700 : 500, color: item.big ? '#fff' : '#4a4540' }}>{item.e}</div>
            {item.w && <div style={{ fontSize: 11, color: item.big ? 'rgba(255,255,255,0.7)' : '#b5b0aa', marginTop: 1 }}>{item.w}</div>}
          </div>
        </div> })}
      <button style={{ ...S.bp, width: '100%', marginTop: 8 }} onClick={() => setTl(p => [...p!, { id: 'tl' + Date.now(), t: '', e: 'New event', w: '', view: 'both' }])}>+ Add event</button>
      <div style={{ height: 80 }} /><Nav />
    </div>
  }

  // ── TIMELINE EDIT ──
  if (scr === 'tlEdit') { const item = tl.find(x => x.id === editTl); if (!item) { go('day'); return null }
    return <div style={S.pg}>
      <button style={{ ...S.bt, marginBottom: 16 }} onClick={() => go('day')}>Back</button>
      <div style={S.fl}>Time</div><input value={item.t} onChange={e => utl(item.id, { t: e.target.value })} style={S.ip} />
      <div style={S.fl}>Event</div><input value={item.e} onChange={e => utl(item.id, { e: e.target.value })} style={S.ip} />
      <div style={S.fl}>Who</div><input value={item.w || ''} onChange={e => utl(item.id, { w: e.target.value })} style={S.ip} />
      <div style={S.fl}>View</div><select value={item.view || 'both'} onChange={e => utl(item.id, { view: e.target.value as any })} style={S.ip}><option value="both">Both</option><option value="bride">Bride</option><option value="groom">Groom</option></select>
      <div style={S.fl}>Location</div><select value={item.locId || ''} onChange={e => utl(item.id, { locId: e.target.value })} style={S.ip}><option value="">None</option>{LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><input type="checkbox" checked={!!item.big} onChange={e => utl(item.id, { big: e.target.checked })} id="be" /><label htmlFor="be" style={{ fontSize: 13, color: '#4a4540' }}>Key moment</label></div>
      <button style={{ ...S.bt, width: '100%', color: '#c97a6a', borderColor: '#c97a6a' }} onClick={() => { setTl(p => p!.filter(x => x.id !== item.id)); go('day') }}>Delete</button>
      <div style={{ height: 80 }} /><Nav />
    </div> }

  // ── BUDGET ──
  if (scr === 'budget') return <div style={S.pg}>
    <div style={{ fontSize: 20, fontWeight: 500, color: '#4a4540', marginBottom: 16 }}>$30,000 budget</div>
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      {([['Quoted', tq, '#6a5a8f', '#f0ecf8'], ['Committed', td, '#9a7a3a', '#fef5e7'], ['Paid', tp, '#3a7a5a', '#e8f5ee']] as const).map(([l, v, c, bg]) =>
        <div key={l} style={{ flex: 1, background: bg, borderRadius: 14, padding: '12px 0', textAlign: 'center' as const }}><div style={{ fontSize: 11, color: '#b5b0aa' }}>{l}</div><div style={{ fontSize: 18, fontWeight: 500, color: c }}>${v.toLocaleString()}</div></div>)}
    </div>
    <div style={{ ...S.cd, marginBottom: 16 }}><div style={{ height: 8, background: '#f0eeea', borderRadius: 4, overflow: 'hidden' }}><div style={{ height: '100%', display: 'flex', borderRadius: 4 }}><div style={{ width: `${(tp / 30000) * 100}%`, background: '#3a7a5a' }} /><div style={{ width: `${((td - tp) / 30000) * 100}%`, background: '#c8a43a' }} /><div style={{ width: `${((tq - td) / 30000) * 100}%`, background: '#8a7abf' }} /></div></div><div style={{ fontSize: 12, color: '#b5b0aa', marginTop: 6, textAlign: 'center' }}>${(30000 - tq).toLocaleString()} unallocated</div></div>
    {CATEGORIES.filter(cat => bud.some(b => b.g === cat.id)).map(cat => { const items = bud.filter(b => b.g === cat.id); const tot = items.reduce((s, b) => s + (b.amt || 0), 0)
      return <div key={cat.id} style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><div style={{ width: 8, height: 8, borderRadius: 4, background: cat.color }} /><div style={{ fontSize: 13, fontWeight: 500, color: '#4a4540' }}>{cat.name}</div><div style={{ fontSize: 12, color: '#b5b0aa', marginLeft: 'auto' }}>${tot.toLocaleString()}</div></div>
        {items.map(b => <div key={b.id} style={{ ...S.cd, cursor: 'pointer', padding: '10px 14px', marginBottom: 4 }} onClick={() => { setEB(b.id); go('budgetD') }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><div style={{ fontSize: 13, fontWeight: 500, color: '#4a4540' }}>{b.cat}</div>{b.vendorName && <div style={{ fontSize: 10, color: '#6a8aaa', marginTop: 1 }}>{b.vendorName}</div>}</div>
            <div style={{ textAlign: 'right' as const }}><div style={{ fontSize: 15, fontWeight: 500, color: b.amt ? '#4a4540' : '#d4d0cc' }}>{b.amt ? `$${b.amt.toLocaleString()}` : '$\u2014'}</div><span style={pill(BUDGET_STATES[b.st]?.bg, BUDGET_STATES[b.st]?.tx)}>{BUDGET_STATES[b.st]?.lb}</span></div>
          </div>
        </div>)}
      </div> })}
    <button style={{ ...S.bp, width: '100%', marginTop: 8 }} onClick={() => setB(p => [...p!, { id: 'b' + Date.now(), cat: 'New item', amt: 0, st: 'quoted', n: '', g: 'venue', vendorName: '', vendorPhone: '', vendorEmail: '' }])}>+ Add item</button>
    <div style={{ height: 80 }} /><Nav />
  </div>

  // ── BUDGET DETAIL ──
  if (scr === 'budgetD') { const b = bud.find(x => x.id === editB); if (!b) { go('budget'); return null }
    return <div style={S.pg}>
      <button style={{ ...S.bt, marginBottom: 16 }} onClick={() => go('budget')}>Back</button>
      <div style={S.fl}>Name</div><input value={b.cat} onChange={e => ub(b.id, { cat: e.target.value })} style={S.ip} />
      <div style={S.fl}>Amount ($)</div><input type="number" value={b.amt || ''} onChange={e => ub(b.id, { amt: Number(e.target.value) || 0 })} style={S.ip} />
      <div style={S.fl}>Category</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4, marginBottom: 12 }}>{CATEGORIES.map(c => <div key={c.id} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 12, border: b.g === c.id ? '1.5px solid ' + c.color : '0.5px solid #e0ddd8', color: b.g === c.id ? c.color : '#8a8580', cursor: 'pointer', background: '#fff' }} onClick={() => ub(b.id, { g: c.id })}>{c.name}</div>)}</div>
      <div style={S.fl}>State</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>{Object.entries(BUDGET_STATES).map(([k, v]) => <button key={k} style={{ ...S.bt, flex: 1, fontSize: 12, background: b.st === k ? v.bg : 'transparent', color: b.st === k ? v.tx : '#b5b0aa', borderColor: b.st === k ? v.tx : '#e0ddd8', fontWeight: b.st === k ? 700 : 400 }} onClick={() => ub(b.id, { st: k })}>{v.lb}</button>)}</div>
      <div style={S.fl}>Notes</div><textarea value={b.n || ''} onChange={e => ub(b.id, { n: e.target.value })} rows={2} style={{ ...S.ip, resize: 'vertical' as const }} />
      <div style={{ ...S.sh, marginTop: 4 }}>Vendor contact</div>
      <div style={S.fl}>Name</div><input value={b.vendorName || ''} onChange={e => ub(b.id, { vendorName: e.target.value })} placeholder="e.g. Sarah's Cakes" style={S.ip} />
      <div style={S.fl}>Phone</div><input value={b.vendorPhone || ''} onChange={e => ub(b.id, { vendorPhone: e.target.value })} placeholder="0412 345 678" style={S.ip} />
      <div style={S.fl}>Email</div><input value={b.vendorEmail || ''} onChange={e => ub(b.id, { vendorEmail: e.target.value })} placeholder="vendor@email.com" style={S.ip} />
      <button style={{ ...S.bt, width: '100%', marginTop: 8, color: '#c97a6a', borderColor: '#c97a6a' }} onClick={() => { setB(p => p!.filter(x => x.id !== b.id)); go('budget') }}>Delete</button>
      <div style={{ height: 80 }} /><Nav />
    </div> }

  return null
}

const S: Record<string, React.CSSProperties> = {
  pg: { fontFamily: "'DM Sans',sans-serif", background: '#faf8f5', minHeight: '100vh', padding: '16px 16px 0', maxWidth: 480, margin: '0 auto' },
  cd: { background: '#fff', borderRadius: 12, border: '1px solid #eae7e2', padding: '14px 16px', marginBottom: 8 },
  bt: { background: 'none', border: '1px solid #e0ddd8', borderRadius: 12, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", color: '#4a4540' },
  bp: { background: '#4a4540', color: '#faf8f5', border: 'none', borderRadius: 12, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" },
  ip: { background: '#fff', border: '1px solid #e0ddd8', borderRadius: 12, padding: '10px 14px', fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: '#4a4540', width: '100%', marginBottom: 12, boxSizing: 'border-box' as const },
  fl: { fontSize: 12, color: '#b5b0aa', marginBottom: 4, fontWeight: 500 },
  sh: { fontSize: 11, fontWeight: 500, color: '#b5b0aa', marginBottom: 8, marginTop: 16, textTransform: 'uppercase' as const, letterSpacing: .8 },
  nav: { position: 'fixed' as const, bottom: 0, left: 0, right: 0, background: '#faf8f5', borderTop: '1px solid #eae7e2', display: 'flex', justifyContent: 'space-around', padding: '8px 0 20px', maxWidth: 480, margin: '0 auto', zIndex: 10 },
  ni: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2, cursor: 'pointer', padding: '4px 8px' },
}
