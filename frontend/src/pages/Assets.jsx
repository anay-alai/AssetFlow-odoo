import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

const statusColors = {
    'Available': { bg: '#10b98120', color: '#10b981' },
    'Allocated': { bg: '#3b82f620', color: '#3b82f6' },
    'Under Maintenance': { bg: '#f59e0b20', color: '#f59e0b' },
    'Lost': { bg: '#ef444420', color: '#ef4444' },
    'Retired': { bg: '#6b728020', color: '#6b7280' },
    'Disposed': { bg: '#6b728020', color: '#6b7280' },
    'Reserved': { bg: '#8b5cf620', color: '#8b5cf6' },
};

export default function Assets() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const { data: assets, isLoading } = useQuery({
        queryKey: ['assets', search, statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.set('tag', search);
            if (statusFilter) params.set('status', statusFilter);
            return (await api.get(`/assets/search?${params}`)).data.data;
        },
        refetchOnWindowFocus: true,
    });

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>Assets Directory</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{assets?.length ?? 0} assets found</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Search by tag…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            padding: '8px 14px', background: 'var(--bg-card)',
                            border: '1px solid var(--border)', borderRadius: '8px',
                            color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
                        }}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        style={{
                            padding: '8px 14px', background: 'var(--bg-card)',
                            border: '1px solid var(--border)', borderRadius: '8px',
                            color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
                        }}
                    >
                        <option value="">All Status</option>
                        {Object.keys(statusColors).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {/* Asset Grid */}
            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>Loading assets…</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {assets?.map(asset => {
                        const s = statusColors[asset.status] || statusColors['Available'];
                        return (
                            <div key={asset.id} style={{
                                background: 'var(--bg-card)', border: '1px solid var(--border)',
                                borderRadius: '12px', padding: '20px', cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '3px' }}>{asset.name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--accent)', fontFamily: 'monospace' }}>{asset.asset_tag}</div>
                                    </div>
                                    <span style={{
                                        padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                                        background: s.bg, color: s.color, whiteSpace: 'nowrap',
                                    }}>{asset.status}</span>
                                </div>

                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    <div style={{ marginBottom: '4px' }}>📦 {asset.AssetCategory?.name || 'Uncategorized'}</div>
                                    {asset.serial_number && <div style={{ marginBottom: '4px' }}>🔢 {asset.serial_number}</div>}
                                    {asset.location && <div style={{ marginBottom: '4px' }}>📍 {asset.location}</div>}
                                    {asset.is_bookable && (
                                        <div style={{ marginTop: '10px' }}>
                                            <span style={{ background: '#6366f120', color: '#6366f1', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                                                Bookable
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {assets?.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>
                            No assets found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
