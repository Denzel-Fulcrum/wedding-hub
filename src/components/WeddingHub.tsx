'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { ZONES, STATUSES, BUDGET_STATES, PHASES, BUDGET_CATS, INITIAL_TASKS, INITIAL_BUDGET, INITIAL_TIMELINE, type Task, type BudgetItem, type TimelineEvent } from './data'

const WD = new Date('2026-11-28T12:00:00')
const daysLeft = () => Math.max(0, Math.ceil((WD.getTime() - Date.now()) / 864e5))

async function load(key: string) {
  try { const r = await fetch(`/api/data?key=${key}`); const d = await r.json(); return d.value } catch { return null }
}
async function save(key: string, value: any) {
  try { await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }) }) } catch {}
}

export default function WeddingHub() {
  const [scr, setScr] = useState('home')
  const [tasks, setT] = useState<Task[] | null>(null)
  const [bud, setB] = useState<BudgetItem[] | null>(null)
  const [tl, setTl] = useState<TimelineEvent[] | null>(null)
  const [ld, setLd] = useState(true)
  const [zone, setZone] = useState<string | null>(null)
  const [editT, setEditT] = useState<string | null>(null)
  const [editB, setEditB] = useState<string | null>(null)
  const [editTl, setEditTl] = useState<string | null>(null)
  const [msgs, setMsgs] = useState<{ r: string; t: string }[]>([])
  const [ci, setCi] = useState('')
  const [cl, setCl] = useState(false)
  const cr = useRef<HTMLDivElement>(null)
  const saveTimer = useRef<NodeJS.Timeout>()

  useEffect(() => {
    (async () => {
      const [t, b, tl2] = await Promise.all([load('wt'), load('wb'), load('wtl')])
      setT(t || INITIAL_TASKS)
      setB(b || INITIAL_BUDGET)
      setTl(tl2 || INITIAL_TIMELINE)
      setLd(false)
    })()
  }, [])

  const debounceSave = useCallback((key: string, val: any) => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(key, val), 500)
  }, [])

  useEffect(() => { if (tasks && !ld) debounceSave('wt', tasks) }, [tasks])
  useEffect(() => { if (bud && !ld) debounceSave('wb', bud) }, [bud])
  useEffect(() => { if (tl && !ld) debounceSave('wtl', tl) }, [tl])
  useEffect(() => { cr.current && (cr.current.scrollTop = cr.current.scrollHeight) }, [msgs])

  const ut = (id: string, u: Partial<Task>) => setT(p => p!.map(t => t.id === id ? { ...t, ...u } : t))
  const ub = (id: string, u: Partial<BudgetItem>) => setB(p => p!.map(b => b.id === id ? { ...b, ...u } : b))
  const utl = (id: string, u: Partial<TimelineEvent>) => setTl(p => p!.map(t => t.id === id ? { ...t, ...u } : t))

  if (ld || !tasks || !bud || !tl) return <div style={S.pg}><p style={{ color: '#b5b0aa', textAlign: 'center', marginTop: 80 }}>Loading your wedding brain...</p></div>

  const hasDep = (t: Task) => t.dep && tasks.find(x => x.id === t.dep)?.status !== 'done'
  const dn = tasks.filter(t => t.status === 'done').length
  const rem = tasks.length - dn
  const urg = tasks.filter(t => t.status !== 'done' && t.phase === 'mar').length
  const tq = bud.reduce((s, b) => s + (b.amt || 0), 0)
  const td = bud.filter(b => b.st === 'deposited' || b.st === 'paid').reduce((s, b) => s + (b.amt || 0), 0)
  const tp = bud.filter(b => b.st === 'paid').reduce((s, b) => s + (b.amt || 0), 0)
  const pill = (bg: string, tx: string) => ({ display: 'inline-block' as const, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: bg, color: tx })
  const go = (s: string, z?: string) => { setScr(s); if (z !== undefined) setZone(z) }

  const moveTask = (id: string, dir: number) => {
    setT(prev => {
      const t = prev!.find(x => x.id === id); if (!t) return prev
      const pi = PHASES.findIndex(p => p.id === t.phase)
      const ni = pi + dir; if (ni < 0 || ni >= PHASES.length) return prev
      return prev!.map(x => x.id === id ? { ...x, phase: PHASES[ni].id } : x)
    })
  }

  const send = async () => {
    if (!ci.trim()) return; const msg = ci.trim(); setCi(''); setMsgs(p => [...p, { r: 'u', t: msg }]); setCl(true)
    try {
      const ctx = `You're a warm wedding planning assistant. Catholic ceremony St Kilda 12pm, 28 Nov 2026. Reception Mentone, ~100 guests, $30k. No coordinator. Groom 45 min from church. Bride's mum wheelchair. MC is Dom (not asked yet). DJ friend. DIY video.\n\nTasks: ${JSON.stringify(tasks.filter(t => t.status !== 'done').slice(0, 20).map(t => ({ task: t.task, status: STATUSES[t.status]?.lb, zone: ZONES.find(z => z.id === t.zone)?.name })))}\n\nBe concise, warm, actionable. Use **bold** for key points. Under 200 words.`
      const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, system: ctx, messages: [{ role: 'user', content: msg }] }) })
      const d = await res.json()
      setMsgs(p => [...p, { r: 'a', t: d.content?.filter((c: any) => c.type === 'text').map((c: any) => c.text).join('\n') || 'Sorry, couldn\'t process that.' }])
    } catch { setMsgs(p => [...p, { r: 'a', t: 'Something went wrong.' }]) }
    setCl(false)
  }

  const fmtMsg = (text: string) => text.split('\n').map((line, i) => {
    let h = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>')
    if (h.startsWith('- ')) h = '\u2022 ' + h.slice(2)
    return <span key={i}><span dangerouslySetInnerHTML={{ __html: h }} />{i < text.split('\n').length - 1 && <br />}</span>
  })

  const Nav = () => <div style={S.nav}>
    {([['home', 'Home', '\ud83c\udfe0'], ['roadmap', 'Roadmap', '\ud83d\udccd'], ['timeline', 'The day', '\u23f0'], ['budget', 'Budget', '\ud83d\udcb0'], ['chat', 'Claude', '\ud83d\udcac']] as const).map(([s, l, em]) =>
      <div key={s} style={{ ...S.ni, color: scr === s ? '#c97a6a' : '#b5b0aa' }} onClick={() => go(s)}><span style={{ fontSize: 18 }}>{em}</span><span style={{ fontSize: 10, fontWeight: 600 }}>{l}</span></div>
    )}
  </div>

  // HOME
  if (scr === 'home') return <div style={S.pg}>
    <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
      <div style={{ fontSize: 12, color: '#b5b0aa', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' as const }}>28 November 2026</div>
      <div style={{ fontSize: 56, fontWeight: 700, color: '#4a4540', lineHeight: 1, margin: '4px 0' }}>{daysLeft()}</div>
      <div style={{ fontSize: 14, color: '#b5b0aa' }}>days to go</div>
    </div>
    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
      {([[dn, 'done', '#3a7a5a', '#e8f5ee'], [rem, 'remaining', '#4a4540', '#f5f3f0'], [urg, 'urgent', '#c97a6a', '#fef0ec']] as const).map(([v, l, c, bg]) =>
        <div key={l} style={{ flex: 1, background: bg, borderRadius: 14, padding: '14px 0', textAlign: 'center' as const }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: c }}>{v}</div>
          <div style={{ fontSize: 11, color: '#b5b0aa', fontWeight: 500 }}>{l}</div>
        </div>
      )}
    </div>
    {tasks.filter(t => t.status !== 'done' && t.phase === 'mar').length > 0 && <>
      <div style={S.sh}>Needs attention now</div>
      {tasks.filter(t => t.status !== 'done' && t.phase === 'mar').slice(0, 6).map(t =>
        <div key={t.id} style={{ ...S.cd, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => { setEditT(t.id); go('detail') }}>
          <div style={S.ck} onClick={e => { e.stopPropagation(); ut(t.id, { status: 'done' }) }} />
          <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 500, color: '#4a4540' }}>{t.task}</div><div style={{ fontSize: 11, color: '#b5b0aa', marginTop: 1 }}>{ZONES.find(z => z.id === t.zone)?.name}</div></div>
        </div>
      )}
    </>}
    <div style={S.sh}>Planning zones</div>
    {ZONES.map(z => { const zt = tasks.filter(t => t.zone === z.id); const zd = zt.filter(t => t.status === 'done').length; const zp = zt.length ? Math.round((zd / zt.length) * 100) : 0
      return <div key={z.id} style={{ ...S.cd, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => go('zone', z.id)}>
        <span style={{ fontSize: 20 }}>{z.em}</span>
        <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 500, color: '#4a4540' }}>{z.name}</div><div style={{ height: 4, background: '#f0eeea', borderRadius: 2, marginTop: 6 }}><div style={{ height: '100%', width: zp + '%', background: '#c97a6a', borderRadius: 2, transition: 'width 0.3s' }} /></div></div>
        <div style={{ fontSize: 12, color: '#b5b0aa', fontWeight: 500 }}>{zd}/{zt.length}</div>
        <div style={{ color: '#d4d0cc', fontSize: 16 }}>&rsaquo;</div>
      </div>
    })}
    <div style={{ height: 80 }} /><Nav />
  </div>

  // ROADMAP
  if (scr === 'roadmap') return <div style={S.pg}>
    <div style={{ fontSize: 20, fontWeight: 700, color: '#4a4540', marginBottom: 4 }}>Your roadmap</div>
    <div style={{ fontSize: 13, color: '#b5b0aa', marginBottom: 20 }}>March through to the big day</div>
    {PHASES.map((ph, pi) => {
      const pt = tasks.filter(t => t.phase === ph.id).sort((a, b) => (a.ord || 0) - (b.ord || 0))
      const nd = pt.filter(t => t.status !== 'done'); const dd = pt.filter(t => t.status === 'done').length
      const allDone = pt.length > 0 && dd === pt.length
      return <div key={ph.id} style={{ marginBottom: 4 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', width: 28 }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, background: allDone ? '#3a7a5a' : ph.color, border: allDone ? 'none' : `2px solid ${ph.color}`, boxSizing: 'border-box' as const, flexShrink: 0 }} />
            {pi < PHASES.length - 1 && <div style={{ width: 2, flex: 1, background: '#eae7e2', marginTop: 4 }} />}
          </div>
          <div style={{ flex: 1, paddingBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: ph.color }}>{ph.name}</div>
              <div style={{ fontSize: 11, color: '#b5b0aa' }}>{dd}/{pt.length}</div>
            </div>
            {nd.map(t => <div key={t.id} style={{ ...S.cd, display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '10px 12px', marginBottom: 4 }} onClick={() => { setEditT(t.id); go('detail') }}>
              <div style={{ ...S.ck, marginTop: 2 }} onClick={e => { e.stopPropagation(); ut(t.id, { status: 'done' }) }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#4a4540' }}>{t.task}</div>
                {t.notes && <div style={{ fontSize: 11, color: '#b5b0aa', marginTop: 2, lineHeight: 1.4 }}>{t.notes}</div>}
                <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' as const }}>
                  <span style={pill(STATUSES[t.status]?.bg, STATUSES[t.status]?.tx)}>{STATUSES[t.status]?.lb}</span>
                  <span style={{ ...pill('#f5f3f0', '#8a8580'), fontSize: 10 }}>{ZONES.find(z => z.id === t.zone)?.em} {ZONES.find(z => z.id === t.zone)?.name}</span>
                  {t.dep && hasDep(t) && <span style={pill('#fef0ec', '#c97a6a')}>Blocked</span>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 2, flexShrink: 0 }}>
                <div style={{ ...S.miniBtn, opacity: pi === 0 ? 0.2 : 1 }} onClick={e => { e.stopPropagation(); moveTask(t.id, -1) }}>&#9650;</div>
                <div style={{ ...S.miniBtn, opacity: pi === PHASES.length - 1 ? 0.2 : 1 }} onClick={e => { e.stopPropagation(); moveTask(t.id, 1) }}>&#9660;</div>
              </div>
            </div>)}
            {dd > 0 && <div style={{ fontSize: 11, color: '#3a7a5a', fontWeight: 500, padding: '2px 0' }}>{dd} completed</div>}
          </div>
        </div>
      </div>
    })}
    <button style={{ ...S.bp, width: '100%', marginTop: 8 }} onClick={() => go('add')}>+ Add task</button>
    <div style={{ height: 80 }} /><Nav />
  </div>

  // ZONE
  if (scr === 'zone') {
    const z = ZONES.find(z => z.id === zone); const zt = tasks.filter(t => t.zone === zone)
    const nd = zt.filter(t => t.status !== 'done'); const d = zt.filter(t => t.status === 'done')
    return <div style={S.pg}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button style={{ ...S.bt, padding: '6px 12px' }} onClick={() => go('home')}>Back</button>
        <span style={{ fontSize: 22 }}>{z?.em}</span>
        <div><div style={{ fontSize: 17, fontWeight: 700, color: '#4a4540' }}>{z?.name}</div><div style={{ fontSize: 12, color: '#b5b0aa' }}>{d.length}/{zt.length} done</div></div>
      </div>
      {nd.map(t => <div key={t.id} style={{ ...S.cd, display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }} onClick={() => { setEditT(t.id); go('detail') }}>
        <div style={{ ...S.ck, marginTop: 2 }} onClick={e => { e.stopPropagation(); ut(t.id, { status: 'done' }) }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#4a4540' }}>{t.task}</div>
          {t.notes && <div style={{ fontSize: 12, color: '#b5b0aa', marginTop: 3, lineHeight: 1.4 }}>{t.notes}</div>}
          <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' as const }}>
            <span style={pill(STATUSES[t.status]?.bg, STATUSES[t.status]?.tx)}>{STATUSES[t.status]?.lb}</span>
            {t.owner && <span style={pill('#f5f3f0', '#8a8580')}>{t.owner}</span>}
          </div>
        </div>
      </div>)}
      {d.length > 0 && <><div style={{ ...S.sh, marginTop: 12 }}>Completed</div>{d.map(t => <div key={t.id} style={{ ...S.cd, opacity: .45, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={S.ckD} onClick={() => ut(t.id, { status: 'not-started' })}><svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" /></svg></div>
        <div style={{ fontSize: 13, color: '#b5b0aa', textDecoration: 'line-through' }}>{t.task}</div>
      </div>)}</>}
      <button style={{ ...S.bp, width: '100%', marginTop: 12 }} onClick={() => go('add')}>+ Add task</button>
      <div style={{ height: 80 }} /><Nav />
    </div>
  }

  // DETAIL
  if (scr === 'detail') {
    const t = tasks.find(x => x.id === editT); if (!t) { go('home'); return null }
    return <div style={S.pg}>
      <button style={{ ...S.bt, marginBottom: 16 }} onClick={() => go(zone ? 'zone' : 'roadmap')}>Back</button>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#4a4540', marginBottom: 16 }}>{t.task}</div>
      <div style={S.fl}>Zone</div><select value={t.zone} onChange={e => ut(t.id, { zone: e.target.value })} style={S.ip}>{ZONES.map(z => <option key={z.id} value={z.id}>{z.em} {z.name}</option>)}</select>
      <div style={S.fl}>Status</div><select value={t.status} onChange={e => ut(t.id, { status: e.target.value })} style={S.ip}>{Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.lb}</option>)}</select>
      <div style={S.fl}>Phase</div><select value={t.phase || 'apr'} onChange={e => ut(t.id, { phase: e.target.value })} style={S.ip}>{PHASES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <div style={S.fl}>Owner</div><input value={t.owner || ''} onChange={e => ut(t.id, { owner: e.target.value })} placeholder="Who's on this?" style={S.ip} />
      <div style={S.fl}>Notes</div><textarea value={t.notes || ''} onChange={e => ut(t.id, { notes: e.target.value })} rows={4} style={{ ...S.ip, resize: 'vertical' as const, lineHeight: 1.5 }} />
      {t.dep && <div style={{ ...S.cd, background: hasDep(t) ? '#fef5e7' : '#e8f5ee', marginTop: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: hasDep(t) ? '#9a7a3a' : '#3a7a5a', marginBottom: 4 }}>DEPENDENCY</div>
        <div style={{ fontSize: 13, color: '#4a4540' }}>Depends on: <strong>{tasks.find(x => x.id === t.dep)?.task}</strong></div>
        <div style={{ fontSize: 12, color: hasDep(t) ? '#c97a6a' : '#3a7a5a', marginTop: 4, fontWeight: 600 }}>{hasDep(t) ? 'Not done yet' : 'Completed'}</div>
      </div>}
      <button style={{ ...S.bt, width: '100%', marginTop: 12, color: '#c97a6a', borderColor: '#c97a6a' }} onClick={() => { setT(p => p!.filter(x => x.id !== t.id)); go(zone ? 'zone' : 'roadmap') }}>Delete task</button>
      <div style={{ height: 80 }} /><Nav />
    </div>
  }

  // ADD
  if (scr === 'add') return <AddTask zone={zone} onAdd={(t: Task) => { setT(p => [...p!, { ...t, id: 't' + Date.now() }]); go(zone ? 'zone' : 'home') }} onCancel={() => go(zone ? 'zone' : 'home')} />

  // TIMELINE
  if (scr === 'timeline') {
    return <div style={S.pg}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div><div style={{ fontSize: 20, fontWeight: 700, color: '#4a4540' }}>28th November 2026</div><div style={{ fontSize: 13, color: '#b5b0aa' }}>Minute by minute</div></div>
        <button style={{ ...S.bt, fontSize: 12, padding: '6px 12px' }} onClick={() => { setTl(p => [...p!, { id: 'tl' + Date.now(), t: '', e: 'New event', w: '' }]); }}>+ Add</button>
      </div>
      {tl.map((item, i) => {
        const c = item.big ? '#3a7a5a' : '#9a9590'
        return <div key={item.id} style={{ display: 'flex', gap: 10, marginBottom: 2 }}>
          <div style={{ width: 56, fontSize: 11, color: '#b5b0aa', textAlign: 'right' as const, paddingTop: item.big ? 12 : 10, flexShrink: 0, fontWeight: 500 }}>{item.t}</div>
          <div style={{ width: 2, background: c, flexShrink: 0, opacity: .25, borderRadius: 1 }} />
          <div style={{ background: item.big ? c : '#fff', border: item.big ? 'none' : '1px solid #eae7e2', borderRadius: 12, padding: item.big ? '12px 16px' : '10px 14px', flex: 1, marginBottom: 4, cursor: 'pointer' }} onClick={() => { setEditTl(item.id); go('tlEdit') }}>
            <div style={{ fontSize: 13, fontWeight: item.big ? 700 : 500, color: item.big ? '#fff' : '#4a4540' }}>{item.e}</div>
            {item.w && <div style={{ fontSize: 11, color: item.big ? 'rgba(255,255,255,0.7)' : '#b5b0aa', marginTop: 1 }}>{item.w}</div>}
          </div>
        </div>
      })}
      <div style={{ height: 80 }} /><Nav />
    </div>
  }

  // TIMELINE EDIT
  if (scr === 'tlEdit') {
    const item = tl.find(x => x.id === editTl); if (!item) { go('timeline'); return null }
    return <div style={S.pg}>
      <button style={{ ...S.bt, marginBottom: 16 }} onClick={() => go('timeline')}>Back</button>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#4a4540', marginBottom: 16 }}>Edit event</div>
      <div style={S.fl}>Time</div><input value={item.t} onChange={e => utl(item.id, { t: e.target.value })} style={S.ip} />
      <div style={S.fl}>Event</div><input value={item.e} onChange={e => utl(item.id, { e: e.target.value })} style={S.ip} />
      <div style={S.fl}>Who</div><input value={item.w || ''} onChange={e => utl(item.id, { w: e.target.value })} style={S.ip} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <input type="checkbox" checked={!!item.big} onChange={e => utl(item.id, { big: e.target.checked })} id="bigev" />
        <label htmlFor="bigev" style={{ fontSize: 13, color: '#4a4540' }}>Key moment (highlighted)</label>
      </div>
      <button style={{ ...S.bt, width: '100%', color: '#c97a6a', borderColor: '#c97a6a' }} onClick={() => { setTl(p => p!.filter(x => x.id !== item.id)); go('timeline') }}>Delete event</button>
      <div style={{ height: 80 }} /><Nav />
    </div>
  }

  // BUDGET
  if (scr === 'budget') {
    const cats = BUDGET_CATS
    return <div style={S.pg}>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#4a4540', marginBottom: 16 }}>$30,000 budget</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {([['\u200bQuoted', tq, '#6a5a8f', '#f0ecf8'], ['\u200bCommitted', td, '#9a7a3a', '#fef5e7'], ['\u200bPaid', tp, '#3a7a5a', '#e8f5ee']] as const).map(([l, v, c, bg]) =>
          <div key={l} style={{ flex: 1, background: bg, borderRadius: 14, padding: '12px 0', textAlign: 'center' as const }}>
            <div style={{ fontSize: 11, color: '#b5b0aa' }}>{l}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: c }}>${v.toLocaleString()}</div>
          </div>
        )}
      </div>
      <div style={{ ...S.cd, marginBottom: 16 }}>
        <div style={{ height: 8, background: '#f0eeea', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', display: 'flex', borderRadius: 4 }}>
            <div style={{ width: `${(tp / 30000) * 100}%`, background: '#3a7a5a' }} />
            <div style={{ width: `${((td - tp) / 30000) * 100}%`, background: '#c8a43a' }} />
            <div style={{ width: `${((tq - td) / 30000) * 100}%`, background: '#8a7abf' }} />
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#b5b0aa', marginTop: 6, textAlign: 'center' as const }}>${(30000 - tq).toLocaleString()} unallocated</div>
      </div>
      {cats.map(cat => {
        const items = bud.filter(b => b.g === cat.id); const catTotal = items.reduce((s, b) => s + (b.amt || 0), 0)
        if (items.length === 0) return null
        return <div key={cat.id} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>{cat.em}</span>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#4a4540' }}>{cat.name}</div>
            <div style={{ fontSize: 12, color: '#b5b0aa', marginLeft: 'auto' }}>${catTotal.toLocaleString()}</div>
          </div>
          {items.map(b => <div key={b.id} style={{ ...S.cd, cursor: 'pointer', padding: '10px 14px', marginBottom: 4 }} onClick={() => { setEditB(b.id); go('budgetD') }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><div style={{ fontSize: 13, fontWeight: 500, color: '#4a4540' }}>{b.cat}</div>{b.n && <div style={{ fontSize: 11, color: '#b5b0aa', marginTop: 1 }}>{b.n}</div>}</div>
              <div style={{ textAlign: 'right' as const }}><div style={{ fontSize: 15, fontWeight: 700, color: b.amt ? '#4a4540' : '#d4d0cc' }}>{b.amt ? `$${b.amt.toLocaleString()}` : '$\u2014'}</div><span style={pill(BUDGET_STATES[b.st]?.bg, BUDGET_STATES[b.st]?.tx)}>{BUDGET_STATES[b.st]?.lb}</span></div>
            </div>
          </div>)}
        </div>
      })}
      <button style={{ ...S.bp, width: '100%', marginTop: 8 }} onClick={() => setB(p => [...p!, { id: 'b' + Date.now(), cat: 'New item', amt: 0, st: 'quoted', n: '', g: 'other' }])}>+ Add item</button>
      <div style={{ height: 80 }} /><Nav />
    </div>
  }

  // BUDGET DETAIL
  if (scr === 'budgetD') {
    const b = bud.find(x => x.id === editB); if (!b) { go('budget'); return null }
    return <div style={S.pg}>
      <button style={{ ...S.bt, marginBottom: 16 }} onClick={() => go('budget')}>Back</button>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#4a4540', marginBottom: 16 }}>{b.cat}</div>
      <div style={S.fl}>Name</div><input value={b.cat} onChange={e => ub(b.id, { cat: e.target.value })} style={S.ip} />
      <div style={S.fl}>Amount ($)</div><input type="number" value={b.amt || ''} onChange={e => ub(b.id, { amt: Number(e.target.value) || 0 })} style={S.ip} />
      <div style={S.fl}>Category</div><select value={b.g || 'other'} onChange={e => ub(b.id, { g: e.target.value })} style={S.ip}>{BUDGET_CATS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <div style={S.fl}>State</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {Object.entries(BUDGET_STATES).map(([k, v]) => <button key={k} style={{ ...S.bt, flex: 1, fontSize: 12, background: b.st === k ? v.bg : 'transparent', color: b.st === k ? v.tx : '#b5b0aa', borderColor: b.st === k ? v.tx : '#e0ddd8', fontWeight: b.st === k ? 700 : 400 }} onClick={() => ub(b.id, { st: k })}>{v.lb}</button>)}
      </div>
      <div style={S.fl}>Notes</div><textarea value={b.n || ''} onChange={e => ub(b.id, { n: e.target.value })} rows={3} style={{ ...S.ip, resize: 'vertical' as const }} />
      <button style={{ ...S.bt, width: '100%', marginTop: 8, color: '#c97a6a', borderColor: '#c97a6a' }} onClick={() => { setB(p => p!.filter(x => x.id !== b.id)); go('budget') }}>Delete</button>
      <div style={{ height: 80 }} /><Nav />
    </div>
  }

  // CHAT
  if (scr === 'chat') return <div style={{ ...S.pg, display: 'flex', flexDirection: 'column' as const, minHeight: '100vh', padding: 0 }}>
    <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #eae7e2' }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: '#4a4540' }}>Ask Claude</div>
      <div style={{ fontSize: 12, color: '#b5b0aa' }}>Your wedding planning buddy</div>
    </div>
    <div ref={cr} style={{ flex: 1, overflow: 'auto', padding: 16 }}>
      {msgs.length === 0 && <div style={{ textAlign: 'center' as const, padding: '40px 16px', color: '#b5b0aa' }}>
        <div style={{ fontSize: 28, marginBottom: 12 }}>{'\ud83d\udc90'}</div>
        <div style={{ fontSize: 14, marginBottom: 16 }}>Ask me anything</div>
        {['What should I ask the venue manager?', 'Affordable cake for 100?', "What's most urgent?"].map(q => <div key={q} style={{ ...S.bt, display: 'inline-block', margin: 4, fontSize: 12, cursor: 'pointer' }} onClick={() => setCi(q)}>{q}</div>)}
      </div>}
      {msgs.map((m, i) => <div key={i} style={{ marginBottom: 12, display: 'flex', justifyContent: m.r === 'u' ? 'flex-end' : 'flex-start' }}>
        <div style={{ maxWidth: '85%', padding: '10px 14px', borderRadius: 16, fontSize: 13, lineHeight: 1.6, background: m.r === 'u' ? '#4a4540' : '#fff', color: m.r === 'u' ? '#fff' : '#4a4540', border: m.r === 'u' ? 'none' : '1px solid #eae7e2' }}>{m.r === 'a' ? fmtMsg(m.t) : m.t}</div>
      </div>)}
      {cl && <div style={{ fontSize: 13, color: '#b5b0aa', padding: 8 }}>Thinking...</div>}
    </div>
    <div style={{ padding: '12px 16px 28px', borderTop: '1px solid #eae7e2', display: 'flex', gap: 8 }}>
      <input value={ci} onChange={e => setCi(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Ask anything..." style={{ ...S.ip, flex: 1, marginBottom: 0 }} />
      <button style={S.bp} onClick={send}>Send</button>
    </div>
    <Nav />
  </div>

  return null
}

function AddTask({ zone, onAdd, onCancel }: { zone: string | null; onAdd: (t: Task) => void; onCancel: () => void }) {
  const [z, setZ] = useState(zone || 'vendors')
  const [t, setTx] = useState('')
  const [n, setN] = useState('')
  const [p, setP] = useState('apr')
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
  cd: { background: '#fff', borderRadius: 14, border: '1px solid #eae7e2', padding: '14px 16px', marginBottom: 8 },
  bt: { background: 'none', border: '1px solid #e0ddd8', borderRadius: 12, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", color: '#4a4540' },
  bp: { background: '#4a4540', color: '#faf8f5', border: 'none', borderRadius: 12, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" },
  ip: { background: '#fff', border: '1px solid #e0ddd8', borderRadius: 12, padding: '10px 14px', fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: '#4a4540', width: '100%', marginBottom: 12, boxSizing: 'border-box' as const },
  fl: { fontSize: 12, color: '#b5b0aa', marginBottom: 4, fontWeight: 500 },
  sh: { fontSize: 11, fontWeight: 600, color: '#b5b0aa', marginBottom: 8, marginTop: 16, textTransform: 'uppercase' as const, letterSpacing: 0.8 },
  ck: { width: 22, height: 22, borderRadius: 7, border: '2px solid #e0ddd8', flexShrink: 0, cursor: 'pointer' },
  ckD: { width: 22, height: 22, borderRadius: 7, background: '#3a7a5a', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  nav: { position: 'fixed' as const, bottom: 0, left: 0, right: 0, background: '#faf8f5', borderTop: '1px solid #eae7e2', display: 'flex', justifyContent: 'space-around', padding: '8px 0 20px', maxWidth: 480, margin: '0 auto', zIndex: 10 },
  ni: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2, cursor: 'pointer', padding: '4px 8px' },
  miniBtn: { width: 20, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#b5b0aa', cursor: 'pointer', borderRadius: 4, border: '1px solid #eae7e2', background: '#faf8f5' },
}
