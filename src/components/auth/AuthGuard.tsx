import React, { useState, useEffect } from 'react';
import { auth, API_BASE_URL } from '../../lib/auth';
import { LoginForm } from './LoginForm';
import { Loader2, LogOut } from 'lucide-react';

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
    const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

    useEffect(() => {
        validateAuth();
    }, []);

    const validateAuth = async () => {
        // First check if we have a token locally
        if (!auth.isAuthenticated()) {
            setAuthState('unauthenticated');
            return;
        }

        // Validate token with backend using an existing authenticated endpoint
        try {
            const token = auth.getAccessToken();
            const response = await fetch(`${API_BASE_URL}/api/library/movies?limit=1`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                setAuthState('authenticated');
            } else if (response.status === 401) {
                // Token expired or invalid
                auth.clearTokens();
                setAuthState('unauthenticated');
            } else {
                // Other errors - treat as authenticated to avoid blocking on network issues
                // Individual API calls will fail and show appropriate errors
                setAuthState('authenticated');
            }
        } catch (error) {
            console.error('Auth validation failed:', error);
            // Network error - allow access, individual API calls will handle failures
            setAuthState('authenticated');
        }
    };

    const handleLoginSuccess = () => {
        setAuthState('authenticated');
        window.location.reload();
    };

    const handleLogout = () => {
        auth.clearTokens();
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
