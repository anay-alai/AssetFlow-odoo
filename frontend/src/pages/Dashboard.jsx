import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Box, CheckCircle, Wrench, Layers, TrendingUp, AlertTriangle, Clock, Calendar, ArrowLeftRight, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

const KpiCard = ({ label, value, icon: Icon, color, subtext, delay }) => (
    <div className={`card card-hover animate-in d-${delay}`} style={{ overflow: 'hidden' }}>
        <div style={{
            position: 'absolute', top: '-30px', right: '-30px',
            width: '110px', height: '110px', borderRadius: '50%',
            background: `radial-gradient(circle, ${color}22, transparent 70%)`,
            pointerEvents: 'none',
        }} />
        <div className="icon-tile" style={{
            width: '42px', height: '42px',
            background: `${color}1c`,
            border: `1px solid ${color}30`,
            marginBottom: '16px',
            boxShadow: `0 4px 18px ${color}20`,
        }}>
            <Icon size={19} color={color} />
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '34px', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em' }}>{value ?? '—'}</div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', fontWeight: 500 }}>{label}</div>
        {subtext && <div style={{ fontSize: '11px', color, marginTop: '4px', fontWeight: 600 }}>{subtext}</div>}
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
            <div className="animate-in" style={{ marginBottom: '32px' }}>
                <h1 className="page-title">Dashboard</h1>
                <p className="page-sub">
                    Welcome back, <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{user?.name}</span>
                    {' '}&mdash; {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                <KpiCard delay={1} label="Assets Available" value={isLoading ? '…' : kpis?.assetsAvailable} icon={CheckCircle} color="#34d399" subtext="Ready to allocate" />
                <KpiCard delay={2} label="Assets Allocated" value={isLoading ? '…' : kpis?.assetsAllocated} icon={Box} color="#60a5fa" subtext="Currently in use" />
                <KpiCard delay={3} label="Maintenance Today" value={isLoading ? '…' : kpis?.maintenanceToday} icon={Wrench} color="#fbbf24" subtext="Active work orders" />
                <KpiCard delay={4} label="Active Bookings" value={isLoading ? '…' : kpis?.activeBookings} icon={Calendar} color="#818cf8" subtext="Upcoming & ongoing" />
                <KpiCard delay={5} label="Pending Transfers" value={isLoading ? '…' : kpis?.pendingTransfers} icon={ArrowLeftRight} color="#c084fc" subtext="Awaiting approval" />
                <KpiCard delay={6} label="Upcoming Returns" value={isLoading ? '…' : kpis?.upcomingReturns} icon={RotateCcw} color="#f472b6" subtext="Due in 7 days" />
            </div>

            {/* Quick Actions */}
            <div className="animate-in d-3" style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
                {[
                    { label: 'Register Asset', to: '/assets', icon: Layers, color: '#818cf8' },
                    { label: 'Book Resource', to: '/bookings', icon: Calendar, color: '#34d399' },
                    { label: 'Raise Maintenance', to: '/maintenance', icon: Wrench, color: '#fbbf24' },
                ].map(({ label, to, icon: Icon, color }) => (
                    <Link key={label} to={to} className="btn btn-ghost" style={{ padding: '12px 20px' }}>
                        <Icon size={16} color={color} /> {label}
                    </Link>
                ))}
            </div>

            {/* Overdue Alerts */}
            {overdueData?.length > 0 && (
                <div className="alert-danger animate-in d-4" style={{ padding: '22px', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '16px' }}>
                        <AlertTriangle size={18} color="var(--danger)" />
                        <h2 className="section-title" style={{ color: 'var(--danger)' }}>
                            Overdue Returns ({overdueData.length})
                        </h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {overdueData.slice(0, 5).map(alloc => (
                            <div key={alloc.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '13px 16px',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '10px',
                                fontSize: '13px',
                            }}>
                                <div>
                                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                                        {alloc.Asset?.name || `Asset #${alloc.asset_id}`}
                                    </span>
                                    <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>
                                        — {alloc.Employee?.name || 'Unknown'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', fontWeight: 600 }}>
                                    <Clock size={13} />
                                    <span>Due: {new Date(alloc.expected_return_date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div className="card animate-in d-5">
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '22px' }}>
                    <TrendingUp size={18} color="var(--accent)" />
                    <h2 className="section-title">Asset Utilization</h2>
                </div>
                {kpis && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                            { label: 'Allocated', value: kpis.assetsAllocated, total: kpis.totalAssets, color: '#60a5fa' },
                            { label: 'Available', value: kpis.assetsAvailable, total: kpis.totalAssets, color: '#34d399' },
                            { label: 'Under Maintenance', value: kpis.assetsUnderMaintenance, total: kpis.totalAssets, color: '#fbbf24' },
                        ].map(({ label, value, total, color }) => {
                            const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                            return (
                                <div key={label}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '7px' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
                                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{value} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>({pct}%)</span></span>
                                    </div>
                                    <div className="progress-track">
                                        <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}cc, ${color})`, color }} />
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
