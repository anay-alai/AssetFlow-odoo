import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Zap, Mail, Lock, User, Building2, AlertCircle } from 'lucide-react';

export default function Signup() {
    const [form, setForm] = useState({ name: '', email: '', password: '', department_id: '' });
    const [departments, setDepartments] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    // Public departments list for the optional selector (falls back silently if unauthorized).
    useEffect(() => {
        api.get('/departments').then(r => setDepartments(r.data.data || [])).catch(() => {});
    }, []);

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signup(form);
            navigate('/');
        } catch (err) {
            setError(err?.response?.data?.error?.message || 'Could not create account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-180px', left: '-180px', width: '560px', height: '560px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.28), transparent 65%)', filter: 'blur(20px)', pointerEvents: 'none', animation: 'floatBlob 9s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', bottom: '-180px', right: '-180px', width: '560px', height: '560px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.24), transparent 65%)', filter: 'blur(20px)', pointerEvents: 'none', animation: 'floatBlob 11s ease-in-out infinite reverse' }} />

            <div className="animate-scale" style={{
                width: '100%', maxWidth: '410px', background: 'var(--bg-glass)',
                backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid var(--border)', borderRadius: '22px', padding: '42px',
                position: 'relative', boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '17px', background: 'var(--grad-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: '0 12px 40px rgba(99,102,241,0.5)' }}>
                        <Zap size={26} color="white" />
                    </div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '5px', background: 'linear-gradient(90deg, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Create your account
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Join AssetFlow ERP</p>
                </div>

                {error && (
                    <div className="alert-danger animate-in" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', color: 'var(--danger)', fontSize: '13px', marginBottom: '20px' }}>
                        <AlertCircle size={15} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '14px' }}>
                        <label className="label">Full name</label>
                        <div style={{ position: 'relative' }}>
                            <User size={15} color="var(--text-secondary)" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                            <input type="text" className="input" value={form.name} onChange={set('name')} required style={{ paddingLeft: '38px' }} />
                        </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                        <label className="label">Email address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={15} color="var(--text-secondary)" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                            <input type="email" className="input" value={form.email} onChange={set('email')} required style={{ paddingLeft: '38px' }} />
                        </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                        <label className="label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={15} color="var(--text-secondary)" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                            <input type="password" className="input" value={form.password} onChange={set('password')} required minLength={6} style={{ paddingLeft: '38px' }} />
                        </div>
                    </div>

                    {departments.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <label className="label">Department (optional)</label>
                            <div style={{ position: 'relative' }}>
                                <Building2 size={15} color="var(--text-secondary)" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                                <select className="input" value={form.department_id} onChange={set('department_id')} style={{ paddingLeft: '38px' }}>
                                    <option value="">No department</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '13px', fontSize: '14px' }}>
                        {loading && <span className="spinner" />}
                        {loading ? 'Creating…' : 'Create account'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '18px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    New accounts are created as <strong>Employees</strong>. An admin assigns other roles later.
                </p>
                <p style={{ textAlign: 'center', marginTop: '14px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
                </p>
            </div>
        </div>
    );
}
