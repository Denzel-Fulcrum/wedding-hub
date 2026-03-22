'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { CATEGORIES, LOCATIONS, INITIAL_BUDGET, INITIAL_TIMELINE, INITIAL_CHAINS, INITIAL_NOTES, BUDGET_STATES, PHASES, type BudgetItem, type TimelineEvent, type Chain, type ChainStep, type Note } from './data'

const WD = new Date('2026-11-28T12:00:00')
const daysLeft = () => Math.max(0, Math.ceil((WD.getTime() - Date.now()) / 864e5))
const monthsLeft = () => Math.max(0, Math.round(daysLeft() / 30.4))

async function load(key: string) { try { const r = await fetch(`/api/data?key=${key}`); const d = await r.json(); return d.value } catch { return null } }
async function save(key: string, value: any) { try { await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }) }) } catch {} }

const MAP_STATES = [
  {t:730,lbl:'7:30am',pins:[{id:'b',x:18,y:60,l:'Bride — hair'},{id:'g',x:82,y:82,l:'Groom — home'}],desc:'Hair friend arrives at bride\'s house.'},
  {t:900,lbl:'9:00am',pins:[{id:'b',x:18,y:60,l:'Bride — makeup'},{id:'g',x:82,y:82,l:'Groom'}],desc:'Makeup artist arrives. Bouquets delivered.'},
  {t:930,lbl:'9:30am',pins:[{id:'b',x:18,y:60,l:'Bridesmaids arrive'},{id:'g',x:82,y:82,l:'Suiting up'}],desc:'Bridesmaids touch up + dress.'},
  {t:1030,lbl:'10:30am',pins:[{id:'b',x:18,y:60,l:'Bride — photos'},{id:'g',x:55,y:55,l:'Groom en route'}],desc:'Groom leaves (45 min). Bride doing morning photos.'},
  {t:1045,lbl:'10:45am',pins:[{id:'b',x:28,y:42,l:'Sprinter'},{id:'g',x:40,y:30,l:'Arriving'}],desc:'Sprinter picks up bride. Groom nearing church.'},
  {t:1130,lbl:'11:30am',pins:[{id:'b',x:38,y:22,l:'Church'},{id:'g',x:42,y:22,l:''},{id:'x',x:35,y:18,l:'100 guests'}],desc:'Everyone at church. Guests being seated.'},
  {t:1200,lbl:'12:00pm',pins:[{id:'b',x:40,y:22,l:'Ceremony'}],desc:'CEREMONY — Full Catholic mass.'},
  {t:1300,lbl:'1:00pm',pins:[{id:'b',x:38,y:22,l:'Photos'}],desc:'Ceremony ends. Family photos outside.'},
  {t:1315,lbl:'1:15pm',pins:[{id:'b',x:44,y:48,l:'To Ripponlea'},{id:'x',x:58,y:55,l:'Guests driving'}],desc:'Bride + groom to Ripponlea. Guests to venue.'},
  {t:1400,lbl:'2:00pm',pins:[{id:'b',x:44,y:48,l:'Photos'},{id:'s',x:72,y:62,l:'Setup crew'}],desc:'Photos at Ripponlea. Setup crew + florist at venue.'},
  {t:1500,lbl:'3:00pm',pins:[{id:'b',x:44,y:48,l:'Chilling'},{id:'s',x:72,y:62,l:'Setting up'},{id:'h',x:78,y:12,l:'Bags drop'}],desc:'Photos done. Venue setup. Hotel bags drop.'},
  {t:1600,lbl:'4:00pm',pins:[{id:'b',x:60,y:58,l:'En route'},{id:'x',x:72,y:62,l:'Cocktails'}],desc:'VENUE OPENS. Cocktail hour.'},
  {t:1700,lbl:'5:00pm',pins:[{id:'b',x:72,y:62,l:'Grand entrance'}],desc:'GRAND ENTRANCE. Everyone at venue.'},
  {t:1800,lbl:'6:00pm',pins:[{id:'b',x:72,y:62,l:'Dinner'}],desc:'DINNER — sit-down.'},
  {t:1940,lbl:'7:40pm',pins:[{id:'b',x:72,y:62,l:'First dance'}],desc:'FIRST DANCE + dance floor opens!'},
  {t:2200,lbl:'10:00pm',pins:[{id:'b',x:72,y:62,l:'Pack-down'}],desc:'VENUE CLOSES. Pack-down crew collecting.'},
  {t:2215,lbl:'10:15pm',pins:[{id:'b',x:78,y:12,l:'Hotel'}],desc:'Uber to Richmond hotel. Bags waiting.'},
]

export default function WeddingHub() {
  const [scr, setScr] = useState('home')
  const [bud, setB] = useState<BudgetItem[]|null>(null)
  const [tl, setTl] = useState<TimelineEvent[]|null>(null)
  const [chains, setCh] = useState<Chain[]|null>(null)
  const [notes, setN] = useState<Note[]|null>(null)
  const [ld, setLd] = useState(true)
  const [editB, setEB] = useState<string|null>(null)
  const [editTl, setETl] = useState<string|null>(null)
  const [editStep, setES] = useState<{cid:string,sid:string}|null>(null)
  const [openChains, setOC] = useState<Set<string>>(new Set())
  const [planView, setPV] = useState<'timeline'|'chains'>('chains')
  const [dayView, setDV] = useState<'both'|'bride'|'groom'>('both')
  const [mapIdx, setMI] = useState(0)
  const [noteText, setNT] = useState('')
  const [addMode, setAM] = useState<null|{text:string,catId:string,chainId:string}>(null)
  const svt = useRef<NodeJS.Timeout>()

  useEffect(()=>{(async()=>{
    const [b,t,c,n] = await Promise.all([load('wb4'),load('wtl4'),load('wch4'),load('wn4')])
    setB(b||INITIAL_BUDGET); setTl(t||INITIAL_TIMELINE); setCh(c||INITIAL_CHAINS); setN(n||INITIAL_NOTES); setLd(false)
  })()},[])

  const ds = useCallback((k:string,v:any)=>{clearTimeout(svt.current);svt.current=setTimeout(()=>save(k,v),500)},[])
  useEffect(()=>{if(bud&&!ld)ds('wb4',bud)},[bud])
  useEffect(()=>{if(tl&&!ld)ds('wtl4',tl)},[tl])
  useEffect(()=>{if(chains&&!ld)ds('wch4',chains)},[chains])
  useEffect(()=>{if(notes&&!ld)ds('wn4',notes)},[notes])

  const ub=(id:string,u:Partial<BudgetItem>)=>setB(p=>p!.map(b=>b.id===id?{...b,...u}:b))
  const utl=(id:string,u:Partial<TimelineEvent>)=>setTl(p=>p!.map(t=>t.id===id?{...t,...u}:t))
  const ucs=(cid:string,sid:string,u:Partial<ChainStep>)=>setCh(p=>p!.map(c=>c.id===cid?{...c,steps:c.steps.map(s=>s.id===sid?{...s,...u}:s)}:c))
  const addStep=(cid:string,what:string,when?:string,who?:string)=>setCh(p=>p!.map(c=>c.id===cid?{...c,steps:[...c.steps,{id:'s'+Date.now(),what,who:who||'',when:when||'',where:'',notes:'',status:'planned' as const}]}:c))
  const delStep=(cid:string,sid:string)=>setCh(p=>p!.map(c=>c.id===cid?{...c,steps:c.steps.filter(s=>s.id!==sid)}:c))
  const addChain=(name:string,catId:string)=>{const cat=CATEGORIES.find(c=>c.id===catId);setCh(p=>[...p!,{id:'ch'+Date.now(),name,color:cat?.color||'#8a8580',catId,span:'',steps:[]}])}
  const delChain=(id:string)=>setCh(p=>p!.filter(c=>c.id!==id))
  const uch=(id:string,u:Partial<Chain>)=>setCh(p=>p!.map(c=>c.id===id?{...c,...u}:c))
  const toggleChain=(id:string)=>setOC(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n})
  const addNote=()=>{if(!noteText.trim())return;setN(p=>[{id:'n'+Date.now(),text:noteText.trim(),createdAt:Date.now()},...(p||[])]);setNT('')}
  const delNote=(id:string)=>setN(p=>p!.filter(n=>n.id!==id))
  const go=(s:string)=>setScr(s)

  if(ld||!bud||!tl||!chains||!notes) return <div style={S.pg}><p style={{color:'#b5b0aa',textAlign:'center',marginTop:80}}>Loading...</p></div>

  const allSteps=chains.flatMap(c=>c.steps.map(s=>({...s,chainName:c.name,chainColor:c.color,chainId:c.id,catId:c.catId})))
  const doneSteps=allSteps.filter(s=>s.status==='done').length
  const totalSteps=allSteps.length
  const gapSteps=allSteps.filter(s=>s.status==='gap').length
  const pct=totalSteps?Math.round((doneSteps/totalSteps)*100):0
  const tq=bud.reduce((s,b)=>s+(b.amt||0),0)
  const td=bud.filter(b=>b.st==='deposited'||b.st==='paid').reduce((s,b)=>s+(b.amt||0),0)
  const tp=bud.filter(b=>b.st==='paid').reduce((s,b)=>s+(b.amt||0),0)
  const pill=(bg:string,tx:string):React.CSSProperties=>({display:'inline-block',fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:12,background:bg,color:tx})
  const stColor=(s:ChainStep['status'])=>s==='done'?{bg:'#e8f5ee',tx:'#3a7a5a'}:s==='gap'?{bg:'#fef5e7',tx:'#9a7a3a'}:{bg:'#f5f3f0',tx:'#6a6560'}
  const ms=MAP_STATES[mapIdx]

  // progress per category for donut
  const catProgress=CATEGORIES.map(cat=>{const steps=allSteps.filter(s=>s.catId===cat.id);return{...cat,total:steps.length,done:steps.filter(s=>s.status==='done').length}}).filter(c=>c.total>0)
  // focus tasks: gap steps from chains where when includes current-ish timeframes
  const focusTasks=allSteps.filter(s=>s.status==='gap').slice(0,5)

  const reassurance=pct<10?`You've got the big things locked in. This month is about getting the details moving.`
    :pct<30?`Good momentum! ${doneSteps} steps sorted. Keep chipping away.`
    :pct<60?`Over a third done. You're well ahead of schedule.`
    :pct<80?`Most of the planning is behind you. Home stretch.`
    :`Almost there. Just the final touches.`

  const Nav=()=><div style={S.nav}>
    {([['home','Home','\ud83c\udfe0'],['plan','The plan','\ud83d\udccd'],['day','The day','\u23f0'],['budget','Budget','\ud83d\udcb0']] as const).map(([s,l,em])=>
      <div key={s} style={{...S.ni,color:['home','plan','day','budget'].includes(scr)&&scr===s?'#c97a6a':'#b5b0aa'}} onClick={()=>go(s)}><span style={{fontSize:18}}>{em}</span><span style={{fontSize:10,fontWeight:600}}>{l}</span></div>
    )}
  </div>

  // ── HOME ──
  if(scr==='home') return <div style={S.pg}>
    <div style={{marginBottom:20}}>
      <div style={{fontSize:18,fontWeight:500,color:'#4a4540'}}>Hey you two</div>
      <div style={{fontSize:12,color:'#b5b0aa'}}>{monthsLeft()} months to go \u00b7 28 November 2026</div>
    </div>
    {/* Donut + progress */}
    <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:20}}>
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r="36" fill="none" stroke="#f0eeea" strokeWidth="6"/>
        {(()=>{let offset=0;return catProgress.map(cat=>{const arc=(cat.total/totalSteps)*226.2;const el=<circle key={cat.id} cx="45" cy="45" r="36" fill="none" stroke={cat.color} strokeWidth="6" strokeDasharray={`${(cat.done/totalSteps)*226.2} ${226.2-(cat.done/totalSteps)*226.2}`} strokeDashoffset={-offset} strokeLinecap="round" transform="rotate(-90 45 45)" opacity="0.8"/>;offset+=arc;return el})})()}
      </svg>
      <div style={{flex:1}}>
        <div style={{fontSize:24,fontWeight:500,color:'#4a4540'}}>{pct}% done</div>
        <div style={{fontSize:12,color:'#b5b0aa'}}>{doneSteps} of {totalSteps} steps{gapSteps>0?` \u00b7 ${gapSteps} gaps`:''}</div>
        <div style={{fontSize:12,color:'#b5b0aa',marginTop:4,lineHeight:1.4}}>{reassurance}</div>
      </div>
    </div>
    {/* Category legend */}
    <div style={{marginBottom:20}}>
      {catProgress.map(cat=><div key={cat.id} style={{display:'flex',alignItems:'center',gap:8,padding:'3px 0'}}>
        <div style={{width:8,height:8,borderRadius:4,background:cat.color,flexShrink:0}}/>
        <div style={{fontSize:12,color:'#4a4540',flex:1}}>{cat.name}</div>
        <div style={{fontSize:11,color:'#b5b0aa'}}>{cat.done}/{cat.total}</div>
        <div style={{width:40,height:3,background:'#f0eeea',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',width:cat.total?(cat.done/cat.total)*100+'%':'0%',background:cat.color,borderRadius:2}}/></div>
      </div>)}
    </div>
    {/* Focus */}
    {focusTasks.length>0&&<><div style={S.sh}>Focus next</div>
      {focusTasks.map(t=><div key={t.id} style={{...S.cd,display:'flex',alignItems:'center',gap:10,cursor:'pointer',padding:'10px 14px'}} onClick={()=>{setES({cid:t.chainId,sid:t.id});go('stepEdit')}}>
        <div style={{width:8,height:8,borderRadius:4,background:t.chainColor,flexShrink:0}}/>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:'#4a4540'}}>{t.what}</div><div style={{fontSize:10,color:'#b5b0aa'}}>{t.chainName}</div></div>
        <span style={pill('#fef5e7','#9a7a3a')}>gap</span>
      </div>)}
    </>}
    {/* Brain dump */}
    <div style={{...S.sh,marginTop:16}}>Quick notes</div>
    <div style={{display:'flex',gap:6,marginBottom:8}}>
      <input value={noteText} onChange={e=>setNT(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addNote()} placeholder="Jot something down..." style={{...S.ip,flex:1,marginBottom:0,fontSize:13}}/>
      <button style={S.bp} onClick={addNote}>Add</button>
    </div>
    {notes.map(n=><div key={n.id} style={{...S.cd,display:'flex',alignItems:'flex-start',gap:8,padding:'8px 12px',marginBottom:4}}>
      <div style={{flex:1,fontSize:12,color:'#4a4540',lineHeight:1.4}}>{n.text}</div>
      <div style={{display:'flex',gap:4,flexShrink:0}}>
        <div style={{fontSize:10,color:'#6a8aaa',fontWeight:500,cursor:'pointer',padding:'2px 6px',borderRadius:4,border:'0.5px solid #6a8aaa'}} onClick={()=>{setAM({text:n.text,catId:'',chainId:''});go('addTask')}}>Make task</div>
        <div style={{fontSize:10,color:'#b5b0aa',cursor:'pointer',padding:'2px 4px'}} onClick={()=>delNote(n.id)}>&times;</div>
      </div>
    </div>)}
    <div style={{height:80}}/><Nav/>
  </div>

  // ── ADD TASK (from brain dump or + button) ──
  if(scr==='addTask'){
    const am=addMode||{text:'',catId:'',chainId:''}
    const matchingChains=am.catId?chains.filter(c=>c.catId===am.catId):chains
    return <div style={S.pg}>
      <button style={{...S.bt,marginBottom:16}} onClick={()=>{setAM(null);go('home')}}>Cancel</button>
      <div style={{fontSize:16,fontWeight:500,color:'#4a4540',marginBottom:14}}>Add task</div>
      <div style={S.fl}>What needs doing?</div>
      <input value={am.text} onChange={e=>setAM({...am,text:e.target.value})} style={{...S.ip,fontSize:13}} placeholder="Type here..."/>
      <div style={S.fl}>Category</div>
      <div style={{display:'flex',flexWrap:'wrap' as const,gap:5,marginBottom:14}}>
        {CATEGORIES.map(cat=><div key={cat.id} style={{fontSize:11,padding:'5px 10px',borderRadius:16,border:am.catId===cat.id?'1.5px solid '+cat.color:'0.5px solid #e0ddd8',color:am.catId===cat.id?cat.color:'#8a8580',cursor:'pointer',display:'flex',alignItems:'center',gap:4,background:'#fff'}} onClick={()=>setAM({...am,catId:cat.id,chainId:''})}>
          <div style={{width:6,height:6,borderRadius:3,background:cat.color}}/>{cat.name}
        </div>)}
      </div>
      <div style={S.fl}>Add to a workflow? <span style={{fontWeight:400,color:'#b5b0aa'}}>optional</span></div>
      {matchingChains.slice(0,5).map(ch=><div key={ch.id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:'#fff',border:am.chainId===ch.id?'1.5px solid #c97a6a':'0.5px solid #eae7e2',borderRadius:8,marginBottom:4,cursor:'pointer'}} onClick={()=>setAM({...am,chainId:am.chainId===ch.id?'':ch.id})}>
        <div style={{width:8,height:8,borderRadius:4,background:ch.color}}/>
        <div style={{fontSize:12,fontWeight:500,color:'#4a4540',flex:1}}>{ch.name}</div>
        {am.chainId===ch.id&&<svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="7" fill="#c97a6a"/><path d="M4 7l2 2 4-4" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
      </div>)}
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 12px',background:'#fff',border:am.chainId===''&&am.catId?'1.5px solid #c97a6a':'0.5px solid #eae7e2',borderRadius:8,marginBottom:4,cursor:'pointer',marginTop:8}} onClick={()=>setAM({...am,chainId:''})}>
        <div style={{width:20,height:20,borderRadius:10,background:'#f5f3f0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#b5b0aa'}}>P</div>
        <div><div style={{fontSize:12,fontWeight:500,color:'#4a4540'}}>Park it in planning zone</div><div style={{fontSize:10,color:'#b5b0aa'}}>Sort into a chain later</div></div>
      </div>
      <button style={{...S.bp,width:'100%',marginTop:14}} onClick={()=>{
        if(!am.text.trim()||!am.catId)return
        if(am.chainId){addStep(am.chainId,am.text.trim())}
        else{const parked=chains.find(c=>c.name==='Planning zone');if(parked){addStep(parked.id,am.text.trim())}else{addChain('Planning zone',am.catId);setTimeout(()=>setCh(p=>{const pz=p!.find(c=>c.name==='Planning zone');if(pz)return p!.map(c=>c.id===pz.id?{...c,steps:[...c.steps,{id:'s'+Date.now(),what:am.text.trim(),who:'',when:'',where:'',notes:'',status:'planned'}]}:c);return p!}),50)}}
        setAM(null);go('plan')
      }}>Add task</button>
      <div style={{fontSize:10,color:'#b5b0aa',textAlign:'center',marginTop:6}}>Who + when can be added anytime</div>
      <div style={{height:80}}/><Nav/>
    </div>
  }

  // ── STEP EDIT ──
  if(scr==='stepEdit'){
    const ch=chains.find(c=>c.id===editStep?.cid);const st=ch?.steps.find(s=>s.id===editStep?.sid)
    if(!ch||!st){go('plan');return null}
    return <div style={S.pg}>
      <button style={{...S.bt,marginBottom:16}} onClick={()=>{setES(null);go('plan')}}>Back</button>
      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:12}}><div style={{width:8,height:8,borderRadius:4,background:ch.color}}/><div style={{fontSize:12,color:ch.color,fontWeight:500}}>{ch.name}</div></div>
      <div style={S.fl}>What</div><input value={st.what} onChange={e=>ucs(ch.id,st.id,{what:e.target.value})} style={S.ip}/>
      <div style={S.fl}>Who <span style={{fontWeight:400,color:'#b5b0aa'}}>optional</span></div><input value={st.who} onChange={e=>ucs(ch.id,st.id,{who:e.target.value})} placeholder="Unassigned" style={S.ip}/>
      <div style={S.fl}>When <span style={{fontWeight:400,color:'#b5b0aa'}}>optional</span></div>
      <div style={{display:'flex',flexWrap:'wrap' as const,gap:4,marginBottom:12}}>{['Mar','Apr','May','Jun','Jul+','Sep+','Nov','Day of'].map(m=><div key={m} style={{fontSize:11,padding:'4px 10px',borderRadius:12,border:st.when===m?'1.5px solid #4a4540':'0.5px solid #e0ddd8',color:st.when===m?'#4a4540':'#8a8580',cursor:'pointer',background:st.when===m?'#f5f3f0':'#fff'}} onClick={()=>ucs(ch.id,st.id,{when:st.when===m?'':m})}>{m}</div>)}</div>
      <div style={S.fl}>Where <span style={{fontWeight:400,color:'#b5b0aa'}}>optional</span></div><input value={st.where} onChange={e=>ucs(ch.id,st.id,{where:e.target.value})} style={S.ip}/>
      <div style={S.fl}>Day-of time <span style={{fontWeight:400,color:'#b5b0aa'}}>optional</span></div><input value={st.dayTime||''} onChange={e=>ucs(ch.id,st.id,{dayTime:e.target.value})} placeholder="e.g. 2:00pm" style={S.ip}/>
      <div style={S.fl}>Status</div>
      <div style={{display:'flex',gap:6,marginBottom:12}}>{(['done','planned','gap'] as const).map(s=>{const c=stColor(s);return <button key={s} style={{...S.bt,flex:1,fontSize:12,background:st.status===s?c.bg:'transparent',color:st.status===s?c.tx:'#b5b0aa',borderColor:st.status===s?c.tx:'#e0ddd8',fontWeight:st.status===s?700:400}} onClick={()=>ucs(ch.id,st.id,{status:s})}>{s==='done'?'Done':s==='gap'?'Gap':'Planned'}</button>})}</div>
      <div style={S.fl}>Notes</div><textarea value={st.notes} onChange={e=>ucs(ch.id,st.id,{notes:e.target.value})} rows={3} style={{...S.ip,resize:'vertical' as const}}/>
      <button style={{...S.bt,width:'100%',marginTop:8,color:'#c97a6a',borderColor:'#c97a6a'}} onClick={()=>{delStep(ch.id,st.id);setES(null);go('plan')}}>Delete step</button>
      <div style={{height:80}}/><Nav/>
    </div>
  }

  // ── THE PLAN ──
  if(scr==='plan') return <div style={S.pg}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
      <div style={{fontSize:20,fontWeight:500,color:'#4a4540'}}>The plan</div>
      <button style={{...S.bt,fontSize:12,padding:'6px 12px'}} onClick={()=>{setAM({text:'',catId:'',chainId:''});go('addTask')}}>+ Add</button>
    </div>
    <div style={{fontSize:13,color:'#b5b0aa',marginBottom:12}}>Every workflow, start to finish</div>
    <div style={{display:'flex',gap:4,marginBottom:14}}>
      <button style={{...S.bt,flex:1,fontSize:12,background:planView==='chains'?'#4a4540':'transparent',color:planView==='chains'?'#faf8f5':'#4a4540',border:planView==='chains'?'none':undefined}} onClick={()=>setPV('chains')}>Chains</button>
      <button style={{...S.bt,flex:1,fontSize:12,background:planView==='timeline'?'#4a4540':'transparent',color:planView==='timeline'?'#faf8f5':'#4a4540',border:planView==='timeline'?'none':undefined}} onClick={()=>setPV('timeline')}>Timeline</button>
    </div>
    {planView==='timeline'&&<div style={{overflowX:'auto',marginBottom:8,paddingBottom:8}}>
      <div style={{minWidth:600}}>
        <div style={{display:'flex',paddingLeft:90,borderBottom:'0.5px solid #eae7e2',paddingBottom:4,marginBottom:4}}>
          {['Mar','Apr','May','Jun','Jul-Aug','Sep-Oct','Nov','Wk','Day'].map(m=><div key={m} style={{flex:1,fontSize:9,color:'#b5b0aa',fontWeight:500,textAlign:'center'}}>{m}</div>)}
        </div>
        {chains.map(ch=>{
          const starts=ch.steps.map(s=>{const w=s.when.toLowerCase();if(w.includes('done')||w.includes('now')||w.includes('mar'))return 0;if(w.includes('apr'))return 1;if(w.includes('may'))return 2;if(w.includes('jun'))return 3;if(w.includes('jul')||w.includes('aug'))return 4;if(w.includes('sep')||w.includes('oct'))return 5;if(w.includes('nov')||w.includes('week')||w.includes('night'))return 6;if(w.includes('day')||w.includes('pm')||w.includes('am')||w.includes('morning'))return 8;return 4})
          const mn=Math.min(...starts);const mx=Math.max(...starts);const gaps=ch.steps.filter(s=>s.status==='gap').length
          return <div key={ch.id} style={{display:'flex',alignItems:'center',height:24,cursor:'pointer'}} onClick={()=>{setPV('chains');if(!openChains.has(ch.id))toggleChain(ch.id)}}>
            <div style={{width:90,fontSize:10,fontWeight:500,color:'#4a4540',textAlign:'right',paddingRight:8,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flexShrink:0}}>{ch.name}</div>
            <div style={{flex:1,position:'relative',height:10}}>
              <div style={{position:'absolute',left:(mn/9)*100+'%',width:Math.max(((mx-mn+1)/9)*100,8)+'%',height:8,top:1,borderRadius:4,background:ch.color,opacity:.7}}/>
              {gaps>0&&<div style={{position:'absolute',right:4,top:-2,fontSize:9,color:'#c97a6a',fontWeight:600}}>{gaps}</div>}
            </div>
          </div>
        })}
      </div>
    </div>}
    {planView==='chains'&&<>
      {chains.map(ch=>{const open=openChains.has(ch.id);const d=ch.steps.filter(s=>s.status==='done').length;const gaps=ch.steps.filter(s=>s.status==='gap').length;const pctC=ch.steps.length?Math.round((d/ch.steps.length)*100):0
        return <div key={ch.id} style={{marginBottom:4}}>
          <div style={{...S.cd,cursor:'pointer',display:'flex',alignItems:'center',gap:8,marginBottom:open?0:4,borderRadius:open?'12px 12px 0 0':12}} onClick={()=>toggleChain(ch.id)}>
            <div style={{width:8,height:8,borderRadius:4,background:ch.color,flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:500,color:'#4a4540'}}>{ch.name}</div><div style={{fontSize:10,color:'#b5b0aa',display:'flex',gap:6}}><span>{ch.span}</span>{gaps>0&&<span style={{color:'#c97a6a',fontWeight:600}}>{gaps} gaps</span>}</div></div>
            <div style={{display:'flex',alignItems:'center',gap:4,flexShrink:0}}><div style={{width:32,height:3,background:'#f0eeea',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',width:pctC+'%',background:ch.color,borderRadius:2}}/></div><span style={{fontSize:10,color:'#b5b0aa',minWidth:24,textAlign:'right'}}>{d}/{ch.steps.length}</span></div>
            <div style={{color:'#d4d0cc',fontSize:12,transition:'transform 0.15s',transform:open?'rotate(90deg)':'none'}}>&rsaquo;</div>
          </div>
          {open&&<div style={{background:'#fff',border:'1px solid #eae7e2',borderTop:'none',borderRadius:'0 0 12px 12px',padding:'6px 12px 10px',marginBottom:4}}>
            {ch.steps.map((st,si)=>{const sc=stColor(st.status)
              return <div key={st.id} style={{display:'flex',gap:6,cursor:'pointer'}} onClick={()=>{setES({cid:ch.id,sid:st.id});go('stepEdit')}}>
                <div style={{display:'flex',flexDirection:'column' as const,alignItems:'center',width:16,flexShrink:0}}>
                  <div style={{width:6,height:6,borderRadius:3,background:ch.color,marginTop:6,flexShrink:0}}/>
                  {si<ch.steps.length-1&&<div style={{width:1,flex:1,background:ch.color,opacity:.3}}/>}
                </div>
                <div style={{flex:1,padding:'4px 8px',marginBottom:2,borderRadius:6,fontSize:12,background:sc.bg,border:st.status==='gap'?'1px dashed '+sc.tx:'0.5px solid transparent'}}>
                  {st.when&&<span style={{fontSize:9,fontWeight:600,padding:'1px 5px',borderRadius:5,background:'rgba(0,0,0,0.04)',color:'#8a8580',marginRight:3}}>{st.when}</span>}
                  <span style={{fontWeight:500,color:st.status==='done'?'#b5b0aa':'#4a4540',textDecoration:st.status==='done'?'line-through':'none'}}>{st.what}</span>
                  {st.who&&<div style={{fontSize:10,color:'#3a7a5a',fontWeight:500,marginTop:1}}>{st.who}</div>}
                  {st.notes&&<div style={{fontSize:10,color:st.status==='gap'?'#9a7a3a':'#b5b0aa',marginTop:1,fontWeight:st.status==='gap'?600:400}}>{st.notes}</div>}
                </div>
              </div>})}
            <InlineAdd chainId={ch.id} color={ch.color} onAdd={(text)=>addStep(ch.id,text)}/>
          </div>}
        </div>})}
      <button style={{...S.bp,width:'100%',marginTop:8}} onClick={()=>{setAM({text:'',catId:'',chainId:''});go('addTask')}}>+ New task</button>
    </>}
    <div style={{height:80}}/><Nav/>
  </div>

  // ── THE DAY ──
  if(scr==='day'){
    const filtered=tl.filter(e=>dayView==='both'||e.view==='both'||e.view===dayView||!e.view)
    return <div style={S.pg}>
      <div style={{fontSize:20,fontWeight:500,color:'#4a4540',marginBottom:4}}>28th November 2026</div>
      <div style={{fontSize:13,color:'#b5b0aa',marginBottom:12}}>The day, minute by minute</div>
      {/* Map */}
      <div style={{background:'#fff',border:'0.5px solid #eae7e2',borderRadius:12,overflow:'hidden',marginBottom:12}}>
        <div style={{position:'relative',height:200,background:'#f5f3f0',overflow:'hidden'}}>
          {LOCATIONS.map(loc=><div key={loc.id} style={{position:'absolute',left:((loc.lng-144.95)/0.2)*100+'%',top:((loc.lat+37.8)/-0.2)*100+'%',transform:'translate(-50%,-50%)',zIndex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
            <div style={{width:16,height:16,borderRadius:8,border:'1.5px solid #eae7e2',display:'flex',alignItems:'center',justifyContent:'center',background:'#fff'}}><div style={{width:6,height:6,borderRadius:3,background:loc.color}}/></div>
            <div style={{fontSize:8,fontWeight:500,color:'#8a8580',whiteSpace:'nowrap',background:'rgba(250,248,245,0.8)',padding:'0 2px',borderRadius:2}}>{loc.name}</div>
          </div>)}
          {ms.pins.map(pin=>pin.l?<div key={pin.id} style={{position:'absolute',left:pin.x+'%',top:pin.y+'%',zIndex:3,transition:'all 0.4s',display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
            <div style={{width:8,height:8,borderRadius:4,background:pin.id==='b'?'#c97a6a':pin.id==='g'?'#9a7a3a':'#6a8aaa',border:'2px solid #fff'}}/>
            {pin.l&&<div style={{fontSize:7,fontWeight:600,color:'#fff',background:pin.id==='b'?'#c97a6a':pin.id==='g'?'#9a7a3a':'#6a8aaa',padding:'0 3px',borderRadius:3,whiteSpace:'nowrap'}}>{pin.l}</div>}
          </div>:null)}
        </div>
        <div style={{padding:'8px 12px',display:'flex',alignItems:'center',gap:8}}>
          <button style={{...S.bt,padding:'4px 10px',fontSize:12}} onClick={()=>setMI(Math.max(0,mapIdx-1))}>&larr;</button>
          <div style={{flex:1,textAlign:'center'}}><div style={{fontSize:15,fontWeight:500,color:'#4a4540'}}>{ms.lbl}</div><div style={{fontSize:11,color:'#b5b0aa'}}>{ms.desc}</div></div>
          <button style={{...S.bt,padding:'4px 10px',fontSize:12}} onClick={()=>setMI(Math.min(MAP_STATES.length-1,mapIdx+1))}>&rarr;</button>
        </div>
      </div>
      {/* View toggle */}
      <div style={{display:'flex',gap:4,marginBottom:12}}>
        {(['both','bride','groom'] as const).map(v=><button key={v} style={{...S.bt,flex:1,fontSize:11,background:dayView===v?'#4a4540':'transparent',color:dayView===v?'#faf8f5':'#4a4540',border:dayView===v?'none':undefined}} onClick={()=>setDV(v)}>{v==='both'?'Both':v==='bride'?'Bride':'Groom'}</button>)}
      </div>
      {/* Timeline */}
      {filtered.map(item=>{const c=item.big?'#3a7a5a':'#9a9590'
        return <div key={item.id} style={{display:'flex',gap:10,marginBottom:2}}>
          <div style={{width:52,fontSize:11,color:'#b5b0aa',textAlign:'right' as const,paddingTop:item.big?12:10,flexShrink:0,fontWeight:500}}>{item.t}</div>
          <div style={{width:2,background:c,flexShrink:0,opacity:.25,borderRadius:1}}/>
          <div style={{background:item.big?c:'#fff',border:item.big?'none':'1px solid #eae7e2',borderRadius:12,padding:item.big?'12px 16px':'10px 14px',flex:1,marginBottom:4,cursor:'pointer'}} onClick={()=>{setETl(item.id);go('tlEdit')}}>
            <div style={{fontSize:13,fontWeight:item.big?700:500,color:item.big?'#fff':'#4a4540'}}>{item.e}</div>
            {item.w&&<div style={{fontSize:11,color:item.big?'rgba(255,255,255,0.7)':'#b5b0aa',marginTop:1}}>{item.w}</div>}
          </div>
        </div>})}
      <button style={{...S.bp,width:'100%',marginTop:8}} onClick={()=>setTl(p=>[...p!,{id:'tl'+Date.now(),t:'',e:'New event',w:'',view:'both'}])}>+ Add event</button>
      <div style={{height:80}}/><Nav/>
    </div>
  }

  // ── TIMELINE EDIT ──
  if(scr==='tlEdit'){const item=tl.find(x=>x.id===editTl);if(!item){go('day');return null}
    return <div style={S.pg}>
      <button style={{...S.bt,marginBottom:16}} onClick={()=>go('day')}>Back</button>
      <div style={{fontSize:16,fontWeight:500,color:'#4a4540',marginBottom:16}}>Edit event</div>
      <div style={S.fl}>Time</div><input value={item.t} onChange={e=>utl(item.id,{t:e.target.value})} style={S.ip}/>
      <div style={S.fl}>Event</div><input value={item.e} onChange={e=>utl(item.id,{e:e.target.value})} style={S.ip}/>
      <div style={S.fl}>Who</div><input value={item.w||''} onChange={e=>utl(item.id,{w:e.target.value})} style={S.ip}/>
      <div style={S.fl}>View</div><select value={item.view||'both'} onChange={e=>utl(item.id,{view:e.target.value as any})} style={S.ip}><option value="both">Both</option><option value="bride">Bride</option><option value="groom">Groom</option></select>
      <div style={S.fl}>Location</div><select value={item.locId||''} onChange={e=>utl(item.id,{locId:e.target.value})} style={S.ip}><option value="">None</option>{LOCATIONS.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}><input type="checkbox" checked={!!item.big} onChange={e=>utl(item.id,{big:e.target.checked})} id="be"/><label htmlFor="be" style={{fontSize:13,color:'#4a4540'}}>Key moment</label></div>
      <button style={{...S.bt,width:'100%',color:'#c97a6a',borderColor:'#c97a6a'}} onClick={()=>{setTl(p=>p!.filter(x=>x.id!==item.id));go('day')}}>Delete</button>
      <div style={{height:80}}/><Nav/>
    </div>}

  // ── BUDGET ──
  if(scr==='budget') return <div style={S.pg}>
    <div style={{fontSize:20,fontWeight:500,color:'#4a4540',marginBottom:16}}>$30,000 budget</div>
    <div style={{display:'flex',gap:8,marginBottom:16}}>
      {([['Quoted',tq,'#6a5a8f','#f0ecf8'],['Committed',td,'#9a7a3a','#fef5e7'],['Paid',tp,'#3a7a5a','#e8f5ee']] as const).map(([l,v,c,bg])=>
        <div key={l} style={{flex:1,background:bg,borderRadius:14,padding:'12px 0',textAlign:'center' as const}}><div style={{fontSize:11,color:'#b5b0aa'}}>{l}</div><div style={{fontSize:18,fontWeight:500,color:c}}>${v.toLocaleString()}</div></div>)}
    </div>
    <div style={{...S.cd,marginBottom:16}}><div style={{height:8,background:'#f0eeea',borderRadius:4,overflow:'hidden'}}><div style={{height:'100%',display:'flex',borderRadius:4}}><div style={{width:`${(tp/30000)*100}%`,background:'#3a7a5a'}}/><div style={{width:`${((td-tp)/30000)*100}%`,background:'#c8a43a'}}/><div style={{width:`${((tq-td)/30000)*100}%`,background:'#8a7abf'}}/></div></div><div style={{fontSize:12,color:'#b5b0aa',marginTop:6,textAlign:'center'}}>${(30000-tq).toLocaleString()} unallocated</div></div>
    {CATEGORIES.filter(cat=>bud.some(b=>b.g===cat.id)).map(cat=>{const items=bud.filter(b=>b.g===cat.id);const catTot=items.reduce((s,b)=>s+(b.amt||0),0)
      return <div key={cat.id} style={{marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}><div style={{width:8,height:8,borderRadius:4,background:cat.color}}/><div style={{fontSize:13,fontWeight:500,color:'#4a4540'}}>{cat.name}</div><div style={{fontSize:12,color:'#b5b0aa',marginLeft:'auto'}}>${catTot.toLocaleString()}</div></div>
        {items.map(b=><div key={b.id} style={{...S.cd,cursor:'pointer',padding:'10px 14px',marginBottom:4}} onClick={()=>{setEB(b.id);go('budgetD')}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div><div style={{fontSize:13,fontWeight:500,color:'#4a4540'}}>{b.cat}</div>{b.vendorName&&<div style={{fontSize:10,color:'#6a8aaa',marginTop:1}}>{b.vendorName}</div>}</div>
            <div style={{textAlign:'right' as const}}><div style={{fontSize:15,fontWeight:500,color:b.amt?'#4a4540':'#d4d0cc'}}>{b.amt?`$${b.amt.toLocaleString()}`:'$\u2014'}</div><span style={pill(BUDGET_STATES[b.st]?.bg,BUDGET_STATES[b.st]?.tx)}>{BUDGET_STATES[b.st]?.lb}</span></div>
          </div>
        </div>)}
      </div>})}
    {/* Show uncategorized items */}
    {bud.filter(b=>!CATEGORIES.find(c=>c.id===b.g)).length>0&&<div style={{marginBottom:12}}>
      <div style={{fontSize:13,fontWeight:500,color:'#4a4540',marginBottom:6}}>Other</div>
      {bud.filter(b=>!CATEGORIES.find(c=>c.id===b.g)).map(b=><div key={b.id} style={{...S.cd,cursor:'pointer',padding:'10px 14px',marginBottom:4}} onClick={()=>{setEB(b.id);go('budgetD')}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontSize:13,fontWeight:500,color:'#4a4540'}}>{b.cat}</div>
          <div style={{fontSize:15,fontWeight:500,color:b.amt?'#4a4540':'#d4d0cc'}}>{b.amt?`$${b.amt.toLocaleString()}`:'$\u2014'}</div>
        </div>
      </div>)}
    </div>}
    <button style={{...S.bp,width:'100%',marginTop:8}} onClick={()=>setB(p=>[...p!,{id:'b'+Date.now(),cat:'New item',amt:0,st:'quoted',n:'',g:'venue',vendorName:'',vendorPhone:'',vendorEmail:''}])}>+ Add item</button>
    <div style={{height:80}}/><Nav/>
  </div>

  // ── BUDGET DETAIL ──
  if(scr==='budgetD'){const b=bud.find(x=>x.id===editB);if(!b){go('budget');return null}
    return <div style={S.pg}>
      <button style={{...S.bt,marginBottom:16}} onClick={()=>go('budget')}>Back</button>
      <div style={{fontSize:16,fontWeight:500,color:'#4a4540',marginBottom:16}}>{b.cat}</div>
      <div style={S.fl}>Name</div><input value={b.cat} onChange={e=>ub(b.id,{cat:e.target.value})} style={S.ip}/>
      <div style={S.fl}>Amount ($)</div><input type="number" value={b.amt||''} onChange={e=>ub(b.id,{amt:Number(e.target.value)||0})} style={S.ip}/>
      <div style={S.fl}>Category</div>
      <div style={{display:'flex',flexWrap:'wrap' as const,gap:4,marginBottom:12}}>{CATEGORIES.map(c=><div key={c.id} style={{fontSize:11,padding:'4px 8px',borderRadius:12,border:b.g===c.id?'1.5px solid '+c.color:'0.5px solid #e0ddd8',color:b.g===c.id?c.color:'#8a8580',cursor:'pointer',background:'#fff'}} onClick={()=>ub(b.id,{g:c.id})}>{c.name}</div>)}</div>
      <div style={S.fl}>State</div>
      <div style={{display:'flex',gap:6,marginBottom:12}}>{Object.entries(BUDGET_STATES).map(([k,v])=><button key={k} style={{...S.bt,flex:1,fontSize:12,background:b.st===k?v.bg:'transparent',color:b.st===k?v.tx:'#b5b0aa',borderColor:b.st===k?v.tx:'#e0ddd8',fontWeight:b.st===k?700:400}} onClick={()=>ub(b.id,{st:k})}>{v.lb}</button>)}</div>
      <div style={S.fl}>Notes</div><textarea value={b.n||''} onChange={e=>ub(b.id,{n:e.target.value})} rows={2} style={{...S.ip,resize:'vertical' as const}}/>
      <div style={{...S.sh,marginTop:4}}>Vendor contact</div>
      <div style={S.fl}>Name</div><input value={b.vendorName||''} onChange={e=>ub(b.id,{vendorName:e.target.value})} placeholder="e.g. Sarah's Cakes" style={S.ip}/>
      <div style={S.fl}>Phone</div><input value={b.vendorPhone||''} onChange={e=>ub(b.id,{vendorPhone:e.target.value})} placeholder="0412 345 678" style={S.ip}/>
      <div style={S.fl}>Email</div><input value={b.vendorEmail||''} onChange={e=>ub(b.id,{vendorEmail:e.target.value})} placeholder="vendor@email.com" style={S.ip}/>
      <button style={{...S.bt,width:'100%',marginTop:8,color:'#c97a6a',borderColor:'#c97a6a'}} onClick={()=>{setB(p=>p!.filter(x=>x.id!==b.id));go('budget')}}>Delete</button>
      <div style={{height:80}}/><Nav/>
    </div>}

  return null
}

function InlineAdd({chainId,color,onAdd}:{chainId:string,color:string,onAdd:(text:string)=>void}){
  const [text,setText]=useState('')
  return <div style={{display:'flex',gap:6,alignItems:'center',marginTop:8}}>
    <div style={{width:6,height:6,borderRadius:3,border:'1.5px solid #d4d0cc',flexShrink:0}}/>
    <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&text.trim()){onAdd(text.trim());setText('')}}} placeholder="Add a step..." style={{flex:1,border:'0.5px solid #eae7e2',borderRadius:8,padding:'6px 10px',fontSize:12,color:'#4a4540',background:'#fff',fontFamily:"'DM Sans',sans-serif"}}/>
    <button style={{fontSize:12,fontWeight:500,color:'#faf8f5',background:'#4a4540',border:'none',borderRadius:8,padding:'6px 10px',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}} onClick={()=>{if(text.trim()){onAdd(text.trim());setText('')}}}>Add</button>
  </div>
}

const S:Record<string,React.CSSProperties>={
  pg:{fontFamily:"'DM Sans',sans-serif",background:'#faf8f5',minHeight:'100vh',padding:'16px 16px 0',maxWidth:480,margin:'0 auto'},
  cd:{background:'#fff',borderRadius:12,border:'1px solid #eae7e2',padding:'14px 16px',marginBottom:8},
  bt:{background:'none',border:'1px solid #e0ddd8',borderRadius:12,padding:'8px 16px',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",color:'#4a4540'},
  bp:{background:'#4a4540',color:'#faf8f5',border:'none',borderRadius:12,padding:'8px 16px',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"},
  ip:{background:'#fff',border:'1px solid #e0ddd8',borderRadius:12,padding:'10px 14px',fontSize:14,fontFamily:"'DM Sans',sans-serif",color:'#4a4540',width:'100%',marginBottom:12,boxSizing:'border-box' as const},
  fl:{fontSize:12,color:'#b5b0aa',marginBottom:4,fontWeight:500},
  sh:{fontSize:11,fontWeight:500,color:'#b5b0aa',marginBottom:8,marginTop:16,textTransform:'uppercase' as const,letterSpacing:.8},
  nav:{position:'fixed' as const,bottom:0,left:0,right:0,background:'#faf8f5',borderTop:'1px solid #eae7e2',display:'flex',justifyContent:'space-around',padding:'8px 0 20px',maxWidth:480,margin:'0 auto',zIndex:10},
  ni:{display:'flex',flexDirection:'column' as const,alignItems:'center',gap:2,cursor:'pointer',padding:'4px 8px'},
}
