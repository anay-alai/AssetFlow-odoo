import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { Package, Hash, MapPin, Search } from 'lucide-react';

const statusColors = {
    'Available': '#34d399',
    'Allocated': '#60a5fa',
    'Under Maintenance': '#fbbf24',
    'Lost': '#f87171',
    'Retired': '#9ca3af',
    'Disposed': '#9ca3af',
    'Reserved': '#a78bfa',
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
            <div className="animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 className="page-title">Assets Directory</h1>
                    <p className="page-sub">{assets?.length ?? 0} assets found</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} color="var(--text-secondary)" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                        <input
                            type="text"
                            className="input"
                            placeholder="Search by tag…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ width: '220px', paddingLeft: '36px', fontSize: '13px' }}
                        />
                    </div>
                    <select
                        className="input"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        style={{ width: 'auto', fontSize: '13px' }}
                    >
                        <option value="">All Status</option>
                        {Object.keys(statusColors).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {/* Asset Grid */}
            {isLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: '160px' }} />)}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {assets?.map((asset, i) => {
                        const color = statusColors[asset.status] || statusColors['Available'];
                        return (
                            <div key={asset.id} className={`card card-hover animate-in d-${Math.min(i % 6 + 1, 6)}`} style={{ padding: '22px', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>{asset.name}</div>
                                        <div className="mono" style={{ fontSize: '12px', color: 'var(--accent)' }}>{asset.asset_tag}</div>
                                    </div>
                                    <span className="badge" style={{ background: `${color}18`, color, borderColor: `${color}35` }}>
                                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: color, display: 'inline-block' }} />
                                        {asset.status}
                                    </span>
                                </div>

                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                        <Package size={13} style={{ opacity: 0.7 }} /> {asset.AssetCategory?.name || 'Uncategorized'}
                                    </div>
                                    {asset.serial_number && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                            <Hash size={13} style={{ opacity: 0.7 }} /> <span className="mono" style={{ fontSize: '12px' }}>{asset.serial_number}</span>
                                        </div>
                                    )}
                                    {asset.location && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                            <MapPin size={13} style={{ opacity: 0.7 }} /> {asset.location}
                                        </div>
                                    )}
                                    {asset.is_bookable && (
                                        <div style={{ marginTop: '8px' }}>
                                            <span className="badge" style={{ background: 'rgba(129,140,248,0.14)', color: 'var(--accent)', borderColor: 'rgba(129,140,248,0.3)' }}>
                                                ⚡ Bookable
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {assets?.length === 0 && (
                        <div className="empty-state card" style={{ gridColumn: '1/-1' }}>
                            No assets found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
