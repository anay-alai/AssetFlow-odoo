import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('admin@example.com');
    const [password, setPassword] = useState('password123');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/');
        } catch (error) {
            alert('Login failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl mb-4 font-bold">AssetFlow Login</h2>
                <div className="mb-4">
                    <label className="block mb-2 text-gray-400">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 rounded bg-gray-700 text-white" />
                </div>
                <div className="mb-6">
                    <label className="block mb-2 text-gray-400">Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 rounded bg-gray-700 text-white" />
                </div>
                <button type="submit" className="w-full bg-blue-600 p-2 rounded font-bold hover:bg-blue-700">Login</button>
            </form>
        </div>
    );
}\n