import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { toast } from 'react-hot-toast';
import { Bell, CheckCheck, Info, Wrench, Calendar, ArrowRightLeft, AlertTriangle } from 'lucide-react';

const typeIcons = {
    'Asset Assigned': Info,
    'Maintenance Approved': Wrench,
    'Maintenance Rejected': Wrench,
    'Booking Confirmed': Calendar,
    'Booking Cancelled': Calendar,
    'Booking Reminder': Calendar,
    'Transfer Approved': ArrowRightLeft,
    'Overdue Return': AlertTriangle,
    'Audit Discrepancy': AlertTriangle,
};

const typeColors = {
    'Asset Assigned': '#6366f1',
    'Maintenance Approved': '#10b981',
    'Maintenance Rejected': '#ef4444',
    'Booking Confirmed': '#3b82f6',
    'Booking Cancelled': '#ef4444',
    'Booking Reminder': '#f59e0b',
    'Transfer Approved': '#8b5cf6',
    'Overdue Return': '#ef4444',
    'Audit Discrepancy': '#f59e0b',
};

const TABS = ['All', 'Alerts', 'Approvals', 'Bookings'];

export default function Notifications() {
    const [activeTab, setActiveTab] = useState('All');
    const queryClient = useQueryClient();

    const { data: notifications } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => (await api.get('/notifications')).data.data,
        refetchInterval: 30000,
    });

    const markReadMutation = useMutation({
        mutationFn: (id) => api.put(`/notifications/${id}/read`),
        onSuccess: () => queryClient.invalidateQueries(['notifications']),
    });

    const filtered = notifications?.filter(n => {
        if (activeTab === 'All') return true;
        if (activeTab === 'Alerts') return ['Overdue Return', 'Audit Discrepancy'].includes(n.type);
        if (activeTab === 'Approvals') return ['Maintenance Approved', 'Maintenance Rejected', 'Transfer Approved'].includes(n.type);
        if (activeTab === 'Bookings') return ['Booking Confirmed', 'Booking Cancelled', 'Booking Reminder'].includes(n.type);
        return true;
    }) || [];

    const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

    return (
        <div>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        Notifications
                        {unreadCount > 0 && (
                            <span style={{ background: '#ef4444', color: 'white', borderRadius: '20px', fontSize: '12px', padding: '2px 8px', fontWeight: 700 }}>
                                {unreadCount}
                            </span>
                        )}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{notifications?.length || 0} total notifications</p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--bg-card)', borderRadius: '10px', padding: '4px', width: 'fit-content', border: '1px solid var(--border)' }}>
                {TABS.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                        padding: '7px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                        fontSize: '13px', fontWeight: 500, transition: 'all 0.15s',
                        background: activeTab === tab ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                        color: activeTab === tab ? 'white' : 'var(--text-secondary)',
                    }}>{tab}</button>
                ))}
            </div>

            {/* Notification list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <Bell size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
                        <div>No notifications in this category</div>
                    </div>
                )}
                {filtered.map(n => {
                    const Icon = typeIcons[n.type] || Bell;
                    const color = typeColors[n.type] || 'var(--accent)';
                    return (
                        <div key={n.id} style={{
                            background: n.is_read ? 'var(--bg-card)' : 'var(--bg-secondary)',
                            border: `1px solid ${n.is_read ? 'var(--border)' : color + '40'}`,
                            borderRadius: '10px', padding: '16px',
                            display: 'flex', alignItems: 'flex-start', gap: '14px',
                            cursor: 'pointer', transition: 'all 0.15s',
                        }}
                            onClick={() => !n.is_read && markReadMutation.mutate(n.id)}
                        >
                            <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Icon size={16} color={color} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color }}>
                                        {n.type}
                                    </span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                        {new Date(n.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{n.message}</p>
                            </div>
                            {!n.is_read && (
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0, marginTop: '4px' }} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
