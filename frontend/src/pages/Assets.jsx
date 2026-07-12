import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Package, Hash, MapPin, Search, Plus, X, QrCode, History as HistoryIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

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
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [selected, setSelected] = useState(null);

    // Detail: merged history + QR (only fetched when a card is opened)
    const { data: history } = useQuery({
        queryKey: ['asset-history', selected?.id],
        queryFn: async () => (await api.get(`/assets/${selected.id}/history`)).data.data,
        enabled: !!selected,
    });
    const { data: qr } = useQuery({
        queryKey: ['asset-qr', selected?.id],
        queryFn: async () => (await api.get(`/assets/${selected.id}/qr`)).data.data,
        enabled: !!selected,
    });

    // Form state
    const [formData, setFormData] = useState({
        name: '', category_id: '', serial_number: '', acquisition_date: '',
        acquisition_cost: '', condition: 'New', location: '', is_bookable: false
    });

    const isManager = ['admin', 'asset_manager'].includes(user?.role);

    const { data: assets, isLoading } = useQuery({
        queryKey: ['assets', search, statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.set('q', search);
            if (statusFilter) params.set('status', statusFilter);
            return (await api.get(`/assets/search?${params}`)).data.data;
        },
        refetchOnWindowFocus: true,
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => (await api.get('/categories')).data.data,
        enabled: isRegistering
    });

    const registerMutation = useMutation({
        mutationFn: async (data) => api.post('/assets', data),
        onSuccess: () => {
            toast.success('Asset registered successfully');
            setIsRegistering(false);
            setFormData({ name: '', category_id: '', serial_number: '', acquisition_date: '', acquisition_cost: '', condition: 'New', location: '', is_bookable: false });
            queryClient.invalidateQueries(['assets']);
        },
        onError: (err) => toast.error(err.response?.data?.error?.message || 'Registration failed')
    });

    const handleRegister = (e) => {
        e.preventDefault();
        registerMutation.mutate(formData);
    };

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
                            placeholder="Search by tag or name…"
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
                    {isManager && (
                        <button className="btn btn-primary" onClick={() => setIsRegistering(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Plus size={16} /> Register Asset
                        </button>
                    )}
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
                            <div key={asset.id} onClick={() => setSelected(asset)} className={`card card-hover animate-in d-${Math.min(i % 6 + 1, 6)}`} style={{ padding: '22px', cursor: 'pointer' }}>
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

            {/* Asset Detail Drawer */}
            {selected && (
                <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '560px', maxHeight: '88vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                            <div>
                                <h2 className="section-title" style={{ marginBottom: '2px' }}>{selected.name}</h2>
                                <span className="mono" style={{ fontSize: '12px', color: 'var(--accent)' }}>{selected.asset_tag}</span>
                            </div>
                            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '18px', marginBottom: '22px' }}>
                            {/* QR */}
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ background: '#fff', borderRadius: '10px', padding: '8px' }}>
                                    {qr?.qr ? <img src={qr.qr} alt="QR" style={{ width: '100%', display: 'block' }} /> : <div className="skeleton" style={{ height: '124px' }} />}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                                    <QrCode size={12} /> Scan tag
                                </div>
                            </div>
                            {/* Facts */}
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div><strong style={{ color: 'var(--text-primary)' }}>Status:</strong> {selected.status}</div>
                                <div><strong style={{ color: 'var(--text-primary)' }}>Category:</strong> {selected.AssetCategory?.name || '—'}</div>
                                <div><strong style={{ color: 'var(--text-primary)' }}>Serial:</strong> <span className="mono">{selected.serial_number || '—'}</span></div>
                                <div><strong style={{ color: 'var(--text-primary)' }}>Location:</strong> {selected.location || '—'}</div>
                                <div><strong style={{ color: 'var(--text-primary)' }}>Acquired:</strong> {selected.acquisition_date || '—'}{selected.acquisition_cost ? ` · $${selected.acquisition_cost}` : ''}</div>
                                {selected.is_bookable && <span className="badge" style={{ background: 'rgba(129,140,248,0.14)', color: 'var(--accent)', width: 'fit-content' }}>⚡ Bookable</span>}
                            </div>
                        </div>

                        {/* Merged history */}
                        <h3 className="section-title" style={{ fontSize: '13px', marginBottom: '12px' }}><HistoryIcon size={15} color="var(--accent)" /> History</h3>
                        {history?.length ? (
                            <div style={{ position: 'relative', paddingLeft: '14px', borderLeft: '2px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {history.map((ev, i) => (
                                    <div key={i} style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '-20px', top: '3px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }} />
                                        <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{ev.description}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{ev.date ? new Date(ev.date).toLocaleString() : ''}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No allocation or maintenance history yet.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Registration Modal */}
            {isRegistering && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 className="section-title">Register New Asset</h2>
                            <button onClick={() => setIsRegistering(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label className="label">Name</label>
                                <input type="text" className="input" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="label">Category</label>
                                <select className="input" required value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })}>
                                    <option value="">Select Category</option>
                                    {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label className="label">Serial Number</label>
                                    <input type="text" className="input" value={formData.serial_number} onChange={e => setFormData({ ...formData, serial_number: e.target.value })} />
                                </div>
                                <div>
                                    <label className="label">Condition</label>
                                    <select className="input" value={formData.condition} onChange={e => setFormData({ ...formData, condition: e.target.value })}>
                                        <option value="New">New</option>
                                        <option value="Good">Good</option>
                                        <option value="Fair">Fair</option>
                                        <option value="Poor">Poor</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label className="label">Acquisition Date</label>
                                    <input type="date" className="input" value={formData.acquisition_date} onChange={e => setFormData({ ...formData, acquisition_date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="label">Cost ($)</label>
                                    <input type="number" step="0.01" className="input" value={formData.acquisition_cost} onChange={e => setFormData({ ...formData, acquisition_cost: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="label">Location</label>
                                <input type="text" className="input" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input type="checkbox" id="is_bookable" checked={formData.is_bookable} onChange={e => setFormData({ ...formData, is_bookable: e.target.checked })} />
                                <label htmlFor="is_bookable" style={{ fontSize: '13px' }}>Shared / Bookable Resource</label>
                            </div>
                            
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '10px', padding: '12px' }} disabled={registerMutation.isPending}>
                                {registerMutation.isPending ? 'Registering...' : 'Register Asset'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
