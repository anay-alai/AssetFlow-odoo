import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const COLUMNS = [
    { key: 'Pending', color: '#f59e0b', bg: '#f59e0b20' },
    { key: 'Approved', color: '#3b82f6', bg: '#3b82f620' },
    { key: 'Technician Assigned', color: '#8b5cf6', bg: '#8b5cf620' },
    { key: 'In Progress', color: '#6366f1', bg: '#6366f120' },
    { key: 'Resolved', color: '#10b981', bg: '#10b98120' },
];

const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

export default function Maintenance() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // For demo: fetch all maintenance requests using the search/filter on status
    // We'll do it with a single query and group client-side
    const { data: allRequests } = useQuery({
        queryKey: ['maintenance'],
        queryFn: async () => {
            // Fetch for each status — simplified: backend supports ?status= filter
            const statuses = ['Pending', 'Approved', 'Technician Assigned', 'In Progress', 'Resolved'];
            const results = await Promise.all(
                statuses.map(s => api.get('/maintenance-requests').catch(() => ({ data: { data: [] } })))
            );
            // Return all from first call (since backend returns all for now)
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

    const grouped = COLUMNS.reduce((acc, col) => {
        acc[col.key] = allRequests?.filter(r => r.status === col.key) || [];
        return acc;
    }, {});

    const isManager = ['admin', 'asset_manager'].includes(user?.role);

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>Maintenance Board</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Track and manage maintenance requests across all stages</p>
            </div>

            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', minHeight: '500px' }}>
                {COLUMNS.map(col => (
                    <div key={col.key} style={{
                        minWidth: '260px', maxWidth: '260px',
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: '12px', display: 'flex', flexDirection: 'column',
                    }}>
                        {/* Column Header */}
                        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{col.key}</span>
                            </div>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: col.bg, color: col.color, fontWeight: 600 }}>
                                {grouped[col.key]?.length || 0}
                            </span>
                        </div>

                        {/* Cards */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                            {grouped[col.key]?.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                                    No items
                                </div>
                            )}
                            {grouped[col.key]?.map(req => (
                                <div key={req.id} style={{
                                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                    borderRadius: '8px', padding: '14px', marginBottom: '10px',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Asset #{req.asset_id}</span>
                                        <span style={{
                                            fontSize: '10px', padding: '2px 7px', borderRadius: '20px', fontWeight: 600, textTransform: 'capitalize',
                                            background: `${priorityColors[req.priority]}20`, color: priorityColors[req.priority],
                                        }}>{req.priority}</span>
                                    </div>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.5 }}>
                                        {req.issue_description}
                                    </p>
                                    {isManager && req.status === 'Pending' && (
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button
                                                onClick={() => approveMutation.mutate(req.id)}
                                                style={{ flex: 1, padding: '6px', border: 'none', borderRadius: '6px', background: '#3b82f620', color: '#3b82f6', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                            >Approve</button>
                                            <button
                                                onClick={() => rejectMutation.mutate(req.id)}
                                                style={{ flex: 1, padding: '6px', border: 'none', borderRadius: '6px', background: '#ef444420', color: '#ef4444', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                            >Reject</button>
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
