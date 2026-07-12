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
        admin: '#f87171',
        asset_manager: '#818cf8',
        dept_head: '#fbbf24',
        employee: '#34d399',
    };

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            {/* Sidebar */}
            <aside style={{
                width: '248px', minWidth: '248px',
                background: 'var(--bg-glass)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRight: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column',
                zIndex: 10,
            }}>
                {/* Logo */}
                <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                        <img
                            src="/favicon.png"
                            alt="AssetFlow logo"
                            style={{
                                width: '38px', height: '38px',
                                borderRadius: '10px',
                                objectFit: 'cover',
                                boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                            }}
                        />
                        <div>
                            <div style={{
                                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '17px',
                                letterSpacing: '-0.02em',
                                background: 'linear-gradient(90deg, #fff 30%, #a5b4fc)',
                                WebkitBackgroundClip: 'text', backgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>AssetFlow</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '1px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Enterprise ERP</div>
                        </div>
                    </div>
                </div>



                {/* Nav */}
                <nav style={{ flex: 1, overflowY: 'auto', padding: '14px 10px' }}>
                    {navItems
                        .filter(item => !item.roles || item.roles.includes(user?.role))
                        .map(item => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link key={item.path} to={item.path} className={`nav-link${isActive ? ' active' : ''}`}>
                                    <Icon size={16} style={{ opacity: isActive ? 1 : 0.75 }} />
                                    {item.label}
                                </Link>
                            );
                        })}
                </nav>

                {/* User */}
                <div style={{
                    margin: '10px', padding: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)',
                    borderRadius: '14px',
                    display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                    <div style={{
                        width: '34px', height: '34px', borderRadius: '50%',
                        background: `linear-gradient(135deg, ${roleColors[user?.role] || '#818cf8'}, #8b5cf6)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: 700, color: 'white', flexShrink: 0,
                        boxShadow: `0 4px 14px ${roleColors[user?.role] || '#818cf8'}40`,
                    }}>
                        {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                        <div style={{ fontSize: '11px', color: roleColors[user?.role], textTransform: 'capitalize', fontWeight: 600 }}>{user?.role?.replace('_', ' ')}</div>
                    </div>
                    <button onClick={handleLogout} title="Logout" style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-secondary)', padding: '6px', borderRadius: '8px', display: 'flex',
                        transition: 'all 0.15s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'none'; }}
                    >
                        <LogOut size={15} />
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main style={{ flex: 1, overflowY: 'auto', padding: '36px 40px' }}>
                <Outlet />
            </main>
        </div>
    );
}
