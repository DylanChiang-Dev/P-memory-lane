import React, { useState, useEffect } from 'react';
import { auth } from '../../lib/auth';
import { LoginForm } from './LoginForm';

export const AuthManager: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(true); // Default to true to avoid flash
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        // Check auth on mount
        const checkAuth = () => {
            const isAuth = auth.isAuthenticated();
            setIsAuthenticated(isAuth);
            setChecking(false);
        };

        checkAuth();

        // Listen for storage events (in case of logout in another tab)
        window.addEventListener('storage', checkAuth);
        // Listen for 401 logout event
        window.addEventListener('auth:logout', checkAuth);
        return () => {
            window.removeEventListener('storage', checkAuth);
            window.removeEventListener('auth:logout', checkAuth);
        };
    }, []);

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
        window.location.reload(); // Reload to fetch data with new token
    };

    if (checking) return null;

    if (!isAuthenticated) {
        return <LoginForm onLoginSuccess={handleLoginSuccess} />;
    }

    return null; // Render nothing if authenticated
};
