import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { FileCheck, ClipboardList, AlertCircle, X, Plus } from 'lucide-react';

export default function Audits() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Verify panel state
    const [cycleId, setCycleId] = useState('');
    const [assetId, setAssetId] = useState('');
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState('Present');

    // Report modal
    const [selectedReportCycle, setSelectedReportCycle] = useState(null);

    // Create cycle modal
    const [isCreating, setIsCreating] = useState(false);
    const [cycleForm, setCycleForm] = useState({ name: '', start_date: '', end_date: '', scope_department_id: '', auditor_ids: [] });

    const isManager = ['admin', 'asset_manager'].includes(user?.role);

    // ── Queries ──────────────────────────────────────────────
    const { data: cycles = [], isLoading: cyclesLoading } = useQuery({
        queryKey: ['audit-cycles'],
        queryFn: async () => (await api.get('/audit-cycles')).data.data,
    });

    const { data: items = [] } = useQuery({
        queryKey: ['audit-items', cycleId],
        queryFn: async () => (await api.get(`/audit-cycles/${cycleId}/items`)).data.data,
        enabled: !!cycleId,
    });

    const { data: reportData } = useQuery({
        queryKey: ['audit-report', selectedReportCycle],
        queryFn: async () => (await api.get(`/audit-cycles/${selectedReportCycle}/discrepancy-report`)).data.data,
        enabled: !!selectedReportCycle,
    });

    const { data: departments = [] } = useQuery({
        queryKey: ['departments'],
        queryFn: async () => (await api.get('/departments')).data.data,
        enabled: isCreating,
    });

    const { data: employees = [] } = useQuery({
        queryKey: ['employees'],
        queryFn: async () => (await api.get('/employees')).data.data,
        enabled: isCreating,
    });

    // ── Mutations ─────────────────────────────────────────────
    const createCycleMutation = useMutation({
        mutationFn: async (data) => {
            const { auditor_ids, ...cycle } = data;
            const res = await api.post('/audit-cycles', cycle);
            // Assign auditors to the freshly created cycle, if any were selected.
            if (auditor_ids?.length) {
                await api.post(`/audit-cycles/${res.data.data.id}/auditors`, { auditor_ids });
            }
            return res;
        },
        onSuccess: (res) => {
            const meta = res.data.meta;
            toast.success(`Audit cycle created with ${meta?.items_created ?? 0} assets auto-added`);
            setIsCreating(false);
            setCycleForm({ name: '', start_date: '', end_date: '', scope_department_id: '', auditor_ids: [] });
            queryClient.invalidateQueries(['audit-cycles']);
        },
        onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to create cycle'),
    });

    const verifyMutation = useMutation({
        mutationFn: ({ cycle_id, asset_id, verification_status, notes }) =>
            api.put(`/audit-cycles/${cycle_id}/items/${asset_id}/verify`, { verification_status, notes }),
        onSuccess: () => {
            toast.success('Asset verified');
            setAssetId(''); setNotes('');
            queryClient.invalidateQueries(['audit-items', cycleId]);
            queryClient.invalidateQueries(['audit-cycles']);
        },
        onError: (err) => toast.error(err.response?.data?.error?.message || 'Verification failed'),
    });

    const closeMutation = useMutation({
        mutationFn: (id) => api.put(`/audit-cycles/${id}/close`),
        onSuccess: (res) => {
            const lost = res.data.meta?.assets_marked_lost ?? 0;
            toast.success(`Cycle closed — ${lost} asset(s) marked Lost`);
            queryClient.invalidateQueries(['audit-cycles']);
        },
        onError: (err) => toast.error(err.response?.data?.error?.message || 'Closure failed'),
    });

    // ── Helpers ───────────────────────────────────────────────
    const statusMap = { Present: 'Verified', Missing: 'Missing', Damaged: 'Damaged' };
    const statusBtnColor = (s) => s === 'Present' ? 'var(--success)' : s === 'Damaged' ? 'var(--warning)' : 'var(--danger)';
    const statusBgColor  = (s) => s === 'Present' ? 'rgba(52,211,153,0.14)' : s === 'Damaged' ? 'rgba(251,191,36,0.14)' : 'rgba(248,113,113,0.14)';

    const openCycles = cycles.filter(c => c.status === 'Open');

    return (
        <div>
            {/* ── Header ── */}
            <div className="animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 className="page-title">Audits</h1>
                    <p className="page-sub">Verify asset presence and manage audit cycles</p>
                </div>
                {isManager && (
                    <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setIsCreating(true)}>
                        <Plus size={16} /> New Audit Cycle
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                {/* ── Verify Asset Panel ── */}
                <div className="card animate-in d-1">
                    <h2 className="section-title" style={{ marginBottom: '22px' }}>
                        <FileCheck size={16} color="var(--accent)" /> Verify Asset
                    </h2>

                    {/* Cycle selector */}
                    <div style={{ marginBottom: '16px' }}>
                        <label className="label">Select Audit Cycle</label>
                        <select className="input" value={cycleId} onChange={e => { setCycleId(e.target.value); setAssetId(''); }}>
                            <option value="">Choose an open cycle…</option>
                            {openCycles.map(c => (
                                <option key={c.id} value={c.id}>
                                    #{c.id} — {c.name} (started {c.start_date})
                                </option>
                            ))}
                        </select>
                        {openCycles.length === 0 && !cyclesLoading && (
                            <p style={{ fontSize: '12px', color: 'var(--warning)', marginTop: '6px' }}>
                                No open audit cycles. Create one first.
                            </p>
                        )}
                    </div>

                    {/* Asset selector — only shown when cycle is chosen */}
                    {cycleId && (
                        <div style={{ marginBottom: '16px' }}>
                            <label className="label">Select Asset ({items.length} in cycle)</label>
                            <select className="input" value={assetId} onChange={e => setAssetId(e.target.value)}>
                                <option value="">Choose an asset…</option>
                                {items.map(it => {
                                    const a = it.Asset;
                                    const label = a
                                        ? `${a.asset_tag} — ${a.name} [${it.verification_status}]`
                                        : `Asset #${it.asset_id} [${it.verification_status}]`;
                                    const isPending = it.verification_status === 'Pending';
                                    return (
                                        <option key={it.id} value={a?.id || it.asset_id} disabled={!isPending}>
                                            {label}{!isPending ? ' ✓' : ''}
                                        </option>
                                    );
                                })}
                            </select>
                            {items.length === 0 && (
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                                    No assets found in this cycle yet.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Status buttons */}
                    <div style={{ marginBottom: '16px' }}>
                        <label className="label">Verification Status</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {['Present', 'Missing', 'Damaged'].map(s => {
                                const active = status === s;
                                const color = statusBtnColor(s);
                                return (
                                    <button key={s} onClick={() => setStatus(s)} style={{
                                        flex: 1, padding: '10px',
                                        border: `1px solid ${active ? color : 'var(--border)'}`,
                                        background: active ? statusBgColor(s) : 'var(--bg-input)',
                                        color: active ? color : 'var(--text-secondary)',
                                        borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}>
                                        {s === 'Present' ? '✓ Present' : s === 'Missing' ? '✕ Missing' : '⚠ Damaged'}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Notes */}
                    <div style={{ marginBottom: '22px' }}>
                        <label className="label">Notes (optional)</label>
                        <textarea className="input" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Add any notes…" />
                    </div>

                    <button
                        className="btn btn-primary"
                        onClick={() => verifyMutation.mutate({ cycle_id: cycleId, asset_id: assetId, verification_status: statusMap[status], notes })}
                        disabled={!cycleId || !assetId || verifyMutation.isPending}
                        style={{ width: '100%', padding: '12px' }}
                    >
                        {verifyMutation.isPending ? 'Recording…' : 'Record Verification'}
                    </button>
                </div>

                {/* ── Audit Cycles List ── */}
                <div className="card animate-in d-2">
                    <h2 className="section-title" style={{ marginBottom: '22px' }}>
                        <ClipboardList size={16} color="var(--warning)" /> Audit Cycles
                    </h2>

                    {cyclesLoading && <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>Loading…</div>}

                    {cycles.length === 0 && !cyclesLoading && (
                        <div className="empty-state" style={{ padding: '30px' }}>No audit cycles yet. Create one to get started.</div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {cycles.map(c => (
                            <div key={c.id} style={{
                                padding: '17px',
                                background: 'rgba(255,255,255,0.03)',
                                border: `1px solid ${c.status === 'Open' ? 'rgba(52,211,153,0.2)' : 'var(--border)'}`,
                                borderRadius: '13px',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 700, fontSize: '14px', fontFamily: 'var(--font-display)' }}>
                                        #{c.id} — {c.name}
                                    </span>
                                    <span className="badge" style={{
                                        background: c.status === 'Open' ? 'rgba(52,211,153,0.15)' : 'rgba(156,163,175,0.12)',
                                        color: c.status === 'Open' ? 'var(--success)' : '#9ca3af',
                                        borderColor: c.status === 'Open' ? 'rgba(52,211,153,0.3)' : 'rgba(156,163,175,0.25)',
                                    }}>
                                        {c.status === 'Open' && <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: 'var(--success)', marginRight: '5px', verticalAlign: 'middle' }} />}
                                        {c.status}
                                    </span>
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.7 }}>
                                    Dept: {c.ScopeDepartment?.name || 'All'} &nbsp;·&nbsp;
                                    {c.start_date} → {c.end_date || 'Ongoing'}
                                </div>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {c.status === 'Open' && isManager && (
                                        <button
                                            className="btn btn-soft-danger"
                                            onClick={() => {
                                                if (window.confirm('Close this cycle? All un-verified assets will be marked Missing.')) {
                                                    closeMutation.mutate(c.id);
                                                }
                                            }}
                                            style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                                        >
                                            Close Cycle
                                        </button>
                                    )}
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setSelectedReportCycle(c.id)}
                                        style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                                    >
                                        View Report
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Create Cycle Modal ── */}
            {isCreating && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '480px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
                            <h2 className="section-title">New Audit Cycle</h2>
                            <button onClick={() => setIsCreating(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={e => { e.preventDefault(); createCycleMutation.mutate({ ...cycleForm, scope_department_id: cycleForm.scope_department_id || null }); }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label className="label">Cycle Name *</label>
                                <input type="text" className="input" required placeholder="e.g. Q3 2026 Full Audit" value={cycleForm.name} onChange={e => setCycleForm({ ...cycleForm, name: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label className="label">Start Date *</label>
                                    <input type="date" className="input" required value={cycleForm.start_date} onChange={e => setCycleForm({ ...cycleForm, start_date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="label">End Date</label>
                                    <input type="date" className="input" value={cycleForm.end_date} onChange={e => setCycleForm({ ...cycleForm, end_date: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="label">Scope — Department (optional)</label>
                                <select className="input" value={cycleForm.scope_department_id} onChange={e => setCycleForm({ ...cycleForm, scope_department_id: e.target.value })}>
                                    <option value="">All Departments</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '5px', opacity: 0.8 }}>
                                    Leaving blank auto-adds all assets in the system.
                                </p>
                            </div>
                            <div>
                                <label className="label">Assign Auditors (optional)</label>
                                <div style={{ maxHeight: '130px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px' }}>
                                    {employees.length === 0 && <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Loading employees…</p>}
                                    {employees.map(emp => {
                                        const checked = cycleForm.auditor_ids.includes(emp.id);
                                        return (
                                            <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 4px', fontSize: '13px', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={checked} onChange={() => {
                                                    setCycleForm(f => ({ ...f, auditor_ids: checked ? f.auditor_ids.filter(x => x !== emp.id) : [...f.auditor_ids, emp.id] }));
                                                }} />
                                                {emp.name} <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>({emp.role?.replace('_', ' ')})</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ padding: '12px', marginTop: '4px' }} disabled={createCycleMutation.isPending}>
                                {createCycleMutation.isPending ? 'Creating…' : 'Create Cycle'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Discrepancy Report Modal ── */}
            {selectedReportCycle && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }}>
                    <div className="card" style={{ width: '92%', maxWidth: '760px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 className="section-title">
                                <AlertCircle size={18} color="var(--danger)" style={{ marginRight: '8px' }} />
                                Discrepancy Report — Cycle #{selectedReportCycle}
                            </h2>
                            <button onClick={() => setSelectedReportCycle(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {!reportData ? (
                            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px' }}>Loading…</div>
                        ) : reportData.length === 0 ? (
                            <div className="empty-state" style={{ padding: '36px' }}>✅ No discrepancies found for this cycle.</div>
                        ) : (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Asset Tag</th>
                                        <th>Name</th>
                                        <th>Issue</th>
                                        <th>Notes</th>
                                        <th>Auditor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map(item => (
                                        <tr key={item.id}>
                                            <td className="mono" style={{ color: 'var(--accent)' }}>{item.Asset?.asset_tag || '—'}</td>
                                            <td>{item.Asset?.name || `Asset #${item.asset_id}`}</td>
                                            <td>
                                                <span className="badge" style={{
                                                    background: item.verification_status === 'Missing' ? 'rgba(248,113,113,0.15)' : 'rgba(251,191,36,0.15)',
                                                    color: item.verification_status === 'Missing' ? 'var(--danger)' : 'var(--warning)',
                                                }}>
                                                    {item.verification_status}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{item.notes || '—'}</td>
                                            <td style={{ fontSize: '12px' }}>{item.Auditor?.name || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
