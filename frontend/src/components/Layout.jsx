import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Users, Box, ArrowRightLeft,
    Calendar, Wrench, FileCheck, BarChart2, Bell, LogOut, Zap
} from 'lucide-react';

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => { logout(); navigate('/login'); };

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/org-setup', label: 'Org Setup', icon: Users, roles: ['admin', 'asset_manager', 'dept_head'] },
        { path: '/assets', label: 'Assets', icon: Box },
        { path: '/allocations', label: 'Allocations', icon: ArrowRightLeft },
        { path: '/bookings', label: 'Bookings', icon: Calendar },
        { path: '/maintenance', label: 'Maintenance', icon: Wrench },
        { path: '/audits', label: 'Audits', icon: FileCheck, roles: ['admin', 'asset_manager'] },
        { path: '/reports', label: 'Reports', icon: BarChart2 },
        { path: '/notifications', label: 'Notifications', icon: Bell },
    ];

    const roleColors = {
        admin: '#ef4444',
        asset_manager: '#6366f1',
        dept_head: '#f59e0b',
        employee: '#10b981',
    };

    return (
        <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)', overflow: 'hidden' }}>
            {/* Sidebar */}
            <aside style={{
                width: '240px', minWidth: '240px',
                background: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column',
            }}>
                {/* Logo */}
                <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Zap size={16} color="white" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>AssetFlow</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '1px' }}>Enterprise ERP</div>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
                    {navItems
                        .filter(item => !item.roles || item.roles.includes(user?.role))
                        .map(item => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link key={item.path} to={item.path} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '9px 12px', borderRadius: '8px', marginBottom: '2px',
                                    textDecoration: 'none', fontSize: '13.5px', fontWeight: isActive ? 600 : 400,
                                    color: isActive ? 'white' : 'var(--text-secondary)',
                                    background: isActive
                                        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                        : 'transparent',
                                    transition: 'all 0.15s ease',
                                }}
                                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-card)'; }}
                                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <Icon size={16} />
                                    {item.label}
                                </Link>
                            );
                        })}
                </nav>

                {/* User */}
                <div style={{
                    padding: '12px 16px', borderTop: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: `linear-gradient(135deg, ${roleColors[user?.role] || '#6366f1'}, #8b5cf6)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: 700, color: 'white', flexShrink: 0,
                    }}>
                        {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                        <div style={{ fontSize: '11px', color: roleColors[user?.role], textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ')}</div>
                    </div>
                    <button onClick={handleLogout} title="Logout" style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-secondary)', padding: '4px', borderRadius: '4px', display: 'flex',
                    }}>
                        <LogOut size={15} />
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                <Outlet />
            </main>
        </div>
    );
}
