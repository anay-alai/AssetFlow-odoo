import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../api/client';
import { toast } from 'react-hot-toast';
import { AlertTriangle, ArrowRightLeft, Send, Undo2 } from 'lucide-react';

export default function Allocations() {
    const [assetId, setAssetId] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [conflictError, setConflictError] = useState(null);
    const [returnId, setReturnId] = useState('');
    const [notes, setNotes] = useState('');

    const allocateMutation = useMutation({
        mutationFn: async (data) => api.post('/allocations', data),
        onSuccess: () => { toast.success('Asset allocated successfully'); setAssetId(''); setEmployeeId(''); setConflictError(null); },
        onError: (err) => {
            const e = err.response?.data?.error;
            if (e?.code === 'ALREADY_ALLOCATED') setConflictError(e);
            else toast.error(e?.message || 'Allocation failed');
        }
    });

    const returnMutation = useMutation({
        mutationFn: async ({ id, notes }) => api.post(`/allocations/${id}/return`, { return_condition_notes: notes }),
        onSuccess: () => { toast.success('Asset returned'); setReturnId(''); setNotes(''); },
        onError: () => toast.error('Return failed')
    });

    const transferMutation = useMutation({
        mutationFn: async (data) => api.post('/allocations/transfer-requests', data),
        onSuccess: () => { toast.success('Transfer request submitted'); setConflictError(null); },
        onError: () => toast.error('Transfer request failed')
    });

    return (
        <div>
            <div className="animate-in" style={{ marginBottom: '28px' }}>
                <h1 className="page-title">Allocations</h1>
                <p className="page-sub">Assign and manage asset allocations</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Allocate */}
                <div className="card animate-in d-1">
                    <h2 className="section-title" style={{ marginBottom: '22px' }}>
                        <Send size={16} color="var(--accent)" /> Allocate Asset
                    </h2>

                    {conflictError && (
                        <div className="alert-danger animate-in" style={{ padding: '16px', marginBottom: '18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <AlertTriangle size={16} color="var(--danger)" />
                                <span style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '13px' }}>Already Allocated</span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}>
                                Currently held by <strong style={{ color: 'var(--text-primary)' }}>{conflictError.currentHolder?.name || 'another user'}</strong>
                            </p>
                            <button
                                className="btn btn-soft-danger"
                                style={{ padding: '8px 14px', fontSize: '12px' }}
                                onClick={() => transferMutation.mutate({ asset_id: assetId, to_user_id: employeeId, reason: 'Reallocation request' })}
                            >
                                <ArrowRightLeft size={13} /> Request Transfer
                            </button>
                        </div>
                    )}

                    <form onSubmit={e => { e.preventDefault(); allocateMutation.mutate({ asset_id: assetId, employee_id: employeeId }); }}>
                        <div style={{ marginBottom: '16px' }}>
                            <label className="label">Asset ID</label>
                            <input type="number" className="input" value={assetId} onChange={e => setAssetId(e.target.value)} required />
                        </div>
                        <div style={{ marginBottom: '22px' }}>
                            <label className="label">Employee ID</label>
                            <input type="number" className="input" value={employeeId} onChange={e => setEmployeeId(e.target.value)} required />
                        </div>
                        <button type="submit" className="btn btn-primary">Allocate Asset</button>
                    </form>
                </div>

                {/* Return */}
                <div className="card animate-in d-2">
                    <h2 className="section-title" style={{ marginBottom: '22px' }}>
                        <Undo2 size={16} color="var(--success)" /> Return Asset
                    </h2>
                    <form onSubmit={e => { e.preventDefault(); returnMutation.mutate({ id: returnId, notes }); }}>
                        <div style={{ marginBottom: '16px' }}>
                            <label className="label">Allocation ID</label>
                            <input type="number" className="input" value={returnId} onChange={e => setReturnId(e.target.value)} required />
                        </div>
                        <div style={{ marginBottom: '22px' }}>
                            <label className="label">Condition Notes</label>
                            <textarea className="input" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
                        </div>
                        <button type="submit" className="btn btn-soft-success">Return Asset</button>
                    </form>
                </div>
            </div>
        </div>
    );
}
