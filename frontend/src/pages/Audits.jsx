import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { toast } from 'react-hot-toast';
import { FileCheck, ClipboardList, AlertCircle, X } from 'lucide-react';

export default function Audits() {
    const queryClient = useQueryClient();
    const [cycleId, setCycleId] = useState('');
    const [assetId, setAssetId] = useState('');
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState('Present');
    const [selectedReportCycle, setSelectedReportCycle] = useState(null);

    const { data: cycles } = useQuery({
        queryKey: ['audit-cycles'],
        queryFn: async () => (await api.get('/audit-cycles')).data.data,
    });

    const { data: items } = useQuery({
        queryKey: ['audit-items', cycleId],
        queryFn: async () => (await api.get(`/audit-cycles/${cycleId}/items`)).data.data,
        enabled: !!cycleId,
    });

    const verifyMutation = useMutation({
        mutationFn: async (data) => api.put(`/audit-cycles/${data.cycle_id}/items/${data.asset_id}/verify`, {
            verification_status: data.verification_status,
            notes: data.notes,
        }),
        onSuccess: () => { toast.success('Item verified'); setAssetId(''); setNotes(''); queryClient.invalidateQueries(['audit-items', cycleId]); queryClient.invalidateQueries(['audit-cycles']); },
        onError: () => toast.error('Verification failed'),
    });

    const closeMutation = useMutation({
        mutationFn: async (id) => api.put(`/audit-cycles/${id}/close`),
        onSuccess: () => { toast.success('Audit cycle closed'); queryClient.invalidateQueries(['audit-cycles']); },
        onError: () => toast.error('Closure failed'),
    });

    const { data: reportData } = useQuery({
        queryKey: ['audit-report', selectedReportCycle],
        queryFn: async () => (await api.get(`/audits/${selectedReportCycle}/discrepancy-report`)).data.data,
        enabled: !!selectedReportCycle,
    });

    return (
        <div>
            <div className="animate-in" style={{ marginBottom: '28px' }}>
                <h1 className="page-title">Audits</h1>
                <p className="page-sub">Verify asset presence and manage audit cycles</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Verify Item */}
                <div className="card animate-in d-1">
                    <h2 className="section-title" style={{ marginBottom: '22px' }}>
                        <FileCheck size={16} color="var(--accent)" /> Verify Asset
                    </h2>

                    <div style={{ marginBottom: '16px' }}>
                        <label className="label">Audit Cycle ID</label>
                        <select className="input" value={cycleId} onChange={e => setCycleId(e.target.value)}>
                            <option value="">Select an active cycle...</option>
                            {cycles?.filter(c => c.status === 'Open').map(c => (
                                <option key={c.id} value={c.id}>Cycle #{c.id} (Started: {c.start_date})</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label className="label">Select Asset</label>
                        <select className="input" value={assetId} onChange={e => setAssetId(e.target.value)}>
                            <option value="">Select an asset...</option>
                            {items?.map(it => (
                                <option key={it.id} value={it.Asset?.id || it.asset_id}>
                                    {it.Asset ? `${it.Asset.id} — ${it.Asset.tag || it.Asset.name || 'unnamed'}` : `Asset #${it.asset_id}`}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label className="label">Status</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {['Present', 'Missing', 'Damaged'].map(s => {
                                const active = status === s;
                                const color = s === 'Present' ? 'var(--success)' : 'var(--danger)';
                                return (
                                    <button key={s} onClick={() => setStatus(s)} style={{
                                        flex: 1, padding: '10px',
                                        border: `1px solid ${active ? color : 'var(--border)'}`,
                                        background: active
                                            ? (s === 'Present' ? 'rgba(52,211,153,0.14)' : 'rgba(248,113,113,0.14)')
                                            : 'var(--bg-input)',
                                        color: active ? color : 'var(--text-secondary)',
                                        borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}>{s === 'Present' ? '✓ Present' : s === 'Missing' ? '✕ Missing' : '⚠ Damaged'}</button>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ marginBottom: '22px' }}>
                        <label className="label">Notes</label>
                        <textarea className="input" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
                    </div>

                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            const mapping = { 'Present': 'Verified', 'Missing': 'Missing', 'Damaged': 'Damaged' };
                            verifyMutation.mutate({ cycle_id: cycleId, asset_id: assetId, verification_status: mapping[status] || 'Pending', notes });
                        }}
                        disabled={!cycleId || !assetId}
                        style={{ width: '100%', padding: '12px' }}>
                        Record Verification
                    </button>
                </div>

                {/* Audit Cycles List */}
                <div className="card animate-in d-2">
                    <h2 className="section-title" style={{ marginBottom: '22px' }}>
                        <ClipboardList size={16} color="var(--warning)" /> Audit Cycles
                    </h2>

                    {cycles?.map(c => (
                        <div key={c.id} style={{
                            padding: '17px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border)',
                            borderRadius: '13px', marginBottom: '12px',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontWeight: 700, fontSize: '14px', fontFamily: 'var(--font-display)' }}>Cycle #{c.id} - {c.name}</span>
                                <span className="badge" style={{
                                    background: c.status === 'Open' ? 'rgba(52,211,153,0.15)' : 'rgba(156,163,175,0.15)',
                                    color: c.status === 'Open' ? 'var(--success)' : '#9ca3af',
                                    borderColor: c.status === 'Open' ? 'rgba(52,211,153,0.3)' : 'rgba(156,163,175,0.3)',
                                }}>
                                    {c.status === 'Open' && <span className="pulse-dot" style={{ width: '5px', height: '5px', background: 'var(--success)', color: 'var(--success)', display: 'inline-block' }} />}
                                    {c.status}
                                </span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.6 }}>
                                Scope Dept ID: {c.scope_department_id || 'All'} <br />
                                Started: {c.start_date} <br />
                                Ends: {c.end_date}
                            </div>
                            
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {c.status === 'Open' && (
                                    <button
                                        className="btn btn-soft-danger"
                                        onClick={() => {
                                            if (confirm('Are you sure? This will mark all unverified items as Lost.')) {
                                                closeMutation.mutate(c.id);
                                            }
                                        }}
                                        style={{ flex: 1, padding: '9px', fontSize: '12px' }}>
                                        Close Cycle
                                    </button>
                                )}
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setSelectedReportCycle(c.id)}
                                    style={{ flex: 1, padding: '9px', fontSize: '12px' }}>
                                    View Report
                                </button>
                            </div>
                        </div>
                    ))}
                    {cycles?.length === 0 && <div className="empty-state" style={{ padding: '30px' }}>No audit cycles found.</div>}
                </div>
            </div>

            {/* Discrepancy Report Modal */}
            {selectedReportCycle && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '700px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 className="section-title"><AlertCircle size={18} color="var(--danger)" /> Discrepancy Report (Cycle #{selectedReportCycle})</h2>
                            <button onClick={() => setSelectedReportCycle(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        
                        {!reportData ? (
                            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>Loading...</div>
                        ) : reportData.length === 0 ? (
                            <div className="empty-state" style={{ padding: '30px' }}>No discrepancies found for this cycle.</div>
                        ) : (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Asset Tag</th>
                                        <th>Name</th>
                                        <th>Status</th>
                                        <th>Notes</th>
                                        <th>Auditor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map(item => (
                                        <tr key={item.id}>
                                            <td className="mono">{item.Asset?.asset_tag}</td>
                                            <td>{item.Asset?.name}</td>
                                            <td>
                                                <span className="badge" style={{ background: 'rgba(248,113,113,0.15)', color: 'var(--danger)' }}>
                                                    {item.verification_status}
                                                </span>
                                            </td>
                                            <td>{item.notes || '-'}</td>
                                            <td>{item.Auditor?.name || '-'}</td>
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
