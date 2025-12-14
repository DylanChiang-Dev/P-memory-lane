import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export const ThemeToggle: React.FC<{
    className?: string;
    showLabel?: boolean;
}> = ({ className = '', showLabel = false }) => {
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        // Initialize theme from localStorage or system preference
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDark(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
            setIsDark(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
            setIsDark(true);
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-2 ${className}`}
            title="Switch Theme"
            type="button"
        >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            {showLabel && (
                <span className="text-sm font-medium">
                    {isDark ? 'Light Mode' : 'Dark Mode'}
                </span>
            )}
        </button>
    );
};
