import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, Plus, X, AlertCircle, CalendarDays } from 'lucide-react';

const HH = 64, CS = 7, CE = 22;
const HOURS = Array.from({ length: CE - CS }, (_, i) => CS + i);
const DAYS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MNTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CLR = [
  { bg:'rgba(99,102,241,.22)', bd:'#6366f1', tx:'#a5b4fc' },
  { bg:'rgba(52,211,153,.18)', bd:'#34d399', tx:'#6ee7b7' },
  { bg:'rgba(251,191,36,.18)', bd:'#fbbf24', tx:'#fcd34d' },
  { bg:'rgba(248,113,113,.18)',bd:'#f87171', tx:'#fca5a5' },
  { bg:'rgba(192,132,252,.18)',bd:'#c084fc', tx:'#d8b4fe' },
  { bg:'rgba(56,189,248,.18)', bd:'#38bdf8', tx:'#7dd3fc' },
  { bg:'rgba(251,146,60,.18)', bd:'#fb923c', tx:'#fdba74' },
  { bg:'rgba(163,230,53,.18)', bd:'#a3e635', tx:'#bef264' },
];
const clr  = id => CLR[(id || 0) % CLR.length];
const sow  = d => { const r = new Date(d); r.setDate(r.getDate() - r.getDay()); r.setHours(0,0,0,0); return r; };
const addD = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const samD = (a, b) => a.toDateString() === b.toDateString();
const p2   = n => String(n).padStart(2, '0');
const toISO = d => `${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`;
const f12  = d => { let h = d.getHours(), m = d.getMinutes(), ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${p2(m)} ${ap}`; };
const fH   = h => `${h % 12 || 12}${h >= 12 ? 'PM' : 'AM'}`;

export default function Bookings() {
  const { user } = useAuth();
  const today = new Date();
  const [view, setView] = useState('week');
  const [wk,   setWk]  = useState(sow(today));
  const [mo,   setMo]  = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [form, setForm] = useState(false);
  const [fd,   setFd]  = useState({ rid:'', st:'', et:'', pur:'' });
  const [err,  setErr] = useState(null);
  const [pop,  setPop] = useState(null);
  const [popP, setPopP] = useState({ top:0, left:0 });
  const popRef = useRef(null);

  const { qs, qe } = useMemo(() => {
    if (view === 'week') return { qs: wk, qe: addD(wk, 7) };
    const s = new Date(mo.getFullYear(), mo.getMonth(), 1);
    s.setDate(s.getDate() - s.getDay());
    return { qs: s, qe: addD(s, 42) };
  }, [view, wk, mo]);

  const { data: bookings = [], refetch } = useQuery({
    queryKey: ['cal', qs.toISOString(), qe.toISOString()],
    queryFn: async () => {
      const r = await api.get('/bookings', { params: { start: qs.toISOString(), end: qe.toISOString() } });
      return (r.data.data || []).map(b => ({ ...b, sdt: new Date(b.start_time), edt: new Date(b.end_time) }));
    },
    refetchInterval: 60000,
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['bookable-assets'],
    queryFn: async () => {
      const r = await api.get('/assets', { params: { limit: 200 } });
      return (r.data.data || []).filter(a => a.is_bookable);
    },
  });

  const bookM = useMutation({
    mutationFn: d => api.post('/bookings', d),
    onSuccess: () => { toast.success('Booked!'); setFd({ rid:'', st:'', et:'', pur:'' }); setErr(null); setForm(false); refetch(); },
    onError: e => { const er = e.response?.data?.error; if (er?.code === 'BOOKING_OVERLAP') setErr(er); else toast.error(er?.message || 'Failed'); },
  });

  const cancelM = useMutation({
    mutationFn: id => api.put(`/bookings/${id}/cancel`),
    onSuccess: () => { toast.success('Cancelled'); setPop(null); refetch(); },
    onError: () => toast.error('Cancel failed'),
  });

  useEffect(() => {
    const h = e => { if (popRef.current && !popRef.current.contains(e.target)) setPop(null); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const openSlot = (date, hour) => {
    const s = new Date(date); s.setHours(hour, 0, 0, 0);
    const e = new Date(date); e.setHours(Math.min(hour + 1, 23), 0, 0, 0);
    setFd(f => ({ ...f, st: toISO(s), et: toISO(e) }));
    setErr(null); setForm(true);
  };

  const onEvtClick = (e, b) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    setPopP({ top: r.bottom + window.scrollY + 8, left: Math.min(r.left + window.scrollX, window.innerWidth - 290) });
    setPop(b);
  };

  const wkDays = Array.from({ length: 7 }, (_, i) => addD(wk, i));
  const nav = n => view === 'week' ? setWk(addD(wk, n * 7)) : setMo(new Date(mo.getFullYear(), mo.getMonth() + n, 1));

  const label = view === 'week'
    ? `${wkDays[0].toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${wkDays[6].toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`
    : `${MNTHS[mo.getMonth()]} ${mo.getFullYear()}`;

  return (
    <div>
      <div className="animate-in" style={{ marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 className="page-title">Resource Booking</h1>
          <p className="page-sub">View and book shared resources on the calendar</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setErr(null); setForm(true); }}>
          <Plus size={15}/> New Booking
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:16 }}>
        {/* Sidebar */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div className="card animate-in d-1" style={{ padding:12 }}>
            <div className="tabs" style={{ width:'100%' }}>
              <button className={`tab${view==='week'?' active':''}`} style={{ flex:1, padding:'7px 6px', fontSize:12 }} onClick={() => setView('week')}>Week</button>
              <button className={`tab${view==='month'?' active':''}`} style={{ flex:1, padding:'7px 6px', fontSize:12 }} onClick={() => setView('month')}>Month</button>
            </div>
          </div>
          {assets.length > 0 && (
            <div className="card animate-in d-2" style={{ padding:14, maxHeight:320, overflowY:'auto' }}>
              <div className="section-title" style={{ marginBottom:10, fontSize:12 }}>
                <CalendarDays size={13} color="var(--accent)"/> Resources
              </div>
              {assets.map(a => { const c = clr(a.id); return (
                <div key={a.id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                  <span style={{ width:10, height:10, borderRadius:3, background:c.bd, flexShrink:0 }}/>
                  <span style={{ fontSize:11, color:'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {a.asset_tag} — {a.name}
                  </span>
                </div>
              ); })}
            </div>
          )}
        </div>

        {/* Calendar card */}
        <div className="card animate-in d-2" style={{ padding:0, overflow:'hidden', display:'flex', flexDirection:'column', minHeight:580 }}>
          {/* Toolbar */}
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 18px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
            <button className="btn btn-ghost" style={{ padding:'5px 12px', fontSize:12 }}
              onClick={() => { setWk(sow(today)); setMo(new Date(today.getFullYear(), today.getMonth(), 1)); }}>
              Today
            </button>
            <div style={{ display:'flex', gap:2 }}>
              <button className="btn btn-ghost" style={{ padding:'5px 9px' }} onClick={() => nav(-1)}><ChevronLeft size={15}/></button>
              <button className="btn btn-ghost" style={{ padding:'5px 9px' }} onClick={() => nav(1)}><ChevronRight size={15}/></button>
            </div>
            <span style={{ fontWeight:700, fontSize:15, fontFamily:'var(--font-display)' }}>{label}</span>
          </div>
          {view === 'week'
            ? <WeekView wkDays={wkDays} today={today} bookings={bookings} onSlot={openSlot} onEvt={onEvtClick}/>
            : <MonthView mo={mo} today={today} bookings={bookings} onDay={d => { setWk(sow(d)); setView('week'); }} onEvt={onEvtClick}/>
          }
        </div>
      </div>

      {form && <BookingPanel fd={fd} setFd={setFd} assets={assets} err={err} loading={bookM.isPending}
        onSubmit={() => bookM.mutate({ resource_asset_id: fd.rid, start_time: fd.st, end_time: fd.et, purpose: fd.pur })}
        onClose={() => { setForm(false); setErr(null); }}/>}

      {pop && <EventPopover ref={popRef} ev={pop} pos={popP} user={user}
        onCancel={() => cancelM.mutate(pop.id)} onClose={() => setPop(null)} loading={cancelM.isPending}/>}
    </div>
  );
}

/* ── WeekView ─────────────────────────────────────────────────────────── */
function WeekView({ wkDays, today, bookings, onSlot, onEvt }) {
  const scrollRef = useRef(null);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = (8 - CS) * HH; }, []);

  const byDay = useMemo(() => {
    const m = {}; wkDays.forEach(d => { m[d.toDateString()] = []; });
    bookings.forEach(b => { const k = b.sdt.toDateString(); if (m[k]) m[k].push(b); });
    return m;
  }, [bookings, wkDays]);

  return (
    <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {/* Day headers */}
      <div style={{ display:'grid', gridTemplateColumns:'48px repeat(7,1fr)', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        <div/>
        {wkDays.map(d => { const it = samD(d, today); return (
          <div key={d.toDateString()} style={{ textAlign:'center', padding:'8px 2px', borderLeft:'1px solid var(--border)' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{DAYS[d.getDay()]}</div>
            <div style={{ width:30, height:30, borderRadius:'50%', display:'inline-flex', alignItems:'center', justifyContent:'center', margin:'3px auto 0',
              background: it ? 'var(--accent)' : 'transparent', color: it ? '#fff' : 'var(--text-primary)', fontSize:14, fontWeight: it ? 700 : 500 }}>
              {d.getDate()}
            </div>
          </div>
        ); })}
      </div>
      {/* Scrollable grid */}
      <div ref={scrollRef} style={{ overflow:'auto', flex:1 }}>
        <div style={{ display:'grid', gridTemplateColumns:'48px repeat(7,1fr)' }}>
          {/* Hour labels */}
          <div>
            {HOURS.map(h => (
              <div key={h} style={{ height:HH, display:'flex', alignItems:'flex-start', justifyContent:'flex-end', paddingRight:6, paddingTop:4 }}>
                <span style={{ fontSize:10, color:'var(--text-secondary)' }}>{fH(h)}</span>
              </div>
            ))}
          </div>
          {/* Day columns */}
          {wkDays.map(d => { const it = samD(d, today); return (
            <div key={d.toDateString()} style={{ borderLeft:'1px solid var(--border)', position:'relative', background: it ? 'rgba(99,102,241,0.025)' : 'transparent' }}>
              {HOURS.map(h => (
                <div key={h} onClick={() => onSlot(d, h)}
                  style={{ height:HH, borderBottom:'1px solid rgba(255,255,255,0.035)', cursor:'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}/>
              ))}
              {(byDay[d.toDateString()] || []).map(b => <EvtBlock key={b.id} b={b} onClick={onEvt}/>)}
            </div>
          ); })}
        </div>
      </div>
    </div>
  );
}

/* ── EvtBlock ─────────────────────────────────────────────────────────── */
function EvtBlock({ b, onClick }) {
  const sh = b.sdt.getHours() + b.sdt.getMinutes() / 60;
  const eh = b.edt.getHours() + b.edt.getMinutes() / 60;
  const cs = Math.max(sh, CS), ce = Math.min(eh, CE);
  if (ce <= cs) return null;
  const top = (cs - CS) * HH, height = Math.max((ce - cs) * HH, 22);
  const c = clr(b.resource_asset_id);
  const cancelled = b.status === 'Cancelled';
  return (
    <div onClick={e => onClick(e, b)} style={{
      position:'absolute', top, left:3, right:3, height,
      background: cancelled ? 'rgba(255,255,255,0.04)' : c.bg,
      borderLeft: `3px solid ${cancelled ? 'rgba(255,255,255,0.15)' : c.bd}`,
      borderRadius:6, padding:'3px 6px', cursor:'pointer', overflow:'hidden', zIndex:2,
      opacity: cancelled ? 0.5 : 1, userSelect:'none', transition:'filter 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.3)'}
      onMouseLeave={e => e.currentTarget.style.filter = 'none'}>
      <div style={{ fontSize:11, fontWeight:700, color: cancelled ? 'var(--text-secondary)' : c.tx, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {b.Resource?.asset_tag || `#${b.resource_asset_id}`}
      </div>
      {height > 36 && (
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:1 }}>
          {b.purpose || f12(b.sdt)}
        </div>
      )}
    </div>
  );
}

/* ── MonthView ────────────────────────────────────────────────────────── */
function MonthView({ mo, today, bookings, onDay, onEvt }) {
  const yr = mo.getFullYear(), mn = mo.getMonth();
  const gs = new Date(yr, mn, 1); gs.setDate(gs.getDate() - gs.getDay());
  const cells = Array.from({ length: 42 }, (_, i) => addD(gs, i));

  const byDay = useMemo(() => {
    const m = {};
    bookings.forEach(b => { const k = b.sdt.toDateString(); if (!m[k]) m[k] = []; m[k].push(b); });
    return m;
  }, [bookings]);

  return (
    <div style={{ flex:1, overflow:'auto', display:'flex', flexDirection:'column' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign:'center', padding:'8px 4px', fontSize:10, fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{d}</div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', flex:1, gridAutoRows:'minmax(90px,1fr)' }}>
        {cells.map((cell, i) => {
          const isCur = cell.getMonth() === mn;
          const isToday = samD(cell, today);
          const evts = byDay[cell.toDateString()] || [];
          return (
            <div key={i} className={`cal-month-cell${isToday ? ' today' : ''}${!isCur ? ' other-month' : ''}`} onClick={() => onDay(cell)}>
              <div style={{ width:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:4,
                background: isToday ? 'var(--accent)' : 'transparent',
                color: isToday ? '#fff' : 'var(--text-secondary)', fontSize:12, fontWeight: isToday ? 700 : 500 }}>
                {cell.getDate()}
              </div>
              {evts.slice(0, 3).map(b => { const c = clr(b.resource_asset_id); return (
                <div key={b.id} onClick={e => onEvt(e, b)} style={{
                  fontSize:10, fontWeight:600, color:c.tx, background:c.bg,
                  borderLeft:`2px solid ${c.bd}`, borderRadius:4, padding:'1px 5px',
                  marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', cursor:'pointer',
                }}>
                  {b.Resource?.asset_tag || `#${b.resource_asset_id}`}{b.purpose ? ` · ${b.purpose}` : ''}
                </div>
              ); })}
              {evts.length > 3 && <div style={{ fontSize:10, color:'var(--text-secondary)', paddingLeft:4 }}>+{evts.length - 3} more</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── BookingPanel ─────────────────────────────────────────────────────── */
function BookingPanel({ fd, setFd, assets, err, loading, onSubmit, onClose }) {
  return (
    <>
      <div className="cal-panel-overlay" onClick={onClose}/>
      <div className="cal-panel">
        <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontWeight:700, fontSize:16, fontFamily:'var(--font-display)' }}>New Booking</span>
          <button className="btn btn-ghost" style={{ padding:'4px 8px' }} onClick={onClose}><X size={16}/></button>
        </div>
        <div style={{ padding:24 }}>
          {err && (
            <div className="alert-danger" style={{ padding:14, marginBottom:18, display:'flex', gap:10 }}>
              <AlertCircle size={15} color="var(--danger)" style={{ flexShrink:0, marginTop:1 }}/>
              <div>
                <div style={{ color:'var(--danger)', fontWeight:700, fontSize:13, marginBottom:3 }}>Time Conflict</div>
                <div style={{ color:'var(--text-secondary)', fontSize:12 }}>This resource is already booked in the selected slot.</div>
              </div>
            </div>
          )}
          <form onSubmit={e => { e.preventDefault(); onSubmit(); }}>
            <div style={{ marginBottom:16 }}>
              <label className="label">Resource</label>
              <select className="input" value={fd.rid} onChange={e => setFd(f => ({ ...f, rid: e.target.value }))} required>
                <option value="" disabled>{assets.length ? 'Select a resource…' : 'No bookable assets'}</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.asset_tag} — {a.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:16 }}>
              <label className="label">Purpose</label>
              <input className="input" value={fd.pur} onChange={e => setFd(f => ({ ...f, pur: e.target.value }))} placeholder="e.g. Team meeting"/>
            </div>
            <div style={{ marginBottom:16 }}>
              <label className="label">Start Time</label>
              <input type="datetime-local" className="input" value={fd.st} onChange={e => setFd(f => ({ ...f, st: e.target.value }))} required/>
            </div>
            <div style={{ marginBottom:24 }}>
              <label className="label">End Time</label>
              <input type="datetime-local" className="input" value={fd.et} onChange={e => setFd(f => ({ ...f, et: e.target.value }))} required/>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width:'100%', padding:12 }} disabled={loading}>
              {loading ? 'Booking…' : 'Book Resource'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

/* ── EventPopover ─────────────────────────────────────────────────────── */
const EventPopover = React.forwardRef(function EventPopover({ ev, pos, user, onCancel, onClose, loading }, ref) {
  const c = clr(ev.resource_asset_id);
  const canCancel = (user?.id === ev.booked_by || user?.role === 'admin') && ev.status !== 'Cancelled';
  return (
    <div ref={ref} className="cal-popover" style={{ top: pos.top, left: pos.left, position:'fixed' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ width:12, height:12, borderRadius:3, background:c.bd, flexShrink:0, marginTop:2 }}/>
          <span style={{ fontWeight:700, fontSize:14, fontFamily:'var(--font-display)' }}>
            {ev.Resource?.name || `Asset #${ev.resource_asset_id}`}
          </span>
        </div>
        <button className="btn btn-ghost" style={{ padding:'2px 6px', marginLeft:8 }} onClick={onClose}><X size={14}/></button>
      </div>
      <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:6 }}>{ev.Resource?.asset_tag}</div>
      <div style={{ fontSize:13, marginBottom:4 }}>
        <span style={{ color:'var(--text-secondary)' }}>From: </span>{f12(ev.sdt)}
      </div>
      <div style={{ fontSize:13, marginBottom:8 }}>
        <span style={{ color:'var(--text-secondary)' }}>To: </span>{f12(ev.edt)}
      </div>
      {ev.purpose && <div style={{ fontSize:13, marginBottom:8 }}><span style={{ color:'var(--text-secondary)' }}>Purpose: </span>{ev.purpose}</div>}
      {ev.Booker && <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:12 }}>Booked by: {ev.Booker.name}</div>}
      <span className="badge" style={{
        background: ev.status==='Cancelled' ? 'rgba(248,113,113,0.12)' : ev.status==='Upcoming' ? 'rgba(99,102,241,0.15)' : 'rgba(52,211,153,0.12)',
        color: ev.status==='Cancelled' ? 'var(--danger)' : ev.status==='Upcoming' ? 'var(--accent)' : 'var(--success)',
        borderColor: 'transparent', marginBottom:12,
      }}>{ev.status}</span>
      {canCancel && (
        <button className="btn btn-soft-danger" style={{ width:'100%', marginTop:8 }} disabled={loading} onClick={onCancel}>
          {loading ? 'Cancelling…' : 'Cancel Booking'}
        </button>
      )}
    </div>
  );
});

