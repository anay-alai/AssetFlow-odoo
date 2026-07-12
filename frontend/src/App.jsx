import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Toaster } from 'react-hot-toast';

import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OrgSetup from './pages/OrgSetup';
import Assets from './pages/Assets';
import Allocations from './pages/Allocations';
import Bookings from './pages/Bookings';
import Maintenance from './pages/Maintenance';
import Notifications from './pages/Notifications';
import Audits from './pages/Audits';
import Reports from './pages/Reports';

const queryClient = new QueryClient();

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            <span className="spinner" /> Loading…
        </div>
    );
    return user ? children : <Navigate to="/login" />;
};

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <NotificationProvider>
                <Toaster position="top-right" toastOptions={{
                    style: {
                        background: 'rgba(15, 17, 30, 0.85)',
                        backdropFilter: 'blur(16px)',
                        color: '#eef1f8',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                        fontSize: '13.5px',
                    },
                    success: { iconTheme: { primary: '#34d399', secondary: '#07080f' } },
                    error: { iconTheme: { primary: '#f87171', secondary: '#07080f' } },
                }} />
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                            <Route index element={<Dashboard />} />
                            <Route path="org-setup" element={<OrgSetup />} />
                            <Route path="assets" element={<Assets />} />
                            <Route path="allocations" element={<Allocations />} />
                            <Route path="bookings" element={<Bookings />} />
                            <Route path="maintenance" element={<Maintenance />} />
                            <Route path="audits" element={<Audits />} />
                            <Route path="reports" element={<Reports />} />
                            <Route path="notifications" element={<Notifications />} />
                            <Route path="*" element={<Dashboard />} />
                        </Route>
                    </Routes>
                </Router>
                </NotificationProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}