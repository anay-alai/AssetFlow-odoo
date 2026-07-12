import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { toast } from 'react-hot-toast';
import { AlertCircle, Clock, CalendarPlus } from 'lucide-react';

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

    return (
        <div>
            <div className="animate-in" style={{ marginBottom: '28px' }}>
                <h1 className="page-title">Resource Booking</h1>
                <p className="page-sub">Book shared resources and equipment</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '20px' }}>
                {/* Form */}
                <div className="card animate-in d-1">
                    <h2 className="section-title" style={{ marginBottom: '22px' }}>
                        <CalendarPlus size={16} color="var(--accent)" /> New Booking
                    </h2>

                    {overlapError && (
                        <div className="alert-danger animate-in" style={{ padding: '14px', marginBottom: '18px', display: 'flex', gap: '10px' }}>
                            <AlertCircle size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: '1px' }} />
                            <div>
                                <div style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>Time Conflict</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>This resource is already booked during the selected time slot.</div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={e => { e.preventDefault(); bookMutation.mutate({ resource_asset_id: resourceId, start_time: startTime, end_time: endTime, purpose }); }}>
                        <div style={{ marginBottom: '16px' }}>
                            <label className="label">Resource</label>
                            <select className="input" value={resourceId} onChange={e => setResourceId(e.target.value)} required>
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
                        <div style={{ marginBottom: '16px' }}>
                            <label className="label">Purpose</label>
                            <input type="text" className="input" value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="e.g. Team standup" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '22px' }}>
                            {[['Start Time', startTime, setStartTime], ['End Time', endTime, setEndTime]].map(([label, val, set]) => (
                                <div key={label} style={{ minWidth: 0 }}>
                                    <label className="label">{label}</label>
                                    <input type="datetime-local" className="input" value={val} onChange={e => set(e.target.value)} required style={{ minWidth: 0 }} />
                                </div>
                            ))}
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>Book Resource</button>
                    </form>
                </div>

                {/* Info */}
                <div className="card animate-in d-2">
                    <h2 className="section-title" style={{ marginBottom: '18px' }}>
                        <Clock size={16} color="var(--accent)" />
                        Booking Rules
                    </h2>
                    {[
                        ['✅', 'Back-to-back allowed', 'A booking starting exactly when another ends is valid (e.g. 9:00–10:00 then 10:00–11:00).'],
                        ['⛔', 'Overlap is blocked', 'Overlapping slots are rejected (e.g. 9:00–10:00 vs 9:30–10:30 → conflict).'],
                        ['⚡', 'Bookable assets only', 'Only assets marked as "Bookable" can be reserved here.'],
                    ].map(([emoji, title, desc]) => (
                        <div key={title} style={{
                            display: 'flex', gap: '12px',
                            padding: '15px', background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px', marginBottom: '10px',
                        }}>
                            <span style={{ fontSize: '16px' }}>{emoji}</span>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{title}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
