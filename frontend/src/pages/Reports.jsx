import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '../api/client';
import { TrendingUp, Wrench, Trophy, Moon, Building2, CalendarClock, Grid3x3, Download } from 'lucide-react';

const REPORT_STALE = 3 * 60 * 1000; // reporting queries — not real-time

export default function Reports() {
    const q = (key, url) => useQuery({
        queryKey: ['reports', key],
        queryFn: async () => (await api.get(url)).data.data,
        staleTime: REPORT_STALE,
    });

    const { data: utilization } = q('utilization', '/reports/utilization');
    const { data: maintenance } = q('maintenance-frequency', '/reports/maintenance-frequency');
    const { data: mostUsedIdle } = q('most-used-idle', '/reports/most-used-idle?limit=5');
    const { data: deptAlloc } = q('department-allocation', '/reports/department-allocation');
    const { data: maintenanceDue } = q('maintenance-due', '/reports/maintenance-due');
    const { data: heatmap } = q('booking-heatmap', '/reports/booking-heatmap');

    const exportCsv = async (type) => {
        try {
            const res = await api.get(`/reports/export?type=${type}&format=csv`, { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
            const a = document.createElement('a');
            a.href = url; a.download = `${type}.csv`; a.click();
            URL.revokeObjectURL(url);
            toast.success(`Exported ${type}.csv`);
        } catch {
            toast.error('Export failed');
        }
    };

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const maxHeat = heatmap ? Math.max(1, ...heatmap.flat()) : 1;

    return (
        <div>
            <div className="animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '28px' }}>
                <div>
                    <h1 className="page-title">Reports &amp; Analytics</h1>
                    <p className="page-sub">Operational insight across assets, maintenance, and bookings</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => exportCsv('assets')}>
                        <Download size={15} /> Export Assets
                    </button>
                    <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => exportCsv('department-allocation')}>
                        <Download size={15} /> Export Allocation
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Utilization by Category */}
                <div className="card animate-in d-1">
                    <h2 className="section-title" style={{ marginBottom: '22px' }}>
                        <TrendingUp size={16} color="var(--accent)" /> Utilization by Category
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        {utilization?.map(u => {
                            const pct = Math.round((u.allocated_count / Math.max(u.total_assets, 1)) * 100);
                            return (
                                <div key={u.category_id}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '7px' }}>
                                        <span style={{ fontWeight: 500 }}>{u.category_name}</span>
                                        <span style={{ color: 'var(--text-secondary)' }}>{u.allocated_count} / {u.total_assets} <span style={{ color: 'var(--success)', fontWeight: 700, marginLeft: '6px' }}>({pct}%)</span></span>
                                    </div>
                                    <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%`, background: 'var(--grad-accent)' }} /></div>
                                </div>
                            );
                        })}
                        {!utilization?.length && <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No data yet.</p>}
                    </div>
                </div>

                {/* Maintenance Frequency */}
                <div className="card animate-in d-2" style={{ padding: 0, overflow: 'hidden' }}>
                    <h2 className="section-title" style={{ padding: '24px 24px 18px' }}>
                        <Wrench size={16} color="var(--warning)" /> Maintenance Frequency
                    </h2>
                    <table className="table">
                        <thead><tr><th>Category</th><th>Total Repairs</th></tr></thead>
                        <tbody>
                            {maintenance?.map((m, i) => (
                                <tr key={i}><td style={{ fontWeight: 500 }}>{m.category_name}</td><td style={{ color: 'var(--text-secondary)' }}>{m.repair_count}</td></tr>
                            ))}
                            {!maintenance?.length && <tr><td colSpan={2} style={{ color: 'var(--text-secondary)' }}>No data yet.</td></tr>}
                        </tbody>
                    </table>
                </div>

                {/* Most Used */}
                <div className="card animate-in d-1">
                    <h2 className="section-title" style={{ marginBottom: '18px' }}><Trophy size={16} color="#fbbf24" /> Most Used Assets</h2>
                    {mostUsedIdle?.mostUsed?.length ? mostUsedIdle.mostUsed.map((a, i) => (
                        <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
                            <span><span style={{ color: 'var(--text-secondary)', marginRight: '8px' }}>#{i + 1}</span><span className="mono" style={{ color: 'var(--accent)' }}>{a.asset_tag}</span> — {a.name}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{a.activity} uses</span>
                        </div>
                    )) : <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No activity yet.</p>}
                </div>

                {/* Idle */}
                <div className="card animate-in d-2">
                    <h2 className="section-title" style={{ marginBottom: '18px' }}><Moon size={16} color="#94a3b8" /> Idle Assets</h2>
                    {mostUsedIdle?.idle?.length ? mostUsedIdle.idle.map(a => (
                        <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
                            <span><span className="mono" style={{ color: 'var(--accent)' }}>{a.asset_tag}</span> — {a.name}</span>
                            <span className="badge" style={{ background: 'rgba(148,163,184,0.12)', color: '#94a3b8' }}>{a.status}</span>
                        </div>
                    )) : <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>All assets have activity.</p>}
                </div>

                {/* Department Allocation */}
                <div className="card animate-in d-1" style={{ padding: 0, overflow: 'hidden' }}>
                    <h2 className="section-title" style={{ padding: '24px 24px 18px' }}><Building2 size={16} color="var(--accent)" /> Department Allocation</h2>
                    <table className="table">
                        <thead><tr><th>Department</th><th>Allocated Assets</th></tr></thead>
                        <tbody>
                            {deptAlloc?.map(d => (
                                <tr key={d.department_id}><td style={{ fontWeight: 500 }}>{d.department}</td><td style={{ color: 'var(--text-secondary)' }}>{d.allocated_count}</td></tr>
                            ))}
                            {!deptAlloc?.length && <tr><td colSpan={2} style={{ color: 'var(--text-secondary)' }}>No data yet.</td></tr>}
                        </tbody>
                    </table>
                </div>

                {/* Maintenance Due / Nearing Retirement */}
                <div className="card animate-in d-2" style={{ padding: 0, overflow: 'hidden' }}>
                    <h2 className="section-title" style={{ padding: '24px 24px 18px' }}><CalendarClock size={16} color="var(--danger)" /> Due for Maintenance / Retirement</h2>
                    <table className="table">
                        <thead><tr><th>Asset</th><th>Acquired</th></tr></thead>
                        <tbody>
                            {maintenanceDue?.map(a => (
                                <tr key={a.id}><td><span className="mono" style={{ color: 'var(--accent)' }}>{a.asset_tag}</span> {a.name}</td><td style={{ color: 'var(--text-secondary)' }}>{a.acquisition_date || '—'}</td></tr>
                            ))}
                            {!maintenanceDue?.length && <tr><td colSpan={2} style={{ color: 'var(--text-secondary)' }}>Nothing nearing end-of-life.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Booking heatmap */}
            <div className="card animate-in d-1" style={{ marginTop: '20px', overflowX: 'auto' }}>
                <h2 className="section-title" style={{ marginBottom: '18px' }}><Grid3x3 size={16} color="var(--accent)" /> Booking Heatmap (peak usage)</h2>
                {heatmap ? (
                    <div style={{ display: 'inline-block', minWidth: '640px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '44px repeat(24, 1fr)', gap: '2px', alignItems: 'center' }}>
                            <div />
                            {Array.from({ length: 24 }, (_, h) => (
                                <div key={h} style={{ fontSize: '9px', color: 'var(--text-secondary)', textAlign: 'center' }}>{h}</div>
                            ))}
                            {days.map((day, di) => (
                                <React.Fragment key={day}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{day}</div>
                                    {Array.from({ length: 24 }, (_, h) => {
                                        const v = heatmap[di]?.[h] || 0;
                                        const intensity = v / maxHeat;
                                        return (
                                            <div key={h} title={`${day} ${h}:00 — ${v} booking(s)`} style={{
                                                aspectRatio: '1', borderRadius: '3px',
                                                background: v ? `rgba(99,102,241,${0.15 + intensity * 0.75})` : 'rgba(255,255,255,0.03)',
                                            }} />
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                ) : <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading…</p>}
            </div>
        </div>
    );
}
