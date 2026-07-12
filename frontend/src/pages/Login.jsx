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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Aurora blobs */}
            <div style={{
                position: 'absolute', top: '-180px', left: '-180px',
                width: '560px', height: '560px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99,102,241,0.28), transparent 65%)',
                filter: 'blur(20px)', pointerEvents: 'none',
                animation: 'floatBlob 9s ease-in-out infinite',
            }} />
            <div style={{
                position: 'absolute', bottom: '-180px', right: '-180px',
                width: '560px', height: '560px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(168,85,247,0.24), transparent 65%)',
                filter: 'blur(20px)', pointerEvents: 'none',
                animation: 'floatBlob 11s ease-in-out infinite reverse',
            }} />
            <div style={{
                position: 'absolute', top: '30%', right: '10%',
                width: '300px', height: '300px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(56,189,248,0.14), transparent 65%)',
                filter: 'blur(24px)', pointerEvents: 'none',
                animation: 'floatBlob 13s ease-in-out infinite',
            }} />

            <div className="animate-scale" style={{
                width: '100%', maxWidth: '410px',
                background: 'var(--bg-glass)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid var(--border)',
                borderRadius: '22px',
                padding: '42px',
                position: 'relative',
                boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '17px',
                        background: 'var(--grad-accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 18px',
                        boxShadow: '0 12px 40px rgba(99,102,241,0.5)',
                    }}>
                        <Zap size={26} color="white" />
                    </div>
                    <h1 style={{
                        fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700,
                        letterSpacing: '-0.02em', marginBottom: '5px',
                        background: 'linear-gradient(90deg, #fff, #a5b4fc)',
                        WebkitBackgroundClip: 'text', backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        Welcome back
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Sign in to AssetFlow ERP
                    </p>
                </div>

                {error && (
                    <div className="alert-danger animate-in" style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '12px 14px', color: 'var(--danger)', fontSize: '13px', marginBottom: '20px',
                    }}>
                        <AlertCircle size={15} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <label className="label">Email address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={15} color="var(--text-secondary)" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                            <input
                                type="email"
                                className="input"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                style={{ paddingLeft: '38px' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '26px' }}>
                        <label className="label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={15} color="var(--text-secondary)" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                            <input
                                type="password"
                                className="input"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                style={{ paddingLeft: '38px' }}
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '13px', fontSize: '14px' }}>
                        {loading && <span className="spinner" />}
                        {loading ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>

                <div style={{
                    marginTop: '26px', padding: '14px 16px',
                    background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
                    border: '1px solid var(--border)',
                }}>
                    <p style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Demo credentials</p>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }} className="mono">admin@example.com</p>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>password: <code className="mono" style={{ color: 'var(--accent)' }}>password123</code></p>
                </div>
            </div>
        </div>
    );
}
