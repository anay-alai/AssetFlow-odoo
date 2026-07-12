import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const Btn = ({ children, onClick, variant = 'primary', small, disabled, style: extra }) => {
    const base = {
        padding: small ? '6px 14px' : '10px 20px',
        borderRadius: '8px', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: small ? '12px' : '13px', fontWeight: 600, transition: 'opacity 0.2s',
        opacity: disabled ? 0.5 : 1,
        ...extra,
    };
    const styles = {
        primary: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' },
        danger: { background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440' },
        ghost: { background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
    };
    return <button onClick={onClick} disabled={disabled} style={{ ...base, ...styles[variant] }}>{children}</button>;
};

const Input = ({ label, type = 'text', value, onChange, required, placeholder }) => (
    <div style={{ marginBottom: '16px' }}>
        {label && <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>{label}</label>}
        <input
            type={type} value={value} onChange={e => onChange(e.target.value)}
            required={required} placeholder={placeholder}
            style={{
                width: '100%', padding: '9px 12px', background: 'var(--bg-primary)',
                border: '1px solid var(--border)', borderRadius: '8px',
                color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
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
    const roleColors = { admin: '#ef4444', asset_manager: '#6366f1', dept_head: '#f59e0b', employee: '#10b981' };

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>Organization Setup</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Manage departments, categories, and employee roles</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--bg-card)', borderRadius: '10px', padding: '4px', width: 'fit-content', border: '1px solid var(--border)' }}>
                {tabs.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                        padding: '8px 20px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                        fontSize: '13px', fontWeight: 500, transition: 'all 0.15s',
                        background: activeTab === tab ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                        color: activeTab === tab ? 'white' : 'var(--text-secondary)',
                        textTransform: 'capitalize',
                    }}>{tab.replace('-', ' ')}</button>
                ))}
            </div>

            {activeTab === 'departments' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Departments</h2>
                        {departments?.map(d => (
                            <div key={d.id} style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                <span style={{ fontWeight: 500 }}>{d.name}</span>
                                <span style={{ color: 'var(--text-secondary)' }}>ID: {d.id}</span>
                            </div>
                        ))}
                    </div>
                    {user?.role === 'admin' && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                            <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Add Department</h2>
                            <form onSubmit={createDept}>
                                <Input label="Name" value={newDeptName} onChange={setNewDeptName} required placeholder="e.g. Engineering" />
                                <Btn>Create Department</Btn>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'categories' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Asset Categories</h2>
                        {categories?.map(c => (
                            <div key={c.id} style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '8px', fontSize: '13px' }}>
                                {c.name}
                            </div>
                        ))}
                    </div>
                    {user?.role === 'admin' && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                            <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Add Category</h2>
                            <form onSubmit={createCat}>
                                <Input label="Name" value={newCatName} onChange={setNewCatName} required placeholder="e.g. Laptops" />
                                <Btn>Create Category</Btn>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'employees' && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                                {['Name', 'Email', 'Department', 'Role', user?.role === 'admin' && 'Promote'].filter(Boolean).map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((emp, i) => (
                                <tr key={emp.id} style={{ borderBottom: i < employees.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 500 }}>{emp.name}</td>
                                    <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{emp.email}</td>
                                    <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{emp.Department?.name || '—'}</td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: `${roleColors[emp.role]}20`, color: roleColors[emp.role] }}>
                                            {emp.role?.replace('_', ' ')}
                                        </span>
                                    </td>
                                    {user?.role === 'admin' && (
                                        <td style={{ padding: '10px 16px' }}>
                                            <select
                                                defaultValue={emp.role}
                                                onChange={e => updateRole(emp.id, e.target.value)}
                                                style={{ padding: '6px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12px', cursor: 'pointer' }}
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
