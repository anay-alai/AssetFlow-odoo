import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Building2, Tags, PlusCircle } from 'lucide-react';

const Input = ({ label, type = 'text', value, onChange, required, placeholder }) => (
    <div style={{ marginBottom: '18px' }}>
        {label && <label className="label">{label}</label>}
        <input
            type={type} value={value} onChange={e => onChange(e.target.value)}
            required={required} placeholder={placeholder}
            className="input"
        />
    </div>
);

export default function OrgSetup() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('departments');
    const [newDeptName, setNewDeptName] = useState('');
    const [newCatName, setNewCatName] = useState('');

    const { data: departments, refetch: refetchDepts } = useQuery({ queryKey: ['departments'], queryFn: async () => (await api.get('/departments')).data.data });
    const { data: categories, refetch: refetchCats } = useQuery({ queryKey: ['categories'], queryFn: async () => (await api.get('/categories')).data.data });
    const { data: empResp } = useQuery({ queryKey: ['employees'], queryFn: async () => (await api.get('/employees')).data });
    const employees = empResp?.data || [];

    const createDept = async (e) => {
        e.preventDefault();
        try {
            await api.post('/departments', { name: newDeptName });
            toast.success('Department created'); setNewDeptName(''); refetchDepts();
        } catch { toast.error('Failed to create department'); }
    };

    const createCat = async (e) => {
        e.preventDefault();
        try {
            await api.post('/categories', { name: newCatName });
            toast.success('Category created'); setNewCatName(''); refetchCats();
        } catch { toast.error('Failed to create category'); }
    };

    const updateRole = async (id, role) => {
        try {
            await api.put(`/employees/${id}/role`, { role });
            toast.success('Role updated');
        } catch { toast.error('Failed to update role'); }
    };

    const tabs = ['departments', 'categories', 'employees'];
    const roleColors = { admin: '#f87171', asset_manager: '#818cf8', dept_head: '#fbbf24', employee: '#34d399' };

    return (
        <div>
            <div className="animate-in" style={{ marginBottom: '28px' }}>
                <h1 className="page-title">Organization Setup</h1>
                <p className="page-sub">Manage departments, categories, and employee roles</p>
            </div>

            {/* Tabs */}
            <div className="tabs animate-in d-1" style={{ marginBottom: '26px' }}>
                {tabs.map(tab => (
                    <button key={tab} className={`tab${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
                        {tab.replace('-', ' ')}
                    </button>
                ))}
            </div>

            {activeTab === 'departments' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="card animate-in d-2">
                        <h2 className="section-title" style={{ marginBottom: '18px' }}>
                            <Building2 size={16} color="var(--accent)" /> Departments
                        </h2>
                        {departments?.map(d => (
                            <div key={d.id} style={{
                                padding: '13px 17px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--border)',
                                borderRadius: '11px', marginBottom: '9px',
                                display: 'flex', justifyContent: 'space-between', fontSize: '13px',
                            }}>
                                <span style={{ fontWeight: 600 }}>{d.name}</span>
                                <span className="mono" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>ID: {d.id}</span>
                            </div>
                        ))}
                    </div>
                    {user?.role === 'admin' && (
                        <div className="card animate-in d-3">
                            <h2 className="section-title" style={{ marginBottom: '18px' }}>
                                <PlusCircle size={16} color="var(--success)" /> Add Department
                            </h2>
                            <form onSubmit={createDept}>
                                <Input label="Name" value={newDeptName} onChange={setNewDeptName} required placeholder="e.g. Engineering" />
                                <button type="submit" className="btn btn-primary">Create Department</button>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'categories' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="card animate-in d-2">
                        <h2 className="section-title" style={{ marginBottom: '18px' }}>
                            <Tags size={16} color="var(--accent)" /> Asset Categories
                        </h2>
                        {categories?.map(c => (
                            <div key={c.id} style={{
                                padding: '13px 17px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--border)',
                                borderRadius: '11px', marginBottom: '9px', fontSize: '13px', fontWeight: 500,
                            }}>
                                {c.name}
                            </div>
                        ))}
                    </div>
                    {user?.role === 'admin' && (
                        <div className="card animate-in d-3">
                            <h2 className="section-title" style={{ marginBottom: '18px' }}>
                                <PlusCircle size={16} color="var(--success)" /> Add Category
                            </h2>
                            <form onSubmit={createCat}>
                                <Input label="Name" value={newCatName} onChange={setNewCatName} required placeholder="e.g. Laptops" />
                                <button type="submit" className="btn btn-primary">Create Category</button>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'employees' && (
                <div className="card animate-in d-2" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                {['Name', 'Email', 'Department', 'Role', user?.role === 'admin' && 'Promote'].filter(Boolean).map(h => (
                                    <th key={h}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(emp => (
                                <tr key={emp.id}>
                                    <td style={{ fontWeight: 600 }}>{emp.name}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{emp.email}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{emp.Department?.name || '—'}</td>
                                    <td>
                                        <span className="badge" style={{
                                            background: `${roleColors[emp.role]}18`,
                                            color: roleColors[emp.role],
                                            borderColor: `${roleColors[emp.role]}35`,
                                            textTransform: 'capitalize',
                                        }}>
                                            {emp.role?.replace('_', ' ')}
                                        </span>
                                    </td>
                                    {user?.role === 'admin' && (
                                        <td>
                                            {emp.id === user?.id ? (
                                                <span className="badge" title="You cannot change your own role" style={{
                                                    background: 'rgba(248,113,113,0.12)',
                                                    color: 'var(--danger)',
                                                    borderColor: 'rgba(248,113,113,0.3)',
                                                    cursor: 'not-allowed', userSelect: 'none',
                                                    padding: '6px 12px', fontSize: '12px',
                                                }}>
                                                    🔒 Admin (You)
                                                </span>
                                            ) : (
                                                <select
                                                    className="input"
                                                    defaultValue={emp.role}
                                                    onChange={e => updateRole(emp.id, e.target.value)}
                                                    style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }}
                                                >
                                                    <option value="employee">Employee</option>
                                                    <option value="dept_head">Dept Head</option>
                                                    <option value="asset_manager">Asset Manager</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            )}
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
