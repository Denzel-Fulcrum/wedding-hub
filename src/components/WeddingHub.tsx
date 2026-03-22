'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { ZONES, STATUSES, BUDGET_STATES, PHASES, BUDGET_CATS, LOCATIONS, INITIAL_TASKS, INITIAL_BUDGET, INITIAL_TIMELINE, INITIAL_CHAINS, type Task, type BudgetItem, type TimelineEvent, type Chain, type ChainStep } from './data'

const WD = new Date('2026-11-28T12:00:00')
const daysLeft = () => Math.max(0, Math.ceil((WD.getTime() - Date.now()) / 864e5))
const curMonth = () => { const d = new Date(); return d.getFullYear() === 2026 ? ['jan','feb','mar','apr','may','jun','jul','jul','sep','sep','nov','nov'][d.getMonth()] : 'mar' }

async function load(key: string) { try { const r = await fetch(`/api/data?key=${key}`); const d = await r.json(); return d.value } catch { return null } }
async function save(key: string, value: any) { try { await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }) }) } catch {} }

const MONTH_IDX: Record<string, number> = { mar: 0, apr: 1, may: 2, jun: 3, jul: 4, sep: 5, nov: 6, week: 7, after: 8 }

// Map time state: who is where at each time
const MAP_STATES = [
  { t: 730, lbl: '7:30am', pins: [{ id: 'bride', x: 18, y: 60, label: 'Bride' }, { id: 'groom', x: 82, y: 82, label: 'Groom' }], desc: 'Hair friend arrives at bride\'s house. Groom relaxing at home.' },
  { t: 900, lbl: '9:00am', pins: [{ id: 'bride', x: 18, y: 60, label: 'Bride + MUA' }, { id: 'groom', x: 82, y: 82, label: 'Groom' }], desc: 'Makeup artist arrives. Bouquets delivered.' },
  { t: 930, lbl: '9:30am', pins: [{ id: 'bride', x: 18, y: 60, label: 'Bride + bridesmaids' }, { id: 'groom', x: 82, y: 82, label: 'Groomsmen suiting up' }], desc: 'Bridesmaids arrive. Everyone getting ready.' },
  { t: 1030, lbl: '10:30am', pins: [{ id: 'bride', x: 18, y: 60, label: 'Bride' }, { id: 'groom', x: 55, y: 55, label: 'Groom en route' }], desc: 'Groom + groomsmen leave (45 min drive). Bride doing photos.' },
  { t: 1045, lbl: '10:45am', pins: [{ id: 'bride', x: 28, y: 42, label: 'Sprinter' }, { id: 'groom', x: 40, y: 30, label: 'Groom arriving' }], desc: 'Sprinter picks up bride. Groom nearing church.' },
  { t: 1130, lbl: '11:30am', pins: [{ id: 'bride', x: 38, y: 22, label: 'Bride' }, { id: 'groom', x: 42, y: 22, label: 'Groom' }, { id: 'guests', x: 35, y: 18, label: '100 guests' }], desc: 'Everyone at church. Guests being seated.' },
  { t: 1200, lbl: '12:00pm', pins: [{ id: 'bride', x: 38, y: 22, label: 'Ceremony' }, { id: 'groom', x: 42, y: 22, label: '' }], desc: 'CEREMONY. Full Catholic mass.' },
  { t: 1300, lbl: '1:00pm', pins: [{ id: 'bride', x: 38, y: 22, label: 'Photos' }, { id: 'groom', x: 42, y: 22, label: '' }, { id: 'guests', x: 35, y: 18, label: 'Guests' }], desc: 'Ceremony ends. Family photos outside church.' },
  { t: 1315, lbl: '1:15pm', pins: [{ id: 'bride', x: 44, y: 48, label: 'To Ripponlea' }, { id: 'groom', x: 46, y: 48, label: '' }, { id: 'guests', x: 58, y: 55, label: 'Guests driving' }], desc: 'Bride + groom in car hire. Bridal party in sprinter. Guests self-driving to venue.' },
  { t: 1400, lbl: '2:00pm', pins: [{ id: 'bride', x: 44, y: 48, label: 'Photos' }, { id: 'groom', x: 46, y: 48, label: '' }, { id: 'setup', x: 72, y: 62, label: 'Setup crew' }, { id: 'florist', x: 74, y: 58, label: 'Florist' }], desc: 'Photos at Ripponlea. Setup crew + florist + DJ at venue.' },
  { t: 1500, lbl: '3:00pm', pins: [{ id: 'bride', x: 44, y: 48, label: 'Chilling' }, { id: 'groom', x: 46, y: 48, label: '' }, { id: 'setup', x: 72, y: 62, label: 'Setting up' }, { id: 'bags', x: 78, y: 12, label: 'Bags drop' }], desc: 'Photos done. Setup at venue. Someone dropping bags at hotel.' },
  { t: 1600, lbl: '4:00pm', pins: [{ id: 'bride', x: 60, y: 58, label: 'En route' }, { id: 'groom', x: 62, y: 58, label: '' }, { id: 'guests', x: 72, y: 62, label: 'Cocktails' }], desc: 'VENUE OPENS. Cocktail hour. Bride + groom heading to venue.' },
  { t: 1700, lbl: '5:00pm', pins: [{ id: 'bride', x: 72, y: 62, label: 'Grand entrance' }, { id: 'groom', x: 74, y: 62, label: '' }, { id: 'guests', x: 70, y: 66, label: 'Everyone' }], desc: 'GRAND ENTRANCE. Everyone at venue.' },
  { t: 1800, lbl: '6:00pm', pins: [{ id: 'bride', x: 72, y: 62, label: 'Dinner' }, { id: 'groom', x: 74, y: 62, label: '' }], desc: 'DINNER. Sit-down.' },
  { t: 1940, lbl: '7:40pm', pins: [{ id: 'bride', x: 72, y: 62, label: 'First dance' }, { id: 'groom', x: 74, y: 62, label: '' }], desc: 'FIRST DANCE. Then dance floor opens!' },
  { t: 2200, lbl: '10:00pm', pins: [{ id: 'bride', x: 72, y: 62, label: 'Pack-down' }, { id: 'groom', x: 74, y: 62, label: '' }, { id: 'crew', x: 70, y: 66, label: 'Crew collecting' }], desc: 'VENUE CLOSES. Pack-down.' },
  { t: 2215, lbl: '10:15pm', pins: [{ id: 'bride', x: 78, y: 12, label: 'Hotel' }, { id: 'groom', x: 80, y: 12, label: '' }], desc: 'Uber to Richmond hotel. Bags waiting.' },
]

export default function WeddingHub() {
  const [scr, setScr] = useState('home')
  const [tasks, setT] = useState<Task[] | null>(null)
  const [bud, setB] = useState<BudgetItem[] | null>(null)
  const [tl, setTl] = useState<TimelineEvent[] | null>(null)
  const [chains, setCh] = useState<Chain[] | null>(null)
  const [ld, setLd] = useState(true)
  const [zone, setZone] = useState<string | null>(null)
  const [editT, setEditT] = useState<string | null>(null)
  const [editB, setEditB] = useState<string | null>(null)
  const [editTl, setEditTl] = useState<string | null>(null)
  const [openChains, setOC] = useState<Set<string>>(new Set())
  const [editStep, setES] = useState<{ chainId: string, stepId: string } | null>(null)
  const [planView, setPV] = useState<'timeline' | 'chains'>('timeline')
  const [dayView, setDV] = useState<'both' | 'bride' | 'groom'>('both')
  const [mapTime, setMT] = useState(730)
  const saveTimer = useRef<NodeJS.Timeout>()

  useEffect(() => { (async () => {
    const [t, b, tl2, ch] = await Promise.all([load('wt'), load('wb'), load('wtl'), load('wch')])
    setT(t || INITIAL_TASKS); setB(b || INITIAL_BUDGET); setTl(tl2 || INITIAL_TIMELINE); setCh(ch || INITIAL_CHAINS); setLd(false)
  })() }, [])

  const ds = useCallback((key: string, val: any) => { clearTimeout(saveTimer.current); saveTimer.current = setTimeout(() => save(key, val), 500) }, [])
  useEffect(() => { if (tasks && !ld) ds('wt', tasks) }, [tasks])
  useEffect(() => { if (bud && !ld) ds('wb', bud) }, [bud])
  useEffect(() => { if (tl && !ld) ds('wtl', tl) }, [tl])
  useEffect(() => { if (chains && !ld) ds('wch', chains) }, [chains])

  const ut = (id: string, u: Partial<Task>) => setT(p => p!.map(t => t.id === id ? { ...t, ...u } : t))
  const ub = (id: string, u: Partial<BudgetItem>) => setB(p => p!.map(b => b.id === id ? { ...b, ...u } : b))
  const utl = (id: string, u: Partial<TimelineEvent>) => setTl(p => p!.map(t => t.id === id ? { ...t, ...u } : t))
  const ucs = (cid: string, sid: string, u: Partial<ChainStep>) => setCh(p => p!.map(c => c.id === cid ? { ...c, steps: c.steps.map(s => s.id === sid ? { ...s, ...u } : s) } : c))
  const addStep = (cid: string) => setCh(p => p!.map(c => c.id === cid ? { ...c, steps: [...c.steps, { id: 's' + Date.now(), what: 'New step', who: '', when: '', where: '', notes: '', status: 'planned' as const }] } : c))
  const delStep = (cid: string, sid: string) => setCh(p => p!.map(c => c.id === cid ? { ...c, steps: c.steps.filter(s => s.id !== sid) } : c))
  const addChain = () => setCh(p => [...p!, { id: 'ch' + Date.now(), name: 'New workflow', color: '#8a8580', span: '', steps: [] }])
  const delChain = (id: string) => setCh(p => p!.filter(c => c.id !== id))
  const uch = (id: string, u: Partial<Chain>) => setCh(p => p!.map(c => c.id === id ? { ...c, ...u } : c))
  const toggleChain = (id: string) => setOC(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })

  if (ld || !tasks || !bud || !tl || !chains) return <div style={S.pg}><p style={{ color: '#b5b0aa', textAlign: 'center', marginTop: 80 }}>Loading...</p></div>

  const hasDep = (t: Task) => t.dep && tasks.find(x => x.id === t.dep)?.status !== 'done'
  const dn = tasks.filter(t => t.status === 'done').length
  const rem = tasks.length - dn
  const cm = curMonth()
  const urgTasks = tasks.filter(t => t.status !== 'done' && (t.phase === cm || PHASES.findIndex(p => p.id === t.phase) < PHASES.findIndex(p => p.id === cm)))
  const tq = bud.reduce((s, b) => s + (b.amt || 0), 0)
  const td = bud.filter(b => b.st === 'deposited' || b.st === 'paid').reduce((s, b) => s + (b.amt || 0), 0)
  const tp = bud.filter(b => b.st === 'paid').reduce((s, b) => s + (b.amt || 0), 0)
  const pill = (bg: string, tx: string): React.CSSProperties => ({ display: 'inline-block', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: bg, color: tx })
  const go = (s: string, z?: string) => { setScr(s); if (z !== undefined) setZone(z) }
  const stColor = (s: ChainStep['status']) => s === 'done' ? { bg: '#e8f5ee', tx: '#3a7a5a' } : s === 'gap' ? { bg: '#fef5e7', tx: '#9a7a3a' } : { bg: '#f5f3f0', tx: '#6a6560' }
  const mapState = MAP_STATES.reduce((best, s) => s.t <= mapTime ? s : best, MAP_STATES[0])

  const Nav = () => <div style={S.nav}>
    {([['home', 'Home', '\ud83c\udfe0'], ['plan', 'The plan', '\ud83d\udccd'], ['day', 'The day', '\u23f0'], ['budget', 'Budget', '\ud83d\udcb0']] as const).map(([s, l, em]) =>
      <div key={s} style={{ ...S.ni, color: scr === s || (scr === 'zone' && s === 'home') || (scr === 'detail' && s === 'home') || (scr === 'tlEdit' && s === 'day') || (scr === 'budgetD' && s === 'budget') || (scr === 'stepEdit' && s === 'plan') || (scr === 'add' && s === 'home') ? '#c97a6a' : '#b5b0aa' }} onClick={() => go(s)}><span style={{ fontSize: 18 }}>{em}</span><span style={{ fontSize: 10, fontWeight: 600 }}>{l}</span></div>
    )}
  </div>

  // ── HOME ──
  if (scr === 'home') return <div style={S.pg}>
    <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
      <div style={{ fontSize: 12, color: '#b5b0aa', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' as const }}>28 November 2026</div>
      <div style={{ fontSize: 56, fontWeight: 700, color: '#4a4540', lineHeight: 1, margin: '4px 0' }}>{daysLeft()}</div>
      <div style={{ fontSize: 14, color: '#b5b0aa' }}>days to go</div>
    </div>
    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
      {([[dn, 'done', '#3a7a5a', '#e8f5ee'], [rem, 'remaining', '#4a4540', '#f5f3f0'], [urgTasks.length, 'this month', '#c97a6a', '#fef0ec']] as const).map(([v, l, c, bg]) =>
        <div key={l} style={{ flex: 1, background: bg, borderRadius: 14, padding: '14px 0', textAlign: 'center' as const }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: c }}>{v}</div><div style={{ fontSize: 11, color: '#b5b0aa', fontWeight: 500 }}>{l}</div>
        </div>)}
    </div>
    {urgTasks.length > 0 && <><div style={S.sh}>This month + overdue</div>
      {urgTasks.slice(0, 6).map(t => <div key={t.id} style={{ ...S.cd, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => { setEditT(t.id); go('detail') }}>
        <div style={S.ck} onClick={e => { e.stopPropagation(); ut(t.id, { status: 'done' }) }} />
        <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 500, color: '#4a4540' }}>{t.task}</div><div style={{ fontSize: 11, color: '#b5b0aa', marginTop: 1 }}>{ZONES.find(z => z.id === t.zone)?.name}</div></div>
      </div>)}
      {urgTasks.length > 6 && <div style={{ fontSize: 12, color: '#c97a6a', textAlign: 'center', padding: 4, fontWeight: 500 }}>+{urgTasks.length - 6} more</div>}
    </>}
    <div style={S.sh}>Planning zones</div>
    {ZONES.map(z => { const zt = tasks.filter(t => t.zone === z.id); const zd = zt.filter(t => t.status === 'done').length; const zp = zt.length ? Math.round((zd / zt.length) * 100) : 0
      return <div key={z.id} style={{ ...S.cd, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => go('zone', z.id)}>
        <span style={{ fontSize: 20 }}>{z.em}</span>
        <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 500, color: '#4a4540' }}>{z.name}</div><div style={{ height: 4, background: '#f0eeea', borderRadius: 2, marginTop: 6 }}><div style={{ height: '100%', width: zp + '%', background: '#c97a6a', borderRadius: 2 }} /></div></div>
        <div style={{ fontSize: 12, color: '#b5b0aa', fontWeight: 500 }}>{zd}/{zt.length}</div><div style={{ color: '#d4d0cc', fontSize: 16 }}>&rsaquo;</div>
      </div> })}
    <button style={{ ...S.bp, width: '100%', marginTop: 12 }} onClick={() => go('add')}>+ Add task</button>
    <div style={{ height: 80 }} /><Nav />
  </div>

  // ── ZONE ──
  if (scr === 'zone') { const z = ZONES.find(z => z.id === zone); const zt = tasks.filter(t => t.zone === zone); const nd = zt.filter(t => t.status !== 'done'); const d = zt.filter(t => t.status === 'done')
    return <div style={S.pg}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}><button style={{ ...S.bt, padding: '6px 12px' }} onClick={() => go('home')}>Back</button><span style={{ fontSize: 22 }}>{z?.em}</span><div><div style={{ fontSize: 17, fontWeight: 700, color: '#4a4540' }}>{z?.name}</div><div style={{ fontSize: 12, color: '#b5b0aa' }}>{d.length}/{zt.length} done</div></div></div>
      {nd.map(t => <div key={t.id} style={{ ...S.cd, display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }} onClick={() => { setEditT(t.id); go('detail') }}>
        <div style={{ ...S.ck, marginTop: 2 }} onClick={e => { e.stopPropagation(); ut(t.id, { status: 'done' }) }} />
        <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 500, color: '#4a4540' }}>{t.task}</div>{t.notes && <div style={{ fontSize: 12, color: '#b5b0aa', marginTop: 3 }}>{t.notes}</div>}
          <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' as const }}><span style={pill(STATUSES[t.status]?.bg, STATUSES[t.status]?.tx)}>{STATUSES[t.status]?.lb}</span>{t.owner && <span style={pill('#f5f3f0', '#8a8580')}>{t.owner}</span>}</div>
        </div></div>)}
      {d.length > 0 && <><div style={{ ...S.sh, marginTop: 12 }}>Completed</div>{d.map(t => <div key={t.id} style={{ ...S.cd, opacity: .45, display: 'flex', alignItems: 'center', gap: 10 }}><div style={S.ckD} onClick={() => ut(t.id, { status: 'not-started' })}><svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" /></svg></div><div style={{ fontSize: 13, color: '#b5b0aa', textDecoration: 'line-through' }}>{t.task}</div></div>)}</>}
      <button style={{ ...S.bp, width: '100%', marginTop: 12 }} onClick={() => go('add')}>+ Add task</button><div style={{ height: 80 }} /><Nav />
    </div> }

  // ── TASK DETAIL ──
  if (scr === 'detail') { const t = tasks.find(x => x.id === editT); if (!t) { go('home'); return null }
    return <div style={S.pg}>
      <button style={{ ...S.bt, marginBottom: 16 }} onClick={() => go(zone ? 'zone' : 'home')}>Back</button>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#4a4540', marginBottom: 16 }}>{t.task}</div>
      <div style={S.fl}>Zone</div><select value={t.zone} onChange={e => ut(t.id, { zone: e.target.value })} style={S.ip}>{ZONES.map(z => <option key={z.id} value={z.id}>{z.em} {z.name}</option>)}</select>
      <div style={S.fl}>Status</div><select value={t.status} onChange={e => ut(t.id, { status: e.target.value })} style={S.ip}>{Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.lb}</option>)}</select>
      <div style={S.fl}>Phase</div><select value={t.phase} onChange={e => ut(t.id, { phase: e.target.value })} style={S.ip}>{PHASES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <div style={S.fl}>Owner</div><input value={t.owner || ''} onChange={e => ut(t.id, { owner: e.target.value })} placeholder="Who's on this?" style={S.ip} />
      <div style={S.fl}>Notes</div><textarea value={t.notes || ''} onChange={e => ut(t.id, { notes: e.target.value })} rows={4} style={{ ...S.ip, resize: 'vertical' as const }} />
      {t.dep && <div style={{ ...S.cd, background: hasDep(t) ? '#fef5e7' : '#e8f5ee', marginTop: 8 }}><div style={{ fontSize: 11, fontWeight: 600, color: hasDep(t) ? '#9a7a3a' : '#3a7a5a', marginBottom: 4 }}>DEPENDENCY</div><div style={{ fontSize: 13, color: '#4a4540' }}>Depends on: <strong>{tasks.find(x => x.id === t.dep)?.task}</strong></div></div>}
      <button style={{ ...S.bt, width: '100%', marginTop: 12, color: '#c97a6a', borderColor: '#c97a6a' }} onClick={() => { setT(p => p!.filter(x => x.id !== t.id)); go(zone ? 'zone' : 'home') }}>Delete task</button>
      <div style={{ height: 80 }} /><Nav />
    </div> }

  // ── ADD TASK ──
  if (scr === 'add') return <AddTask zone={zone} onAdd={(t: Task) => { setT(p => [...p!, { ...t, id: 't' + Date.now() }]); go(zone ? 'zone' : 'home') }} onCancel={() => go(zone ? 'zone' : 'home')} />

  // ── THE PLAN ──
  if (scr === 'plan') {
    if (editStep) {
      const ch = chains.find(c => c.id === editStep.chainId); const st = ch?.steps.find(s => s.id === editStep.stepId)
      if (!ch || !st) { setES(null); return null }
      return <div style={S.pg}>
        <button style={{ ...S.bt, marginBottom: 16 }} onClick={() => setES(null)}>Back</button>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#4a4540', marginBottom: 4 }}>Edit step</div>
        <div style={{ fontSize: 12, color: ch.color, fontWeight: 600, marginBottom: 16 }}>{ch.name}</div>
        <div style={S.fl}>What</div><input value={st.what} onChange={e => ucs(ch.id, st.id, { what: e.target.value })} style={S.ip} />
        <div style={S.fl}>Who</div><input value={st.who} onChange={e => ucs(ch.id, st.id, { who: e.target.value })} placeholder="Unassigned" style={S.ip} />
        <div style={S.fl}>When</div><input value={st.when} onChange={e => ucs(ch.id, st.id, { when: e.target.value })} placeholder="e.g. Apr, Day of" style={S.ip} />
        <div style={S.fl}>Where</div><input value={st.where} onChange={e => ucs(ch.id, st.id, { where: e.target.value })} style={S.ip} />
        <div style={S.fl}>Day-of time</div><input value={st.dayTime || ''} onChange={e => ucs(ch.id, st.id, { dayTime: e.target.value })} placeholder="e.g. 2:00pm" style={S.ip} />
        <div style={S.fl}>Status</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>{(['done', 'planned', 'gap'] as const).map(s => { const c = stColor(s); return <button key={s} style={{ ...S.bt, flex: 1, fontSize: 12, background: st.status === s ? c.bg : 'transparent', color: st.status === s ? c.tx : '#b5b0aa', borderColor: st.status === s ? c.tx : '#e0ddd8', fontWeight: st.status === s ? 700 : 400 }} onClick={() => ucs(ch.id, st.id, { status: s })}>{s === 'done' ? 'Done' : s === 'gap' ? 'Gap' : 'Planned'}</button> })}</div>
        <div style={S.fl}>Notes</div><textarea value={st.notes} onChange={e => ucs(ch.id, st.id, { notes: e.target.value })} rows={3} style={{ ...S.ip, resize: 'vertical' as const }} />
        <button style={{ ...S.bt, width: '100%', marginTop: 8, color: '#c97a6a', borderColor: '#c97a6a' }} onClick={() => { delStep(ch.id, st.id); setES(null) }}>Delete step</button>
        <div style={{ height: 80 }} /><Nav />
      </div>
    }
    return <div style={S.pg}>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#4a4540', marginBottom: 4 }}>The plan</div>
      <div style={{ fontSize: 13, color: '#b5b0aa', marginBottom: 12 }}>Every workflow, start to finish</div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        <button style={{ ...S.bt, flex: 1, fontSize: 12, background: planView === 'timeline' ? '#4a4540' : 'transparent', color: planView === 'timeline' ? '#faf8f5' : '#4a4540', border: planView === 'timeline' ? 'none' : undefined }} onClick={() => setPV('timeline')}>Timeline</button>
        <button style={{ ...S.bt, flex: 1, fontSize: 12, background: planView === 'chains' ? '#4a4540' : 'transparent', color: planView === 'chains' ? '#faf8f5' : '#4a4540', border: planView === 'chains' ? 'none' : undefined }} onClick={() => setPV('chains')}>Chains</button>
      </div>
      {planView === 'timeline' && <div style={{ overflowX: 'auto', marginBottom: 8, paddingBottom: 8 }}>
        <div style={{ minWidth: 600 }}>
          <div style={{ display: 'flex', paddingLeft: 90, borderBottom: '0.5px solid #eae7e2', paddingBottom: 4, marginBottom: 4 }}>
            {['Mar', 'Apr', 'May', 'Jun', 'Jul-Aug', 'Sep-Oct', 'Nov', 'Wk', 'Day'].map(m => <div key={m} style={{ flex: 1, fontSize: 9, color: '#b5b0aa', fontWeight: 500, textAlign: 'center' }}>{m}</div>)}
          </div>
          {chains.map(ch => { const gaps = ch.steps.filter(s => s.status === 'gap').length; const d = ch.steps.filter(s => s.status === 'done').length
            const starts = ch.steps.map(s => { const w = s.when.toLowerCase(); if (w.includes('done') || w.includes('now') || w.includes('mar')) return 0; if (w.includes('apr')) return 1; if (w.includes('may')) return 2; if (w.includes('jun')) return 3; if (w.includes('jul') || w.includes('aug')) return 4; if (w.includes('sep') || w.includes('oct')) return 5; if (w.includes('nov') || w.includes('night') || w.includes('week')) return 6; if (w.includes('day') || w.includes('morning') || w.includes('pm') || w.includes('am')) return 8; if (w.includes('post')) return 8; return 4 })
            const minS = Math.min(...starts); const maxS = Math.max(...starts)
            const left = (minS / 9) * 100; const width = Math.max(((maxS - minS + 1) / 9) * 100, 8)
            return <div key={ch.id} style={{ display: 'flex', alignItems: 'center', height: 26, cursor: 'pointer' }} onClick={() => { setPV('chains'); toggleChain(ch.id) }}>
              <div style={{ width: 90, fontSize: 10, fontWeight: 500, color: '#4a4540', textAlign: 'right', paddingRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>{ch.name}</div>
              <div style={{ flex: 1, position: 'relative', height: 12 }}>
                <div style={{ position: 'absolute', left: left + '%', width: width + '%', height: 10, top: 1, borderRadius: 5, background: ch.color, opacity: 0.7 }} />
                {gaps > 0 && <div style={{ position: 'absolute', right: 4, top: -1, fontSize: 9, color: '#c97a6a', fontWeight: 600 }}>{gaps} gaps</div>}
              </div>
            </div> })}
        </div>
        <div style={{ fontSize: 10, color: '#b5b0aa', marginTop: 8, display: 'flex', gap: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 16, height: 6, borderRadius: 3, background: '#b5b0aa', opacity: 0.5 }}></span>chain span</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ color: '#c97a6a', fontWeight: 600 }}>N gaps</span> = needs action</span>
        </div>
      </div>}
      {planView === 'chains' && <>
        {chains.map(ch => { const open = openChains.has(ch.id); const d = ch.steps.filter(s => s.status === 'done').length; const gaps = ch.steps.filter(s => s.status === 'gap').length; const pct = ch.steps.length ? Math.round((d / ch.steps.length) * 100) : 0
          return <div key={ch.id} style={{ marginBottom: 4 }}>
            <div style={{ ...S.cd, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginBottom: open ? 0 : 4, borderRadius: open ? '12px 12px 0 0' : 12 }} onClick={() => toggleChain(ch.id)}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: ch.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 500, color: '#4a4540' }}>{ch.name}</div><div style={{ fontSize: 10, color: '#b5b0aa', display: 'flex', gap: 6 }}><span>{ch.span}</span>{gaps > 0 && <span style={{ color: '#c97a6a', fontWeight: 600 }}>{gaps} gaps</span>}</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}><div style={{ width: 32, height: 3, background: '#f0eeea', borderRadius: 2, overflow: 'hidden' }}><div style={{ height: '100%', width: pct + '%', background: ch.color, borderRadius: 2 }} /></div><span style={{ fontSize: 10, color: '#b5b0aa', minWidth: 24, textAlign: 'right' }}>{d}/{ch.steps.length}</span></div>
              <div style={{ color: '#d4d0cc', fontSize: 12, transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'none' }}>&rsaquo;</div>
            </div>
            {open && <div style={{ background: '#fff', border: '1px solid #eae7e2', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '6px 12px 10px', marginBottom: 4 }}>
              {ch.steps.map((st, si) => { const sc = stColor(st.status)
                return <div key={st.id} style={{ display: 'flex', gap: 6, cursor: 'pointer' }} onClick={() => setES({ chainId: ch.id, stepId: st.id })}>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', width: 16, flexShrink: 0 }}>
                    <div style={{ width: 6, height: 6, borderRadius: 3, background: ch.color, marginTop: 6, flexShrink: 0 }} />
                    {si < ch.steps.length - 1 && <div style={{ width: 1, flex: 1, background: ch.color, opacity: 0.3 }} />}
                  </div>
                  <div style={{ flex: 1, padding: '4px 8px', marginBottom: 2, borderRadius: 6, fontSize: 12, background: sc.bg, border: st.status === 'gap' ? '1px dashed ' + sc.tx : '0.5px solid transparent' }}>
                    {st.when && <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 5, background: 'rgba(0,0,0,0.04)', color: '#8a8580', marginRight: 3 }}>{st.when}</span>}
                    <span style={{ fontWeight: 500, color: st.status === 'done' ? '#b5b0aa' : '#4a4540', textDecoration: st.status === 'done' ? 'line-through' : 'none' }}>{st.what}</span>
                    {st.who && <div style={{ fontSize: 10, color: '#3a7a5a', fontWeight: 500, marginTop: 1 }}>{st.who}</div>}
                    {st.notes && <div style={{ fontSize: 10, color: st.status === 'gap' ? '#9a7a3a' : '#b5b0aa', marginTop: 1, fontWeight: st.status === 'gap' ? 600 : 400 }}>{st.notes}</div>}
                  </div>
                </div> })}
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button style={{ ...S.bt, flex: 1, fontSize: 11, padding: '6px' }} onClick={() => addStep(ch.id)}>+ Add step</button>
                <button style={{ ...S.bt, fontSize: 11, padding: '6px 10px', color: '#c97a6a', borderColor: '#c97a6a' }} onClick={() => { if (confirm('Delete chain?')) delChain(ch.id) }}>Delete</button>
              </div>
            </div>}
          </div> })}
        <button style={{ ...S.bp, width: '100%', marginTop: 8 }} onClick={addChain}>+ New workflow chain</button>
      </>}
      <div style={{ height: 80 }} /><Nav />
    </div>
  }

  // ── THE DAY ──
  if (scr === 'day') {
    const filteredTl = tl.filter(e => dayView === 'both' || e.view === 'both' || e.view === dayView || !e.view)
    return <div style={S.pg}>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#4a4540', marginBottom: 4 }}>28th November 2026</div>
      <div style={{ fontSize: 13, color: '#b5b0aa', marginBottom: 12 }}>The day, minute by minute</div>
      {/* Map */}
      <div style={{ background: '#fff', border: '0.5px solid #eae7e2', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ position: 'relative', height: 220, background: '#f5f3f0', overflow: 'hidden' }}>
          <svg width="100%" height="100%" style={{ position: 'absolute' }}>{LOCATIONS.map((a, i) => LOCATIONS.slice(i + 1).map(b => <line key={a.id + b.id} x1={((a.lng - 144.95) / 0.2) * 100 + '%'} y1={((a.lat + 37.8) / -0.2) * 100 + '%'} x2={((b.lng - 144.95) / 0.2) * 100 + '%'} y2={((b.lat + 37.8) / -0.2) * 100 + '%'} stroke="#d4d0cc" strokeWidth="0.5" strokeDasharray="4 3" />))}</svg>
          {LOCATIONS.map(loc => <div key={loc.id} style={{ position: 'absolute', left: ((loc.lng - 144.95) / 0.2) * 100 + '%', top: ((loc.lat + 37.8) / -0.2) * 100 + '%', transform: 'translate(-50%,-50%)', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ width: 20, height: 20, borderRadius: 10, border: '1.5px solid #eae7e2', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}><div style={{ width: 8, height: 8, borderRadius: 4, background: loc.color }} /></div>
            <div style={{ fontSize: 8, fontWeight: 500, color: '#8a8580', whiteSpace: 'nowrap', background: 'rgba(250,248,245,0.8)', padding: '0 3px', borderRadius: 3 }}>{loc.name}</div>
          </div>)}
          {mapState.pins.map(pin => pin.label ? <div key={pin.id} style={{ position: 'absolute', left: pin.x + '%', top: pin.y + '%', zIndex: 3, transition: 'all 0.4s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <div style={{ width: 10, height: 10, borderRadius: 5, background: pin.id === 'bride' ? '#c97a6a' : pin.id === 'groom' ? '#9a7a3a' : '#6a8aaa', border: '2px solid #fff' }} />
            <div style={{ fontSize: 8, fontWeight: 600, color: '#fff', background: pin.id === 'bride' ? '#c97a6a' : pin.id === 'groom' ? '#9a7a3a' : '#6a8aaa', padding: '0 4px', borderRadius: 4, whiteSpace: 'nowrap' }}>{pin.label}</div>
          </div> : null)}
        </div>
        <div style={{ padding: '8px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#4a4540', minWidth: 60 }}>{mapState.lbl}</div>
            <input type="range" min="730" max="2215" value={mapTime} step="15" onChange={e => setMT(parseInt(e.target.value))} style={{ flex: 1 }} />
          </div>
          <div style={{ fontSize: 11, color: '#b5b0aa', lineHeight: 1.4 }}>{mapState.desc}</div>
        </div>
      </div>
      {/* View toggle */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {(['both', 'bride', 'groom'] as const).map(v => <button key={v} style={{ ...S.bt, flex: 1, fontSize: 11, background: dayView === v ? '#4a4540' : 'transparent', color: dayView === v ? '#faf8f5' : '#4a4540', border: dayView === v ? 'none' : undefined }} onClick={() => setDV(v)}>{v === 'both' ? 'Both' : v === 'bride' ? 'Bride' : 'Groom'}</button>)}
      </div>
      {/* Timeline */}
      {filteredTl.map(item => { const c = item.big ? '#3a7a5a' : '#9a9590'
        return <div key={item.id} style={{ display: 'flex', gap: 10, marginBottom: 2 }}>
          <div style={{ width: 56, fontSize: 11, color: '#b5b0aa', textAlign: 'right' as const, paddingTop: item.big ? 12 : 10, flexShrink: 0, fontWeight: 500 }}>{item.t}</div>
          <div style={{ width: 2, background: c, flexShrink: 0, opacity: .25, borderRadius: 1 }} />
          <div style={{ background: item.big ? c : '#fff', border: item.big ? 'none' : '1px solid #eae7e2', borderRadius: 12, padding: item.big ? '12px 16px' : '10px 14px', flex: 1, marginBottom: 4, cursor: 'pointer' }} onClick={() => { setEditTl(item.id); go('tlEdit') }}>
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
      <div style={{ fontSize: 18, fontWeight: 700, color: '#4a4540', marginBottom: 16 }}>Edit event</div>
      <div style={S.fl}>Time</div><input value={item.t} onChange={e => utl(item.id, { t: e.target.value })} style={S.ip} />
      <div style={S.fl}>Event</div><input value={item.e} onChange={e => utl(item.id, { e: e.target.value })} style={S.ip} />
      <div style={S.fl}>Who</div><input value={item.w || ''} onChange={e => utl(item.id, { w: e.target.value })} style={S.ip} />
      <div style={S.fl}>View</div><select value={item.view || 'both'} onChange={e => utl(item.id, { view: e.target.value as any })} style={S.ip}><option value="both">Both</option><option value="bride">Bride only</option><option value="groom">Groom only</option></select>
      <div style={S.fl}>Location</div><select value={item.locId || ''} onChange={e => utl(item.id, { locId: e.target.value })} style={S.ip}><option value="">None</option>{LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><input type="checkbox" checked={!!item.big} onChange={e => utl(item.id, { big: e.target.checked })} id="bigev" /><label htmlFor="bigev" style={{ fontSize: 13, color: '#4a4540' }}>Key moment</label></div>
      <button style={{ ...S.bt, width: '100%', color: '#c97a6a', borderColor: '#c97a6a' }} onClick={() => { setTl(p => p!.filter(x => x.id !== item.id)); go('day') }}>Delete</button>
      <div style={{ height: 80 }} /><Nav />
    </div> }

  // ── BUDGET ──
  if (scr === 'budget') return <div style={S.pg}>
    <div style={{ fontSize: 20, fontWeight: 700, color: '#4a4540', marginBottom: 16 }}>$30,000 budget</div>
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      {([['Quoted', tq, '#6a5a8f', '#f0ecf8'], ['Committed', td, '#9a7a3a', '#fef5e7'], ['Paid', tp, '#3a7a5a', '#e8f5ee']] as const).map(([l, v, c, bg]) =>
        <div key={l} style={{ flex: 1, background: bg, borderRadius: 14, padding: '12px 0', textAlign: 'center' as const }}><div style={{ fontSize: 11, color: '#b5b0aa' }}>{l}</div><div style={{ fontSize: 18, fontWeight: 700, color: c }}>${v.toLocaleString()}</div></div>)}
    </div>
    <div style={{ ...S.cd, marginBottom: 16 }}><div style={{ height: 8, background: '#f0eeea', borderRadius: 4, overflow: 'hidden' }}><div style={{ height: '100%', display: 'flex', borderRadius: 4 }}><div style={{ width: `${(tp / 30000) * 100}%`, background: '#3a7a5a' }} /><div style={{ width: `${((td - tp) / 30000) * 100}%`, background: '#c8a43a' }} /><div style={{ width: `${((tq - td) / 30000) * 100}%`, background: '#8a7abf' }} /></div></div><div style={{ fontSize: 12, color: '#b5b0aa', marginTop: 6, textAlign: 'center' }}>${(30000 - tq).toLocaleString()} unallocated</div></div>
    {BUDGET_CATS.map(cat => { const items = bud.filter(b => b.g === cat.id); const catTotal = items.reduce((s, b) => s + (b.amt || 0), 0); if (items.length === 0) return null
      return <div key={cat.id} style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 16 }}>{cat.em}</span><div style={{ fontSize: 13, fontWeight: 600, color: '#4a4540' }}>{cat.name}</div><div style={{ fontSize: 12, color: '#b5b0aa', marginLeft: 'auto' }}>${catTotal.toLocaleString()}</div></div>
        {items.map(b => <div key={b.id} style={{ ...S.cd, cursor: 'pointer', padding: '10px 14px', marginBottom: 4 }} onClick={() => { setEditB(b.id); go('budgetD') }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><div style={{ fontSize: 13, fontWeight: 500, color: '#4a4540' }}>{b.cat}</div>{b.n && <div style={{ fontSize: 11, color: '#b5b0aa', marginTop: 1 }}>{b.n}</div>}{b.vendorName && <div style={{ fontSize: 10, color: '#6a8aaa', marginTop: 2 }}>{b.vendorName}</div>}</div>
            <div style={{ textAlign: 'right' as const }}><div style={{ fontSize: 15, fontWeight: 700, color: b.amt ? '#4a4540' : '#d4d0cc' }}>{b.amt ? `$${b.amt.toLocaleString()}` : '$\u2014'}</div><span style={pill(BUDGET_STATES[b.st]?.bg, BUDGET_STATES[b.st]?.tx)}>{BUDGET_STATES[b.st]?.lb}</span></div>
          </div>
        </div>)}
      </div> })}
    <button style={{ ...S.bp, width: '100%', marginTop: 8 }} onClick={() => setB(p => [...p!, { id: 'b' + Date.now(), cat: 'New item', amt: 0, st: 'quoted', n: '', g: 'other', vendorName: '', vendorPhone: '', vendorEmail: '' }])}>+ Add item</button>
    <div style={{ height: 80 }} /><Nav />
  </div>

  // ── BUDGET DETAIL ──
  if (scr === 'budgetD') { const b = bud.find(x => x.id === editB); if (!b) { go('budget'); return null }
    return <div style={S.pg}>
      <button style={{ ...S.bt, marginBottom: 16 }} onClick={() => go('budget')}>Back</button>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#4a4540', marginBottom: 16 }}>{b.cat}</div>
      <div style={S.fl}>Name</div><input value={b.cat} onChange={e => ub(b.id, { cat: e.target.value })} style={S.ip} />
      <div style={S.fl}>Amount ($)</div><input type="number" value={b.amt || ''} onChange={e => ub(b.id, { amt: Number(e.target.value) || 0 })} style={S.ip} />
      <div style={S.fl}>Category</div><select value={b.g || 'other'} onChange={e => ub(b.id, { g: e.target.value })} style={S.ip}>{BUDGET_CATS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <div style={S.fl}>State</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>{Object.entries(BUDGET_STATES).map(([k, v]) => <button key={k} style={{ ...S.bt, flex: 1, fontSize: 12, background: b.st === k ? v.bg : 'transparent', color: b.st === k ? v.tx : '#b5b0aa', borderColor: b.st === k ? v.tx : '#e0ddd8', fontWeight: b.st === k ? 700 : 400 }} onClick={() => ub(b.id, { st: k })}>{v.lb}</button>)}</div>
      <div style={S.fl}>Notes</div><textarea value={b.n || ''} onChange={e => ub(b.id, { n: e.target.value })} rows={2} style={{ ...S.ip, resize: 'vertical' as const }} />
      <div style={{ ...S.sh, marginTop: 8 }}>Vendor contact</div>
      <div style={S.fl}>Vendor name</div><input value={b.vendorName || ''} onChange={e => ub(b.id, { vendorName: e.target.value })} placeholder="e.g. Sarah's Cakes" style={S.ip} />
      <div style={S.fl}>Phone</div><input value={b.vendorPhone || ''} onChange={e => ub(b.id, { vendorPhone: e.target.value })} placeholder="0412 345 678" style={S.ip} />
      <div style={S.fl}>Email</div><input value={b.vendorEmail || ''} onChange={e => ub(b.id, { vendorEmail: e.target.value })} placeholder="vendor@email.com" style={S.ip} />
      <button style={{ ...S.bt, width: '100%', marginTop: 8, color: '#c97a6a', borderColor: '#c97a6a' }} onClick={() => { setB(p => p!.filter(x => x.id !== b.id)); go('budget') }}>Delete</button>
      <div style={{ height: 80 }} /><Nav />
    </div> }

  return null
}

function AddTask({ zone, onAdd, onCancel }: { zone: string | null; onAdd: (t: Task) => void; onCancel: () => void }) {
  const [z, setZ] = useState(zone || 'vendors')
  const [t, setTx] = useState(''); const [n, setN] = useState(''); const [p, setP] = useState('apr')
  return <div style={S.pg}>
    <button style={{ ...S.bt, marginBottom: 16 }} onClick={onCancel}>Cancel</button>
    <div style={{ fontSize: 18, fontWeight: 700, color: '#4a4540', marginBottom: 16 }}>Add task</div>
    <div style={S.fl}>What needs doing?</div><input value={t} onChange={e => setTx(e.target.value)} placeholder="e.g. Source cake vendor" style={S.ip} />
    <div style={S.fl}>Zone</div><select value={z} onChange={e => setZ(e.target.value)} style={S.ip}>{ZONES.map(z => <option key={z.id} value={z.id}>{z.em} {z.name}</option>)}</select>
    <div style={S.fl}>When</div><select value={p} onChange={e => setP(e.target.value)} style={S.ip}>{PHASES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
    <div style={S.fl}>Notes</div><textarea value={n} onChange={e => setN(e.target.value)} rows={3} placeholder="Details..." style={{ ...S.ip, resize: 'vertical' as const }} />
    <button style={{ ...S.bp, width: '100%', marginTop: 4 }} onClick={() => t.trim() && onAdd({ zone: z, task: t.trim(), status: 'not-started', owner: '', dep: '', notes: n.trim(), phase: p, ord: 99, id: '' })}>Add task</button>
    <div style={{ height: 80 }} />
  </div>
}

const S: Record<string, React.CSSProperties> = {
  pg: { fontFamily: "'DM Sans',sans-serif", background: '#faf8f5', minHeight: '100vh', padding: '16px 16px 0', maxWidth: 480, margin: '0 auto' },
  cd: { background: '#fff', borderRadius: 12, border: '1px solid #eae7e2', padding: '14px 16px', marginBottom: 8 },
  bt: { background: 'none', border: '1px solid #e0ddd8', borderRadius: 12, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", color: '#4a4540' },
  bp: { background: '#4a4540', color: '#faf8f5', border: 'none', borderRadius: 12, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" },
  ip: { background: '#fff', border: '1px solid #e0ddd8', borderRadius: 12, padding: '10px 14px', fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: '#4a4540', width: '100%', marginBottom: 12, boxSizing: 'border-box' as const },
  fl: { fontSize: 12, color: '#b5b0aa', marginBottom: 4, fontWeight: 500 },
  sh: { fontSize: 11, fontWeight: 600, color: '#b5b0aa', marginBottom: 8, marginTop: 16, textTransform: 'uppercase' as const, letterSpacing: 0.8 },
  ck: { width: 22, height: 22, borderRadius: 7, border: '2px solid #e0ddd8', flexShrink: 0, cursor: 'pointer' },
  ckD: { width: 22, height: 22, borderRadius: 7, background: '#3a7a5a', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  nav: { position: 'fixed' as const, bottom: 0, left: 0, right: 0, background: '#faf8f5', borderTop: '1px solid #eae7e2', display: 'flex', justifyContent: 'space-around', padding: '8px 0 20px', maxWidth: 480, margin: '0 auto', zIndex: 10 },
  ni: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2, cursor: 'pointer', padding: '4px 8px' },
}
