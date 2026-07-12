const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend', 'src');

const files = {
    'components/Layout.jsx': `
import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Box, ArrowRightLeft, Calendar, Wrench, FileCheck, BarChart2, Bell, LogOut } from 'lucide-react';

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

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

    return (
        <div className="flex h-screen bg-gray-900 text-white font-sans">
            <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-700">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">AssetFlow</h1>
                </div>
                <nav className="flex-1 overflow-y-auto py-4">
                    {navItems.filter(item => !item.roles || item.roles.includes(user?.role)).map(item => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link key={item.path} to={item.path} className={\`flex items-center px-6 py-3 transition-colors \${isActive ? 'bg-blue-600 border-r-4 border-blue-400' : 'hover:bg-gray-700'}\`}>
                                <Icon className="w-5 h-5 mr-3" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold">{user?.name}</p>
                        <p className="text-xs text-gray-400">{user?.role}</p>
                    </div>
                    <button onClick={handleLogout} className="text-gray-400 hover:text-white">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto p-8 bg-gray-900">
                <Outlet />
            </main>
        </div>
    );
}
`,
    'pages/OrgSetup.jsx': `
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function OrgSetup() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('departments');

    const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: async () => (await api.get('/departments')).data.data });
    const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: async () => (await api.get('/categories')).data.data });
    const { data: employeesResponse } = useQuery({ queryKey: ['employees'], queryFn: async () => (await api.get('/employees')).data });
    const employees = employeesResponse?.data || [];

    const roleMutation = useMutation({
        mutationFn: async ({ id, role }) => api.put(\`/employees/\${id}/role\`, { role }),
        onSuccess: () => { toast.success('Role updated'); queryClient.invalidateQueries(['employees']); },
        onError: () => toast.error('Failed to update role')
    });

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Organization Setup</h1>
            <div className="flex space-x-4 mb-6 border-b border-gray-700 pb-2">
                <button onClick={() => setActiveTab('departments')} className={\`pb-2 \${activeTab === 'departments' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}\`}>Departments</button>
                <button onClick={() => setActiveTab('categories')} className={\`pb-2 \${activeTab === 'categories' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}\`}>Categories</button>
                <button onClick={() => setActiveTab('employees')} className={\`pb-2 \${activeTab === 'employees' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}\`}>Employee Directory</button>
            </div>

            {activeTab === 'departments' && (
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h2 className="text-xl font-semibold mb-4">Departments</h2>
                    <ul className="space-y-2">
                        {departments?.map(d => (
                            <li key={d.id} className="p-3 bg-gray-700 rounded flex justify-between">
                                <span>{d.name}</span>
                                <span className="text-gray-400 text-sm">Head ID: {d.head_user_id || 'None'}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {activeTab === 'categories' && (
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h2 className="text-xl font-semibold mb-4">Asset Categories</h2>
                    <ul className="space-y-2">
                        {categories?.map(c => (
                            <li key={c.id} className="p-3 bg-gray-700 rounded">
                                {c.name}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {activeTab === 'employees' && (
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h2 className="text-xl font-semibold mb-4">Employees</h2>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-gray-400 border-b border-gray-700">
                                <th className="pb-2">Name</th>
                                <th className="pb-2">Email</th>
                                <th className="pb-2">Role</th>
                                {user?.role === 'admin' && <th className="pb-2">Action</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(emp => (
                                <tr key={emp.id} className="border-b border-gray-700">
                                    <td className="py-3">{emp.name}</td>
                                    <td className="py-3 text-gray-300">{emp.email}</td>
                                    <td className="py-3">
                                        <span className="px-2 py-1 bg-gray-600 rounded text-xs">{emp.role}</span>
                                    </td>
                                    {user?.role === 'admin' && (
                                        <td className="py-3">
                                            <select 
                                                value={emp.role} 
                                                onChange={e => roleMutation.mutate({ id: emp.id, role: e.target.value })}
                                                className="bg-gray-700 text-white p-1 rounded"
                                            >
                                                <option value="employee">Employee</option>
                                                <option value="dept_head">Dept Head</option>
                                                <option value="asset_manager">Asset Manager</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
`,
    'pages/Assets.jsx': `
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { Link } from 'react-router-dom';

export default function Assets() {
    const [search, setSearch] = useState('');
    const { data: assets } = useQuery({
        queryKey: ['assets', search],
        queryFn: async () => (await api.get(\`/assets/search?tag=\${search}\`)).data.data
    });

    const getStatusColor = (status) => {
        switch(status) {
            case 'Available': return 'bg-green-500/20 text-green-400';
            case 'Allocated': return 'bg-blue-500/20 text-blue-400';
            case 'Under Maintenance': return 'bg-amber-500/20 text-amber-400';
            case 'Lost': return 'bg-red-500/20 text-red-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Assets Directory</h1>
                <input 
                    type="text" 
                    placeholder="Search by tag..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)}
                    className="p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-500"
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assets?.map(asset => (
                    <div key={asset.id} className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg">{asset.name}</h3>
                                <p className="text-sm text-gray-400">{asset.asset_tag}</p>
                            </div>
                            <span className={\`px-2 py-1 text-xs rounded-full \${getStatusColor(asset.status)}\`}>
                                {asset.status}
                            </span>
                        </div>
                        <div className="text-sm text-gray-300 space-y-1">
                            <p>Category: {asset.AssetCategory?.name}</p>
                            <p>Serial: {asset.serial_number}</p>
                            {asset.is_bookable && <p className="text-blue-400 text-xs mt-2">Bookable Resource</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
`,
    'pages/Allocations.jsx': `
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { toast } from 'react-hot-toast';

export default function Allocations() {
    const [assetId, setAssetId] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [conflictError, setConflictError] = useState(null);
    const queryClient = useQueryClient();

    const allocateMutation = useMutation({
        mutationFn: async (data) => await api.post('/allocations', data),
        onSuccess: () => { 
            toast.success('Asset allocated'); 
            setAssetId(''); setEmployeeId(''); setConflictError(null);
            queryClient.invalidateQueries(['assets']); 
        },
        onError: (err) => {
            const errData = err.response?.data?.error;
            if (errData?.code === 'ALREADY_ALLOCATED') {
                setConflictError(errData);
            } else {
                toast.error(errData?.message || 'Failed to allocate');
            }
        }
    });

    const transferMutation = useMutation({
        mutationFn: async (data) => await api.post('/allocations/transfer-requests', data),
        onSuccess: () => {
            toast.success('Transfer requested successfully');
            setConflictError(null);
        }
    });

    const handleAllocate = (e) => {
        e.preventDefault();
        allocateMutation.mutate({ asset_id: assetId, employee_id: employeeId });
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Allocate Asset</h1>
            
            {conflictError && (
                <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded-lg">
                    <h3 className="text-red-400 font-bold mb-2">Allocation Conflict</h3>
                    <p className="mb-4">Already Allocated to {conflictError.currentHolder?.name}</p>
                    {conflictError.suggestedAction === 'transfer_request' && (
                        <button 
                            onClick={() => transferMutation.mutate({ asset_id: assetId, to_user_id: employeeId, reason: 'Needed for new project' })}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-semibold"
                        >
                            Request Transfer
                        </button>
                    )}
                </div>
            )}

            <form onSubmit={handleAllocate} className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4">
                <div>
                    <label className="block text-gray-400 mb-1">Asset ID</label>
                    <input type="number" value={assetId} onChange={e => setAssetId(e.target.value)} required className="w-full p-2 bg-gray-700 rounded text-white border border-gray-600" />
                </div>
                <div>
                    <label className="block text-gray-400 mb-1">Employee ID</label>
                    <input type="number" value={employeeId} onChange={e => setEmployeeId(e.target.value)} required className="w-full p-2 bg-gray-700 rounded text-white border border-gray-600" />
                </div>
                <button type="submit" disabled={allocateMutation.isLoading} className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded font-bold transition-colors">
                    Allocate
                </button>
            </form>
        </div>
    );
}
`,
    'pages/Bookings.jsx': `
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { toast } from 'react-hot-toast';

export default function Bookings() {
    const [resourceId, setResourceId] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [purpose, setPurpose] = useState('');
    const queryClient = useQueryClient();

    const bookMutation = useMutation({
        mutationFn: async (data) => await api.post('/bookings', data),
        onSuccess: () => { 
            toast.success('Resource booked'); 
            setResourceId(''); setStartTime(''); setEndTime(''); setPurpose('');
        },
        onError: (err) => {
            const errData = err.response?.data?.error;
            toast.error(errData?.message || 'Booking failed');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        bookMutation.mutate({ resource_asset_id: resourceId, start_time: startTime, end_time: endTime, purpose });
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Book Resource</h1>
            
            <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4">
                <div>
                    <label className="block text-gray-400 mb-1">Resource (Asset ID)</label>
                    <input type="number" value={resourceId} onChange={e => setResourceId(e.target.value)} required className="w-full p-2 bg-gray-700 rounded text-white border border-gray-600" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-400 mb-1">Start Time</label>
                        <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} required className="w-full p-2 bg-gray-700 rounded text-white border border-gray-600" />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-1">End Time</label>
                        <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} required className="w-full p-2 bg-gray-700 rounded text-white border border-gray-600" />
                    </div>
                </div>
                <div>
                    <label className="block text-gray-400 mb-1">Purpose</label>
                    <textarea value={purpose} onChange={e => setPurpose(e.target.value)} required className="w-full p-2 bg-gray-700 rounded text-white border border-gray-600" />
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded font-bold transition-colors">
                    Book Now
                </button>
            </form>
        </div>
    );
}
`,
    'pages/Maintenance.jsx': `
import React from 'react';
import { toast } from 'react-hot-toast';

export default function Maintenance() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Maintenance Kanban</h1>
            <div className="grid grid-cols-5 gap-4 overflow-x-auto pb-4">
                {['Pending', 'Approved', 'Assigned', 'In Progress', 'Resolved'].map(col => (
                    <div key={col} className="bg-gray-800 p-4 rounded-lg border border-gray-700 min-w-[250px] min-h-[500px]">
                        <h2 className="font-bold mb-4 border-b border-gray-700 pb-2 text-gray-300">{col}</h2>
                        {/* Kanban cards will be fetched and mapped here */}
                        <div className="text-sm text-gray-500 text-center mt-10">No items</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
`,
    'pages/Notifications.jsx': `
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

export default function Notifications() {
    const { data: notifications } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => (await api.get('/notifications')).data.data
    });

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Notifications</h1>
            <div className="space-y-4">
                {notifications?.map(n => (
                    <div key={n.id} className={\`p-4 rounded-lg border \${n.is_read ? 'bg-gray-800 border-gray-700' : 'bg-blue-900/20 border-blue-500'}\`}>
                        <div className="flex justify-between mb-1">
                            <span className="font-semibold text-blue-400">{n.type}</span>
                            <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-200">{n.message}</p>
                    </div>
                ))}
                {!notifications?.length && <p className="text-gray-400">No notifications.</p>}
            </div>
        </div>
    );
}
`
};

for (const [relPath, content] of Object.entries(files)) {
    const fullPath = path.join(srcDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\\n');
}
console.log('Frontend pages and layout generated successfully.');
