import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Bell, Info, Wrench, Calendar, ArrowRightLeft, AlertTriangle } from 'lucide-react';

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
    'Asset Assigned': '#818cf8',
    'Maintenance Approved': '#34d399',
    'Maintenance Rejected': '#f87171',
    'Booking Confirmed': '#60a5fa',
    'Booking Cancelled': '#f87171',
    'Booking Reminder': '#fbbf24',
    'Transfer Approved': '#a78bfa',
    'Overdue Return': '#f87171',
    'Audit Discrepancy': '#fbbf24',
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
            <div className="animate-in" style={{ marginBottom: '28px' }}>
                <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    Notifications
                    {unreadCount > 0 && (
                        <span style={{
                            background: 'linear-gradient(135deg, #ef4444, #f87171)',
                            color: 'white', borderRadius: '999px', fontSize: '12px',
                            padding: '3px 10px', fontWeight: 700,
                            WebkitTextFillColor: 'white',
                            boxShadow: '0 4px 14px rgba(239,68,68,0.4)',
                        }}>
                            {unreadCount}
                        </span>
                    )}
                </h1>
                <p className="page-sub">{notifications?.length || 0} total notifications</p>
            </div>

            {/* Tabs */}
            <div className="tabs animate-in d-1" style={{ marginBottom: '22px' }}>
                {TABS.map(tab => (
                    <button key={tab} className={`tab${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* Notification list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filtered.length === 0 && (
                    <div className="card empty-state animate-in d-2">
                        <Bell size={34} style={{ marginBottom: '12px', opacity: 0.35 }} />
                        <div>No notifications in this category</div>
                    </div>
                )}
                {filtered.map((n, i) => {
                    const Icon = typeIcons[n.type] || Bell;
                    const color = typeColors[n.type] || 'var(--accent)';
                    return (
                        <div key={n.id} className={`card card-hover animate-in d-${Math.min(i + 1, 6)}`} style={{
                            padding: '17px 19px',
                            display: 'flex', alignItems: 'flex-start', gap: '14px',
                            cursor: 'pointer',
                            borderColor: n.is_read ? 'var(--border)' : `${color}40`,
                            background: n.is_read ? 'var(--bg-card)' : `linear-gradient(135deg, ${color}0a, rgba(255,255,255,0.03))`,
                        }}
                            onClick={() => !n.is_read && markReadMutation.mutate(n.id)}
                        >
                            <div className="icon-tile" style={{
                                width: '38px', height: '38px',
                                background: `${color}18`,
                                border: `1px solid ${color}30`,
                            }}>
                                <Icon size={16} color={color} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color }}>
                                        {n.type}
                                    </span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                        {new Date(n.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{n.message}</p>
                            </div>
                            {!n.is_read && (
                                <div className="pulse-dot" style={{ width: '8px', height: '8px', background: color, color, flexShrink: 0, marginTop: '5px' }} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
