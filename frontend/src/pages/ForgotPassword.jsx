import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Mail, AlertCircle, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { forgotPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await forgotPassword(email);
            setSent(true);
        } catch (err) {
            setError(err?.response?.data?.error?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-180px', left: '-180px', width: '560px', height: '560px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.28), transparent 65%)', filter: 'blur(20px)', pointerEvents: 'none', animation: 'floatBlob 9s ease-in-out infinite' }} />

            <div className="animate-scale" style={{
                width: '100%', maxWidth: '410px', background: 'var(--bg-glass)',
                backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid var(--border)', borderRadius: '22px', padding: '42px',
                boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '17px', background: 'var(--grad-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: '0 12px 40px rgba(99,102,241,0.5)' }}>
                        <Zap size={26} color="white" />
                    </div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, marginBottom: '5px', color: 'var(--text-primary)' }}>Reset your password</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>We'll send a reset link to your email</p>
                </div>

                {sent ? (
                    <div>
                        <div className="alert-success animate-in" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '14px', color: 'var(--success)', fontSize: '13px', marginBottom: '20px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '10px' }}>
                            <CheckCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                            <span>If an account exists for <strong>{email}</strong>, a reset link has been sent. (In development the token is printed to the backend console.)</span>
                        </div>
                        <Link to="/login" className="btn btn-primary" style={{ width: '100%', padding: '12px', display: 'block', textAlign: 'center', textDecoration: 'none' }}>Back to sign in</Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="alert-danger animate-in" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', color: 'var(--danger)', fontSize: '13px', marginBottom: '20px' }}>
                                <AlertCircle size={15} /> {error}
                            </div>
                        )}
                        <div style={{ marginBottom: '22px' }}>
                            <label className="label">Email address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={15} color="var(--text-secondary)" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                                <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required style={{ paddingLeft: '38px' }} />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '13px', fontSize: '14px' }}>
                            {loading && <span className="spinner" />}
                            {loading ? 'Sending…' : 'Send reset link'}
                        </button>
                        <p style={{ textAlign: 'center', marginTop: '18px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Back to sign in</Link>
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
