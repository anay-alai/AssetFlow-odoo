import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Plus, X } from 'lucide-react';

const COLUMNS = [
    { key: 'Pending', color: '#fbbf24' },
    { key: 'Approved', color: '#60a5fa' },
    { key: 'Technician Assigned', color: '#a78bfa' },
    { key: 'In Progress', color: '#818cf8' },
    { key: 'Resolved', color: '#34d399' },
];

const priorityColors = { high: '#f87171', medium: '#fbbf24', low: '#34d399' };

export default function Maintenance() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [isRaising, setIsRaising] = useState(false);
    const [formData, setFormData] = useState({ asset_id: '', priority: 'medium', issue_description: '' });
    const [technicianName, setTechnicianName] = useState('');
    const [assigningId, setAssigningId] = useState(null);

    // Fetch all requests
    const { data: allRequests = [], isLoading } = useQuery({
        queryKey: ['maintenance'],
        queryFn: async () => (await api.get('/maintenance-requests')).data.data,
    });

    // Fetch assets list for the form
    const { data: assets = [] } = useQuery({
        queryKey: ['assets-list'],
        queryFn: async () => (await api.get('/assets')).data.data,
        enabled: isRaising,
    });

    const raiseMutation = useMutation({
        mutationFn: (data) => api.post('/maintenance-requests', data),
        onSuccess: () => {
            toast.success('Maintenance request submitted');
            setIsRaising(false);
            setFormData({ asset_id: '', priority: 'medium', issue_description: '' });
            queryClient.invalidateQueries(['maintenance']);
        },
        onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to submit request'),
    });

    const approveMutation = useMutation({
        mutationFn: (id) => api.put(`/maintenance-requests/${id}/approve`),
        onSuccess: () => { toast.success('Approved — asset set to Under Maintenance'); queryClient.invalidateQueries(['maintenance']); },
        onError: (err) => toast.error(err.response?.data?.error?.message || 'Approval failed'),
    });

    const rejectMutation = useMutation({
        mutationFn: (id) => api.put(`/maintenance-requests/${id}/reject`),
        onSuccess: () => { toast.success('Request rejected'); queryClient.invalidateQueries(['maintenance']); },
        onError: () => toast.error('Rejection failed'),
    });

    const assignMutation = useMutation({
        mutationFn: ({ id, name }) => api.put(`/maintenance-requests/${id}/assign-technician`, { technician_name: name }),
        onSuccess: () => { toast.success('Technician assigned'); setAssigningId(null); setTechnicianName(''); queryClient.invalidateQueries(['maintenance']); },
        onError: () => toast.error('Assigning failed'),
    });

    const startMutation = useMutation({
        mutationFn: (id) => api.put(`/maintenance-requests/${id}/start`),
        onSuccess: () => { toast.success('Work started'); queryClient.invalidateQueries(['maintenance']); },
        onError: () => toast.error('Failed to start'),
    });

    const resolveMutation = useMutation({
        mutationFn: ({ id, notes }) => api.put(`/maintenance-requests/${id}/resolve`, { resolution_notes: notes || 'Resolved by technician' }),
        onSuccess: () => { toast.success('Maintenance resolved'); queryClient.invalidateQueries(['maintenance']); },
        onError: () => toast.error('Failed to resolve'),
    });

    const grouped = COLUMNS.reduce((acc, col) => {
        acc[col.key] = allRequests.filter(r => r.status === col.key);
        return acc;
    }, {});

    const isManager = ['admin', 'asset_manager'].includes(user?.role);

    return (
        <div>
            {/* Header */}
            <div className="animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 className="page-title">Maintenance Board</h1>
                    <p className="page-sub">Track and manage maintenance requests across all stages</p>
                </div>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setIsRaising(true)}>
                    <Plus size={16} /> Raise Request
                </button>
            </div>

            {/* Kanban Columns */}
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', minHeight: '500px' }}>
                {COLUMNS.map((col, ci) => (
                    <div key={col.key} className={`card animate-in d-${ci + 1}`} style={{
                        minWidth: '270px', maxWidth: '270px',
                        padding: 0, display: 'flex', flexDirection: 'column',
                        borderTop: `2px solid ${col.color}77`,
                    }}>
                        {/* Column Header */}
                        <div style={{ padding: '15px 17px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                                <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{col.key}</span>
                            </div>
                            <span className="badge" style={{ background: `${col.color}22`, color: col.color, borderColor: `${col.color}44`, fontSize: '11px' }}>
                                {grouped[col.key]?.length || 0}
                            </span>
                        </div>

                        {/* Cards */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {(!grouped[col.key] || grouped[col.key].length === 0) && (
                                <div style={{ textAlign: 'center', padding: '34px 10px', color: 'var(--text-secondary)', fontSize: '12px', opacity: 0.6 }}>
                                    No items
                                </div>
                            )}
                            {grouped[col.key]?.map(req => (
                                <div key={req.id} style={{
                                    background: 'rgba(255,255,255,0.035)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '11px', padding: '14px',
                                    transition: 'border-color 0.2s, transform 0.15s',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 700 }}>
                                            {req.Asset?.name || `Asset #${req.asset_id}`}
                                        </span>
                                        <span className="badge" style={{
                                            fontSize: '10px', padding: '2px 8px', textTransform: 'capitalize',
                                            background: `${priorityColors[req.priority] || '#888'}18`,
                                            color: priorityColors[req.priority] || '#888',
                                            borderColor: `${priorityColors[req.priority] || '#888'}35`,
                                        }}>{req.priority}</span>
                                    </div>
                                    <p style={{ fontSize: '11px', color: 'var(--accent)', marginBottom: '4px', fontFamily: 'monospace' }}>
                                        {req.Asset?.asset_tag}
                                    </p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.5 }}>
                                        {req.issue_description}
                                    </p>
                                    {req.technician_name && (
                                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                            🔧 {req.technician_name}
                                        </p>
                                    )}

                                    {/* Action Buttons */}
                                    {isManager && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {req.status === 'Pending' && (
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button className="btn btn-soft-info" onClick={() => approveMutation.mutate(req.id)} style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: '8px' }}>Approve</button>
                                                    <button className="btn btn-soft-danger" onClick={() => rejectMutation.mutate(req.id)} style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: '8px' }}>Reject</button>
                                                </div>
                                            )}
                                            {req.status === 'Approved' && (
                                                assigningId === req.id ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        <input
                                                            type="text"
                                                            className="input"
                                                            placeholder="Technician name"
                                                            value={technicianName}
                                                            onChange={e => setTechnicianName(e.target.value)}
                                                            style={{ fontSize: '12px', padding: '7px 10px' }}
                                                        />
                                                        <div style={{ display: 'flex', gap: '6px' }}>
                                                            <button className="btn btn-soft-info" onClick={() => assignMutation.mutate({ id: req.id, name: technicianName || 'Internal Team' })} style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: '8px' }}>Confirm</button>
                                                            <button className="btn btn-secondary" onClick={() => { setAssigningId(null); setTechnicianName(''); }} style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: '8px' }}>Cancel</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button className="btn btn-soft-info" onClick={() => setAssigningId(req.id)} style={{ width: '100%', padding: '6px', fontSize: '11px', borderRadius: '8px' }}>Assign Technician</button>
                                                )
                                            )}
                                            {req.status === 'Technician Assigned' && (
                                                <button className="btn btn-soft-info" onClick={() => startMutation.mutate(req.id)} style={{ width: '100%', padding: '6px', fontSize: '11px', borderRadius: '8px' }}>Start Work</button>
                                            )}
                                            {req.status === 'In Progress' && (
                                                <button className="btn btn-soft-info" onClick={() => resolveMutation.mutate({ id: req.id, notes: '' })} style={{ width: '100%', padding: '6px', fontSize: '11px', borderRadius: '8px' }}>Mark Resolved</button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Raise Request Modal */}
            {isRaising && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
                            <h2 className="section-title">Raise Maintenance Request</h2>
                            <button onClick={() => setIsRaising(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={e => { e.preventDefault(); raiseMutation.mutate({ ...formData, asset_id: parseInt(formData.asset_id) }); }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label className="label">Asset *</label>
                                <select
                                    className="input"
                                    required
                                    value={formData.asset_id}
                                    onChange={e => setFormData({ ...formData, asset_id: e.target.value })}
                                >
                                    <option value="">Select asset…</option>
                                    {assets.map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.name} — {a.asset_tag} [{a.status}]
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label">Priority</label>
                                <select className="input" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Issue Description *</label>
                                <textarea
                                    className="input"
                                    required
                                    rows={4}
                                    placeholder="Describe the issue in detail…"
                                    value={formData.issue_description}
                                    onChange={e => setFormData({ ...formData, issue_description: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ padding: '12px', marginTop: '4px' }} disabled={raiseMutation.isPending}>
                                {raiseMutation.isPending ? 'Submitting…' : 'Submit Request'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
