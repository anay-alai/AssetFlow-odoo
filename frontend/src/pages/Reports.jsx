import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { BarChart2, PieChart, TrendingUp, Wrench } from 'lucide-react';

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
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>Reports & Analytics</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Asset utilization and maintenance metrics</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Utilization Report */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp size={16} color="#6366f1" /> Utilization by Category
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {utilization?.map(u => (
                            <div key={u.category_id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                                    <span style={{ color: 'var(--text-primary)' }}>{u.category_name}</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>
                                        {u.allocated_count} / {u.total_assets} <span style={{ color: '#10b981', fontWeight: 600, marginLeft: '6px' }}>({Math.round((u.allocated_count/Math.max(u.total_assets, 1))*100)}%)</span>
                                    </span>
                                </div>
                                <div style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${(u.allocated_count/Math.max(u.total_assets, 1))*100}%`, height: '100%', background: '#6366f1', borderRadius: '3px' }} />
                                </div>
                            </div>
                        ))}
                        {(!utilization || utilization.length === 0) && <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading...</div>}
                    </div>
                </div>

                {/* Maintenance Report */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Wrench size={16} color="#f59e0b" /> Maintenance Frequency
                    </h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ paddingBottom: '12px', fontWeight: 500 }}>Category</th>
                                <th style={{ paddingBottom: '12px', fontWeight: 500 }}>Avg Cost</th>
                                <th style={{ paddingBottom: '12px', fontWeight: 500 }}>Total Repairs</th>
                            </tr>
                        </thead>
                        <tbody>
                            {maintenance?.map((m, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '12px 0', color: 'var(--text-primary)' }}>{m.category_name}</td>
                                    <td style={{ padding: '12px 0', color: '#f59e0b', fontWeight: 600 }}>${parseFloat(m.avg_cost || 0).toFixed(2)}</td>
                                    <td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>{m.repair_count}</td>
                                </tr>
                            ))}
                            {(!maintenance || maintenance.length === 0) && (
                                <tr><td colSpan={3} style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>Loading...</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
