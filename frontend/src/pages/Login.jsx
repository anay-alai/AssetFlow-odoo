import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Mail, Lock, AlertCircle } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('admin@example.com');
    const [password, setPassword] = useState('password123');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            let res = await login(email, password);
            console.log(res);
            navigate('/');
        } catch (err) {
            setError(err?.response?.data?.error?.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Background decoration */}
            <div style={{
                position: 'absolute', top: '-200px', left: '-200px',
                width: '500px', height: '500px',
                background: 'radial-gradient(circle, #6366f130, transparent 70%)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: '-200px', right: '-200px',
                width: '500px', height: '500px',
                background: 'radial-gradient(circle, #8b5cf630, transparent 70%)',
                pointerEvents: 'none',
            }} />

            <div style={{
                width: '100%', maxWidth: '400px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '40px',
                position: 'relative',
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                        boxShadow: '0 8px 32px #6366f140',
                    }}>
                        <Zap size={24} color="white" />
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        Welcome back
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Sign in to AssetFlow ERP
                    </p>
                </div>

                {error && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: '#ef444415', border: '1px solid #ef444440',
                        borderRadius: '8px', padding: '12px 14px',
                        color: '#ef4444', fontSize: '13px', marginBottom: '20px',
                    }}>
                        <AlertCircle size={15} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            Email address
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={15} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                style={{
                                    width: '100%', padding: '10px 12px 10px 36px',
                                    background: 'var(--bg-primary)', border: '1px solid var(--border)',
                                    borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px',
                                    outline: 'none', transition: 'border-color 0.2s',
                                    boxSizing: 'border-box',
                                }}
                                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                                onBlur={e => e.target.style.borderColor = 'var(--border)'}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={15} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                style={{
                                    width: '100%', padding: '10px 12px 10px 36px',
                                    background: 'var(--bg-primary)', border: '1px solid var(--border)',
                                    borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px',
                                    outline: 'none', transition: 'border-color 0.2s',
                                    boxSizing: 'border-box',
                                }}
                                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                                onBlur={e => e.target.style.borderColor = 'var(--border)'}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%', padding: '12px',
                            background: loading ? 'var(--border)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            border: 'none', borderRadius: '8px',
                            color: 'white', fontSize: '14px', fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'opacity 0.2s',
                            boxShadow: loading ? 'none' : '0 4px 16px #6366f140',
                        }}
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <div style={{ marginTop: '24px', padding: '14px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>Demo credentials</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>admin@example.com</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>password: <code style={{ color: 'var(--accent)' }}>password123</code></p>
                </div>
            </div>
        </div>
    );
}