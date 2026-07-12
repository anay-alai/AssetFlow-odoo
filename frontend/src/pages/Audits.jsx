import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { toast } from 'react-hot-toast';
import { FileCheck, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Audits() {
    const queryClient = useQueryClient();
    const [cycleId, setCycleId] = useState('');
    const [assetId, setAssetId] = useState('');
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState('Present');

    // Fetch active audit cycles (we'll just use a mock query or fetch all)
    const { data: cycles } = useQuery({
        queryKey: ['audit-cycles'],
        queryFn: async () => (await api.get('/audits/cycles')).data.data,
    });

    const verifyMutation = useMutation({
        mutationFn: async (data) => api.put(`/audits/items/${data.item_id}/verify`, data),
        onSuccess: () => { toast.success('Item verified'); setAssetId(''); setNotes(''); },
        onError: () => toast.error('Verification failed'),
    });

    const closeMutation = useMutation({
        mutationFn: async (id) => api.put(`/audits/${id}/close`),
        onSuccess: () => { toast.success('Audit cycle closed'); queryClient.invalidateQueries(['audit-cycles']); },
        onError: () => toast.error('Closure failed'),
    });

    const inputStyle = {
        width: '100%', padding: '9px 12px', background: 'var(--bg-primary)',
        border: '1px solid var(--border)', borderRadius: '8px',
        color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    };

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>Audits</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Verify asset presence and manage audit cycles</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Verify Item */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileCheck size={16} color="var(--accent)" /> Verify Asset
                    </h2>
                    
                    <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Audit Cycle ID</label>
                        <select value={cycleId} onChange={e => setCycleId(e.target.value)} style={inputStyle}>
                            <option value="">Select an active cycle...</option>
                            {cycles?.filter(c => c.status === 'Open').map(c => (
                                <option key={c.id} value={c.id}>Cycle #{c.id} (Started: {c.start_date})</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Asset ID (or Tag)</label>
                        <input type="text" value={assetId} onChange={e => setAssetId(e.target.value)} required style={inputStyle} />
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Status</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {['Present', 'Missing'].map(s => (
                                <button key={s} onClick={() => setStatus(s)} style={{
                                    flex: 1, padding: '8px', border: `1px solid ${status === s ? 'var(--accent)' : 'var(--border)'}`,
                                    background: status === s ? 'var(--accent-hover)' : 'var(--bg-primary)',
                                    color: status === s ? 'white' : 'var(--text-primary)',
                                    borderRadius: '6px', fontSize: '13px', cursor: 'pointer',
                                }}>{s}</button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Notes</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={inputStyle} />
                    </div>

                    <button
                        onClick={() => verifyMutation.mutate({ item_id: assetId, status, notes })}
                        disabled={!cycleId || !assetId}
                        style={{
                            width: '100%', padding: '11px', border: 'none', borderRadius: '8px',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white',
                            fontSize: '14px', fontWeight: 600, cursor: (!cycleId || !assetId) ? 'not-allowed' : 'pointer',
                            opacity: (!cycleId || !assetId) ? 0.5 : 1
                        }}>
                        Record Verification
                    </button>
                </div>

                {/* Audit Cycles List */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Active Cycles</h2>
                    
                    {cycles?.map(c => (
                        <div key={c.id} style={{
                            padding: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                            borderRadius: '8px', marginBottom: '12px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontWeight: 600, fontSize: '14px' }}>Cycle #{c.id}</span>
                                <span style={{
                                    padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                                    background: c.status === 'Open' ? '#10b98120' : '#6b728020',
                                    color: c.status === 'Open' ? '#10b981' : '#6b7280'
                                }}>{c.status}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                Started: {c.start_date} <br/>
                                Ends: {c.end_date}
                            </div>
                            
                            {c.status === 'Open' && (
                                <button
                                    onClick={() => {
                                        if (confirm('Are you sure? This will mark all unverified items as Lost.')) {
                                            closeMutation.mutate(c.id);
                                        }
                                    }}
                                    style={{
                                        width: '100%', padding: '8px', border: '1px solid #ef444440', borderRadius: '6px',
                                        background: '#ef444420', color: '#ef4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                                    }}>
                                    Close Cycle
                                </button>
                            )}
                        </div>
                    ))}
                    {cycles?.length === 0 && <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No audit cycles found.</div>}
                </div>
            </div>
        </div>
    );
}
