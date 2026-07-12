import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
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
    if (loading) return <div>Loading...</div>;
    return user ? children : <Navigate to="/login" />;
};

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <Toaster position="top-right" toastOptions={{ style: { background: '#1e2130', color: '#fff', border: '1px solid #2a2d3e' } }} />
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
            </AuthProvider>
        </QueryClientProvider>
    );
}