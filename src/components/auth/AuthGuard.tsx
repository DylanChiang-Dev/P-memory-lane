import React, { useState, useEffect } from 'react';
import { auth, API_BASE_URL } from '../../lib/auth';
import { fetchWithAuth } from '../../lib/api';
import { LoginForm } from './LoginForm';
import { AlertTriangle, Loader2, LogOut, RefreshCcw } from 'lucide-react';

interface AuthGuardProps {
    children: React.ReactNode;
}

/**
 * AuthGuard - 保护需要认证的页面内容
 * 
 * 与 AuthManager 不同，AuthGuard 会：
 * 1. 在验证完成前显示加载状态（不渲染任何子内容）
 * 2. 通过 API 验证 token 是否有效（不只是检查本地存储）
 * 3. 未认证时显示登录表单，完全阻止访问受保护内容
 * 4. 提供退出登录按钮
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
    const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        validateAuth();
    }, []);

    useEffect(() => {
        const handleLogout = () => {
            setErrorMessage(null);
            setAuthState('unauthenticated');
        };
        window.addEventListener('auth:logout', handleLogout as EventListener);
        return () => window.removeEventListener('auth:logout', handleLogout as EventListener);
    }, []);

    const validateAuth = async () => {
        setErrorMessage(null);
        setAuthState('loading');

        // First check if we have a token locally
        if (!auth.isAuthenticated()) {
            setAuthState('unauthenticated');
            return;
        }

        // Validate token with backend using an authenticated endpoint
        try {
            const response = await fetchWithAuth('/api/integrations/status');
            if (response.ok) {
                setAuthState('authenticated');
            } else {
                // Only treat auth-related responses as unauthenticated; keep session on transient backend errors.
                if (response.status === 401 || response.status === 403) {
                    auth.clearTokens();
                    setAuthState('unauthenticated');
                    return;
                }

                setErrorMessage(`后端暂时不可用 (HTTP ${response.status})`);
                setAuthState('error');
            }
        } catch (error) {
            console.error('Auth validation failed:', error);
            if (error instanceof Error && error.message === 'Unauthorized') {
                auth.clearTokens();
                setAuthState('unauthenticated');
                return;
            }
            setErrorMessage('无法连接到后端，请检查网络或稍后重试。');
            setAuthState('error');
        }
    };

    const handleLoginSuccess = () => {
        setAuthState('authenticated');
        window.location.reload();
    };

    const handleLogout = () => {
        auth.clearTokens();
        setErrorMessage(null);
        setAuthState('unauthenticated');
    };

    // Loading state - show spinner, don't render any children
    if (authState === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
                <div className="text-center">
                    <Loader2 className="animate-spin text-teal-500 mx-auto mb-4" size={48} />
                    <p className="text-zinc-500 dark:text-zinc-400">验证登录状态...</p>
                </div>
            </div>
        );
    }

    // Unauthenticated - show login form, don't render any children
    if (authState === 'unauthenticated') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                            管理后台
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400">
                            请登录以访问仪表盘
                        </p>
                    </div>
                    <LoginForm onLoginSuccess={handleLoginSuccess} />
                </div>
            </div>
        );
    }

    // Backend unavailable / unexpected error - keep user on page with retry
    if (authState === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-4">
                <div className="w-full max-w-md bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-2xl p-6">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="text-amber-500 mt-0.5" size={22} />
                        <div className="flex-1">
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                                连接异常
                            </h2>
                            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                                {errorMessage || '后端暂时不可用。'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={validateAuth}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 transition-all active:scale-95"
                            type="button"
                        >
                            <RefreshCcw size={18} />
                            重试
                        </button>
                        <button
                            onClick={handleLogout}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                            type="button"
                            title="退出登录"
                        >
                            <LogOut size={18} />
                            退出
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Authenticated - render children with logout button
    return (
        <div className="relative">
            {/* Logout button - fixed position */}
            <div className="fixed top-4 right-4 z-50">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors shadow-sm"
                    title="退出登录"
                >
                    <LogOut size={18} />
                    <span className="hidden sm:inline">退出登录</span>
                </button>
            </div>
            {children}
        </div>
    );
};
