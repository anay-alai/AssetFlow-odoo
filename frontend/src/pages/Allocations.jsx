import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, ArrowRightLeft, Send, Undo2, RefreshCw } from 'lucide-react';

export default function Allocations() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [assetId, setAssetId] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [conflictError, setConflictError] = useState(null);
    const [returnId, setReturnId] = useState('');
    const [returnNotes, setReturnNotes] = useState('');

    // Load assets and employees for selection dropdowns
    const { data: assets = [] } = useQuery({
        queryKey: ['assets-list'],
        queryFn: async () => (await api.get('/assets')).data.data,
    });

    const { data: empData } = useQuery({
        queryKey: ['employees'],
        queryFn: async () => (await api.get('/employees')).data,
    });
    const employees = empData?.data || [];

    // Load active allocations for the return panel
    const { data: activeAllocations = [] } = useQuery({
        queryKey: ['active-allocations'],
        queryFn: async () => {
            const res = await api.get('/assets');
            const all = res.data.data || [];
            // We don't have a direct allocations list endpoint; user can enter Allocation ID manually
            return all;
        },
    });

    const allocateMutation = useMutation({
        mutationFn: (data) => api.post('/allocations', data),
        onSuccess: () => {
            toast.success('Asset allocated successfully');
            setAssetId(''); setEmployeeId(''); setConflictError(null);
            queryClient.invalidateQueries(['assets-list']);
        },
        onError: (err) => {
            const e = err.response?.data?.error;
            if (e?.code === 'ALREADY_ALLOCATED') setConflictError({ ...e, ...e.details });
            else toast.error(e?.message || 'Allocation failed');
        },
    });

    const returnMutation = useMutation({
        mutationFn: ({ id, notes }) => api.post(`/allocations/${id}/return`, { return_condition_notes: notes }),
        onSuccess: () => {
            toast.success('Asset returned successfully');
            setReturnId(''); setReturnNotes('');
            queryClient.invalidateQueries(['assets-list']);
        },
        onError: (err) => toast.error(err.response?.data?.error?.message || 'Return failed'),
    });

    const transferMutation = useMutation({
        mutationFn: (data) => api.post('/allocations/transfer-requests', data),
        onSuccess: () => { toast.success('Transfer request submitted'); setConflictError(null); },
        onError: (err) => toast.error(err.response?.data?.error?.message || 'Transfer request failed'),
    });

    const availableAssets = assets.filter(a => a.status === 'Available');
    const allocatedAssets = assets.filter(a => a.status === 'Allocated');

    return (
        <div>
            <div className="animate-in" style={{ marginBottom: '28px' }}>
                <h1 className="page-title">Allocations</h1>
                <p className="page-sub">Assign and manage asset allocations across the organization</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* ── Allocate Asset ── */}
                <div className="card animate-in d-1">
                    <h2 className="section-title" style={{ marginBottom: '22px' }}>
                        <Send size={16} color="var(--accent)" /> Allocate Asset
                    </h2>

                    {conflictError && (
                        <div style={{
                            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)',
                            borderRadius: '10px', padding: '16px', marginBottom: '18px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <AlertTriangle size={16} color="var(--danger)" />
                                <span style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '13px' }}>Already Allocated</span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}>
                                Currently held by <strong style={{ color: 'var(--text-primary)' }}>
                                    {conflictError.currentHolder?.name || 'another user'}
                                </strong>
                            </p>
                            <button
                                className="btn btn-soft-danger"
                                style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                onClick={() => transferMutation.mutate({ asset_id: parseInt(assetId), to_user_id: parseInt(employeeId), reason: 'Reallocation request' })}
                            >
                                <ArrowRightLeft size={13} /> Request Transfer
                            </button>
                        </div>
                    )}

                    <form onSubmit={e => { e.preventDefault(); allocateMutation.mutate({ asset_id: parseInt(assetId), employee_id: parseInt(employeeId) }); }}>
                        <div style={{ marginBottom: '16px' }}>
                            <label className="label">Asset <span style={{ color: 'var(--accent)', fontSize: '11px' }}>({availableAssets.length} available)</span></label>
                            <select className="input" required value={assetId} onChange={e => { setAssetId(e.target.value); setConflictError(null); }}>
                                <option value="">Select an asset…</option>
                                <optgroup label="Available">
                                    {availableAssets.map(a => (
                                        <option key={a.id} value={a.id}>{a.name} — {a.asset_tag}</option>
                                    ))}
                                </optgroup>
                                {allocatedAssets.length > 0 && (
                                    <optgroup label="Allocated (transfer required)">
                                        {allocatedAssets.map(a => (
                                            <option key={a.id} value={a.id}>{a.name} — {a.asset_tag}</option>
                                        ))}
                                    </optgroup>
                                )}
                            </select>
                        </div>
                        <div style={{ marginBottom: '22px' }}>
                            <label className="label">Employee</label>
                            <select className="input" required value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
                                <option value="">Select an employee…</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={allocateMutation.isPending} style={{ width: '100%', padding: '11px' }}>
                            {allocateMutation.isPending ? 'Allocating…' : 'Allocate Asset'}
                        </button>
                    </form>
                </div>

                {/* ── Return Asset ── */}
                <div className="card animate-in d-2">
                    <h2 className="section-title" style={{ marginBottom: '22px' }}>
                        <Undo2 size={16} color="var(--success)" /> Return Asset
                    </h2>
                    <form onSubmit={e => { e.preventDefault(); returnMutation.mutate({ id: parseInt(returnId), notes: returnNotes }); }}>
                        <div style={{ marginBottom: '16px' }}>
                            <label className="label">Allocation ID</label>
                            <input
                                type="number"
                                className="input"
                                placeholder="Enter the Allocation ID to return"
                                value={returnId}
                                onChange={e => setReturnId(e.target.value)}
                                required
                                min="1"
                            />
                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px', opacity: 0.7 }}>
                                You can find the Allocation ID from the asset history.
                            </p>
                        </div>
                        <div style={{ marginBottom: '22px' }}>
                            <label className="label">Condition Notes</label>
                            <textarea className="input" value={returnNotes} onChange={e => setReturnNotes(e.target.value)} rows={3} placeholder="Note any damage or observations…" />
                        </div>
                        <button type="submit" className="btn btn-soft-success" disabled={returnMutation.isPending} style={{ width: '100%', padding: '11px' }}>
                            {returnMutation.isPending ? 'Processing…' : 'Return Asset'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Currently Allocated */}
            {allocatedAssets.length > 0 && (
                <div className="card animate-in d-3" style={{ marginTop: '24px' }}>
                    <h2 className="section-title" style={{ marginBottom: '18px' }}>
                        <RefreshCw size={16} color="var(--warning)" /> Currently Allocated Assets
                    </h2>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Asset</th>
                                    <th>Tag</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allocatedAssets.map(a => (
                                    <tr key={a.id}>
                                        <td style={{ fontWeight: 600 }}>{a.name}</td>
                                        <td className="mono" style={{ color: 'var(--accent)', fontSize: '12px' }}>{a.asset_tag}</td>
                                        <td>{a.AssetCategory?.name || '—'}</td>
                                        <td>
                                            <span className="badge" style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa', borderColor: 'rgba(96,165,250,0.3)' }}>
                                                Allocated
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
