import React, { useState } from 'react';
import { auth } from '../../lib/auth';
import { Loader2, LogIn } from 'lucide-react';

export const LoginForm: React.FC<{ onLoginSuccess: () => void }> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const success = await auth.login(email, password);
            if (success) {
                onLoginSuccess();
            } else {
                setError('登錄失敗，請檢查郵箱和密碼');
            }
        } catch (err) {
            setError('發生錯誤，請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
            <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LogIn className="text-white" size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">歡迎回來</h2>
                    <p className="text-zinc-400 mt-2">請登錄以訪問您的個人空間</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
                            郵箱
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="name@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
                            密碼
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : '登錄'}
                    </button>
                </form>
            </div>
        </div>
    );
};
