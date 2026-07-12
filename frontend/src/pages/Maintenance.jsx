import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

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

    const { data: allRequests } = useQuery({
        queryKey: ['maintenance'],
        queryFn: async () => {
            const statuses = ['Pending', 'Approved', 'Technician Assigned', 'In Progress', 'Resolved'];
            const results = await Promise.all(
                statuses.map(s => api.get('/maintenance-requests').catch(() => ({ data: { data: [] } })))
            );
            return results[0]?.data?.data || [];
        },
    });

    const approveMutation = useMutation({
        mutationFn: (id) => api.put(`/maintenance-requests/${id}/approve`),
        onSuccess: () => { toast.success('Request approved — asset set to Under Maintenance'); queryClient.invalidateQueries(['maintenance']); },
        onError: () => toast.error('Approval failed'),
    });

    const rejectMutation = useMutation({
        mutationFn: (id) => api.put(`/maintenance-requests/${id}/reject`),
        onSuccess: () => { toast.success('Request rejected'); queryClient.invalidateQueries(['maintenance']); },
        onError: () => toast.error('Rejection failed'),
    });

    const assignMutation = useMutation({
        mutationFn: (id) => api.put(`/maintenance-requests/${id}/assign-technician`, { technician_name: 'Internal Team' }),
        onSuccess: () => { toast.success('Technician assigned'); queryClient.invalidateQueries(['maintenance']); },
        onError: () => toast.error('Assigning failed'),
    });

    const startMutation = useMutation({
        mutationFn: (id) => api.put(`/maintenance-requests/${id}/start`),
        onSuccess: () => { toast.success('Maintenance started'); queryClient.invalidateQueries(['maintenance']); },
        onError: () => toast.error('Failed to start'),
    });

    const resolveMutation = useMutation({
        mutationFn: (id) => api.put(`/maintenance-requests/${id}/resolve`, { resolution_notes: 'Resolved by technician' }),
        onSuccess: () => { toast.success('Maintenance resolved'); queryClient.invalidateQueries(['maintenance']); },
        onError: () => toast.error('Failed to resolve'),
    });

    const grouped = COLUMNS.reduce((acc, col) => {
        acc[col.key] = allRequests?.filter(r => r.status === col.key) || [];
        return acc;
    }, {});

    const isManager = ['admin', 'asset_manager'].includes(user?.role);

    return (
        <div>
            <div className="animate-in" style={{ marginBottom: '28px' }}>
                <h1 className="page-title">Maintenance Board</h1>
                <p className="page-sub">Track and manage maintenance requests across all stages</p>
            </div>

            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', minHeight: '500px' }}>
                {COLUMNS.map((col, ci) => (
                    <div key={col.key} className={`card animate-in d-${ci + 1}`} style={{
                        minWidth: '265px', maxWidth: '265px',
                        padding: 0,
                        display: 'flex', flexDirection: 'column',
                        borderTop: `2px solid ${col.color}55`,
                    }}>
                        {/* Column Header */}
                        <div style={{ padding: '15px 17px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                                <div className="pulse-dot" style={{ width: '8px', height: '8px', background: col.color, color: col.color }} />
                                <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{col.key}</span>
                            </div>
                            <span className="badge" style={{ background: `${col.color}18`, color: col.color, borderColor: `${col.color}35`, fontSize: '11px' }}>
                                {grouped[col.key]?.length || 0}
                            </span>
                        </div>

                        {/* Cards */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                            {grouped[col.key]?.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '34px 10px', color: 'var(--text-secondary)', fontSize: '12px', opacity: 0.7 }}>
                                    No items
                                </div>
                            )}
                            {grouped[col.key]?.map(req => (
                                <div key={req.id} style={{
                                    background: 'rgba(255,255,255,0.035)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '11px', padding: '14px', marginBottom: '10px',
                                    transition: 'border-color 0.2s, transform 0.2s',
                                    cursor: 'default',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 700 }}>Asset #{req.asset_id}</span>
                                        <span className="badge" style={{
                                            fontSize: '10px', padding: '2px 8px', textTransform: 'capitalize',
                                            background: `${priorityColors[req.priority]}18`, color: priorityColors[req.priority],
                                            borderColor: `${priorityColors[req.priority]}35`,
                                        }}>{req.priority}</span>
                                    </div>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.5 }}>
                                        {req.issue_description}
                                    </p>
                                    
                                    {isManager && (
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            {req.status === 'Pending' && (
                                                <>
                                                    <button className="btn btn-soft-info" onClick={() => approveMutation.mutate(req.id)} style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: '8px' }}>Approve</button>
                                                    <button className="btn btn-soft-danger" onClick={() => rejectMutation.mutate(req.id)} style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: '8px' }}>Reject</button>
                                                </>
                                            )}
                                            {req.status === 'Approved' && (
                                                <button className="btn btn-soft-info" onClick={() => assignMutation.mutate(req.id)} style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: '8px' }}>Assign Technician</button>
                                            )}
                                            {req.status === 'Technician Assigned' && (
                                                <button className="btn btn-soft-info" onClick={() => startMutation.mutate(req.id)} style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: '8px' }}>Start Work</button>
                                            )}
                                            {req.status === 'In Progress' && (
                                                <button className="btn btn-soft-info" onClick={() => resolveMutation.mutate(req.id)} style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: '8px' }}>Resolve</button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
