import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { toast } from 'react-hot-toast';
import { AlertCircle, Clock } from 'lucide-react';

const statusColors = {
    'Upcoming': { bg: '#6366f120', color: '#6366f1' },
    'Ongoing': { bg: '#10b98120', color: '#10b981' },
    'Completed': { bg: '#6b728020', color: '#6b7280' },
    'Cancelled': { bg: '#ef444420', color: '#ef4444' },
};

export default function Bookings() {
    const [resourceId, setResourceId] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [purpose, setPurpose] = useState('');
    const [overlapError, setOverlapError] = useState(null);

    const { data: bookableAssets = [] } = useQuery({
        queryKey: ['bookable-assets'],
        queryFn: async () => {
            const res = await api.get('/assets', { params: { limit: 200 } });
            return (res.data.data || []).filter((a) => a.is_bookable);
        },
    });

    const bookMutation = useMutation({
        mutationFn: async (data) => api.post('/bookings', data),
        onSuccess: () => { toast.success('Resource booked!'); setResourceId(''); setStartTime(''); setEndTime(''); setPurpose(''); setOverlapError(null); },
        onError: (err) => {
            const e = err.response?.data?.error;
            if (e?.code === 'BOOKING_OVERLAP') setOverlapError(e);
            else toast.error(e?.message || 'Booking failed');
        }
    });

    const inputStyle = {
        width: '100%', padding: '9px 12px', background: 'var(--bg-primary)',
        border: '1px solid var(--border)', borderRadius: '8px',
        color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    };

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>Resource Booking</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Book shared resources and equipment</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '20px' }}>
                {/* Form */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>New Booking</h2>

                    {overlapError && (
                        <div style={{ background: '#ef444415', border: '1px solid #ef444440', borderRadius: '8px', padding: '14px', marginBottom: '16px', display: 'flex', gap: '10px' }}>
                            <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />
                            <div>
                                <div style={{ color: '#ef4444', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>Time Conflict</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>This resource is already booked during the selected time slot.</div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={e => { e.preventDefault(); bookMutation.mutate({ resource_asset_id: resourceId, start_time: startTime, end_time: endTime, purpose }); }}>
                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Resource</label>
                            <select value={resourceId} onChange={e => setResourceId(e.target.value)} required style={inputStyle}
                                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                                onBlur={e => e.target.style.borderColor = 'var(--border)'}>
                                <option value="" disabled>
                                    {bookableAssets.length ? 'Select a bookable resource…' : 'No bookable assets found'}
                                </option>
                                {bookableAssets.map(a => (
                                    <option key={a.id} value={a.id}>
                                        {a.asset_tag} — {a.name}{a.location ? ` (${a.location})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Purpose</label>
                            <input type="text" value={purpose} onChange={e => setPurpose(e.target.value)} style={inputStyle}
                                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                            {[['Start Time', startTime, setStartTime], ['End Time', endTime, setEndTime]].map(([label, val, set]) => (
                                <div key={label} style={{ minWidth: 0 }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>{label}</label>
                                    <input type="datetime-local" value={val} onChange={e => set(e.target.value)} required
                                        style={{ ...inputStyle, minWidth: 0 }}
                                        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                                        onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                                </div>
                            ))}
                        </div>
                        <button type="submit" style={{
                            width: '100%', padding: '11px', border: 'none', borderRadius: '8px',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white',
                            fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                        }}>Book Resource</button>
                    </form>
                </div>

                {/* Info */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={16} color="var(--accent)" />
                        Booking Rules
                    </h2>
                    {[
                        ['Back-to-back allowed', 'A booking starting exactly when another ends is valid (e.g. 9:00–10:00 then 10:00–11:00).'],
                        ['Overlap is blocked', 'Overlapping slots are rejected (e.g. 9:00–10:00 vs 9:30–10:30 → conflict).'],
                        ['Bookable assets only', 'Only assets marked as "Bookable" can be reserved here.'],
                    ].map(([title, desc]) => (
                        <div key={title} style={{ padding: '14px', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '10px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{title}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
