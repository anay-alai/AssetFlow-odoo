import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../api/client';
import { toast } from 'react-hot-toast';
import { AlertTriangle, ArrowRightLeft } from 'lucide-react';

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

    const inputStyle = {
        width: '100%', padding: '9px 12px', background: 'var(--bg-primary)',
        border: '1px solid var(--border)', borderRadius: '8px',
        color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    };
    const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' };
    const btnStyle = {
        padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer',
        fontSize: '13px', fontWeight: 600, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white',
    };

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>Allocations</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Assign and manage asset allocations</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Allocate */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Allocate Asset</h2>

                    {conflictError && (
                        <div style={{ background: '#ef444415', border: '1px solid #ef444440', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <AlertTriangle size={16} color="#ef4444" />
                                <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '13px' }}>Already Allocated</span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}>
                                Currently held by <strong style={{ color: 'var(--text-primary)' }}>{conflictError.currentHolder?.name || 'another user'}</strong>
                            </p>
                            <button
                                onClick={() => transferMutation.mutate({ asset_id: assetId, to_user_id: employeeId, reason: 'Reallocation request' })}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#ef444420', border: '1px solid #ef444440', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                            >
                                <ArrowRightLeft size={13} /> Request Transfer
                            </button>
                        </div>
                    )}

                    <form onSubmit={e => { e.preventDefault(); allocateMutation.mutate({ asset_id: assetId, employee_id: employeeId }); }}>
                        <div style={{ marginBottom: '14px' }}>
                            <label style={labelStyle}>Asset ID</label>
                            <input type="number" value={assetId} onChange={e => setAssetId(e.target.value)} required style={inputStyle}
                                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={labelStyle}>Employee ID</label>
                            <input type="number" value={employeeId} onChange={e => setEmployeeId(e.target.value)} required style={inputStyle}
                                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                        </div>
                        <button type="submit" style={btnStyle}>Allocate Asset</button>
                    </form>
                </div>

                {/* Return */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Return Asset</h2>
                    <form onSubmit={e => { e.preventDefault(); returnMutation.mutate({ id: returnId, notes }); }}>
                        <div style={{ marginBottom: '14px' }}>
                            <label style={labelStyle}>Allocation ID</label>
                            <input type="number" value={returnId} onChange={e => setReturnId(e.target.value)} required style={inputStyle}
                                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={labelStyle}>Condition Notes</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                                style={{ ...inputStyle, resize: 'vertical' }}
                                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                        </div>
                        <button type="submit" style={{ ...btnStyle, background: '#10b98120', color: '#10b981', border: '1px solid #10b98140' }}>Return Asset</button>
                    </form>
                </div>
            </div>
        </div>
    );
}
