import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
    const { user } = useAuth();
    
    const { data: kpis } = useQuery({
        queryKey: ['kpis'],
        queryFn: async () => {
            const { data } = await api.get('/dashboard/kpis');
            return data.data;
        },
        refetchInterval: 60000
    });

    return (
        <div className="p-8 text-white min-h-screen bg-gray-900">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <p className="mb-8">Welcome back, {user?.name} ({user?.role})</p>
            
            {kpis && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h3 className="text-gray-400">Total Assets</h3>
                        <p className="text-4xl font-bold mt-2">{kpis.totalAssets}</p>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h3 className="text-gray-400">Allocated</h3>
                        <p className="text-4xl font-bold text-green-500 mt-2">{kpis.allocatedAssets}</p>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h3 className="text-gray-400">Available</h3>
                        <p className="text-4xl font-bold text-blue-500 mt-2">{kpis.availableAssets}</p>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h3 className="text-gray-400">Under Maintenance</h3>
                        <p className="text-4xl font-bold text-amber-500 mt-2">{kpis.maintenanceAssets}</p>
                    </div>
                </div>
            )}
        </div>
    );
}\n