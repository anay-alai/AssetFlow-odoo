import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Box, CheckCircle, Wrench, Layers, TrendingUp, AlertTriangle, Clock } from 'lucide-react';

const KpiCard = ({ label, value, icon: Icon, color, subtext }) => (
    <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.2s',
    }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
        <div style={{
            position: 'absolute', top: 0, right: 0,
            width: '80px', height: '80px',
            background: `${color}15`,
            borderRadius: '0 12px 0 80px',
        }} />
        <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: `${color}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '16px',
        }}>
            <Icon size={20} color={color} />
        </div>
        <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value ?? '—'}</div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>{label}</div>
        {subtext && <div style={{ fontSize: '11px', color: color, marginTop: '4px' }}>{subtext}</div>}
    </div>
);

export default function Dashboard() {
    const { user } = useAuth();

    const { data: kpis, isLoading } = useQuery({
        queryKey: ['kpis'],
        queryFn: async () => (await api.get('/dashboard/kpis')).data.data,
        refetchInterval: 30000,
        refetchOnWindowFocus: true,
    });

    const { data: overdueData } = useQuery({
        queryKey: ['overdue'],
        queryFn: async () => (await api.get('/dashboard/overdue')).data.data,
        refetchInterval: 60000,
    });

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Dashboard
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    Welcome back, <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{user?.name}</span>
                    {' '}&mdash; {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                <KpiCard label="Total Assets" value={isLoading ? '...' : kpis?.totalAssets} icon={Layers} color="#6366f1" />
                <KpiCard label="Available" value={isLoading ? '...' : kpis?.availableAssets} icon={CheckCircle} color="#10b981" subtext="Ready to allocate" />
                <KpiCard label="Allocated" value={isLoading ? '...' : kpis?.allocatedAssets} icon={Box} color="#3b82f6" subtext="Currently in use" />
                <KpiCard label="Under Maintenance" value={isLoading ? '...' : kpis?.maintenanceAssets} icon={Wrench} color="#f59e0b" subtext="Being serviced" />
            </div>

            {/* Overdue Alerts */}
            {overdueData?.length > 0 && (
                <div style={{
                    background: '#ef444415',
                    border: '1px solid #ef444440',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '32px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <AlertTriangle size={18} color="#ef4444" />
                        <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#ef4444' }}>
                            Overdue Returns ({overdueData.length})
                        </h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {overdueData.slice(0, 5).map(alloc => (
                            <div key={alloc.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '12px 16px',
                                background: 'var(--bg-secondary)',
                                borderRadius: '8px',
                                fontSize: '13px',
                            }}>
                                <div>
                                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                        {alloc.Asset?.name || `Asset #${alloc.asset_id}`}
                                    </span>
                                    <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>
                                        — {alloc.Employee?.name || 'Unknown'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444' }}>
                                    <Clock size={13} />
                                    <span>Due: {new Date(alloc.expected_return_date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                    <TrendingUp size={18} color="var(--accent)" />
                    <h2 style={{ fontSize: '15px', fontWeight: 600 }}>Asset Utilization</h2>
                </div>
                {kpis && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { label: 'Allocated', value: kpis.allocatedAssets, total: kpis.totalAssets, color: '#3b82f6' },
                            { label: 'Available', value: kpis.availableAssets, total: kpis.totalAssets, color: '#10b981' },
                            { label: 'Under Maintenance', value: kpis.maintenanceAssets, total: kpis.totalAssets, color: '#f59e0b' },
                        ].map(({ label, value, total, color }) => {
                            const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                            return (
                                <div key={label}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>({pct}%)</span></span>
                                    </div>
                                    <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.8s ease' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}