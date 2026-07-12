import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { TrendingUp, Wrench } from 'lucide-react';

export default function Reports() {
    const { data: utilization } = useQuery({
        queryKey: ['reports', 'utilization'],
        queryFn: async () => (await api.get('/reports/utilization')).data.data,
    });

    const { data: maintenance } = useQuery({
        queryKey: ['reports', 'maintenance-frequency'],
        queryFn: async () => (await api.get('/reports/maintenance-frequency')).data.data,
    });

    return (
        <div>
            <div className="animate-in" style={{ marginBottom: '28px' }}>
                <h1 className="page-title">Reports &amp; Analytics</h1>
                <p className="page-sub">Asset utilization and maintenance metrics</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Utilization Report */}
                <div className="card animate-in d-1">
                    <h2 className="section-title" style={{ marginBottom: '22px' }}>
                        <TrendingUp size={16} color="var(--accent)" /> Utilization by Category
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        {utilization?.map(u => {
                            const pct = Math.round((u.allocated_count / Math.max(u.total_assets, 1)) * 100);
                            return (
                                <div key={u.category_id}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '7px' }}>
                                        <span style={{ fontWeight: 500 }}>{u.category_name}</span>
                                        <span style={{ color: 'var(--text-secondary)' }}>
                                            {u.allocated_count} / {u.total_assets} <span style={{ color: 'var(--success)', fontWeight: 700, marginLeft: '6px' }}>({pct}%)</span>
                                        </span>
                                    </div>
                                    <div className="progress-track">
                                        <div className="progress-fill" style={{ width: `${pct}%`, background: 'var(--grad-accent)', color: '#818cf8' }} />
                                    </div>
                                </div>
                            );
                        })}
                        {(!utilization || utilization.length === 0) && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: '34px' }} />)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Maintenance Report */}
                <div className="card animate-in d-2" style={{ padding: 0, overflow: 'hidden' }}>
                    <h2 className="section-title" style={{ padding: '24px 24px 18px' }}>
                        <Wrench size={16} color="var(--warning)" /> Maintenance Frequency
                    </h2>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Avg Cost</th>
                                <th>Total Repairs</th>
                            </tr>
                        </thead>
                        <tbody>
                            {maintenance?.map((m, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 500 }}>{m.category_name}</td>
                                    <td className="mono" style={{ color: 'var(--warning)', fontWeight: 600 }}>${parseFloat(m.avg_cost || 0).toFixed(2)}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{m.repair_count}</td>
                                </tr>
                            ))}
                            {(!maintenance || maintenance.length === 0) && (
                                <tr><td colSpan={3} style={{ color: 'var(--text-secondary)' }}>Loading…</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
