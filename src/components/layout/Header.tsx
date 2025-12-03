import React, { useState, useEffect } from 'react';
import { Moon, Sun, Settings } from 'lucide-react';

export const Header: React.FC = () => {
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
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md md:w-auto">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-full px-4 py-3 md:px-6 shadow-2xl flex items-center justify-between md:justify-start md:gap-8 transition-colors duration-300">
                <a href="/" className="text-zinc-900 dark:text-white font-bold tracking-tight flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                    <span className="hidden xs:inline">Memory Lane</span>
                    <span className="xs:hidden">ML</span>
                </a>

                <div className="h-4 w-[1px] bg-zinc-300 dark:bg-white/10 hidden md:block"></div>

                <div className="flex items-center gap-4 md:gap-6">
                    <a href="/#habits" className="text-xs md:text-sm font-medium text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">習慣</a>
                    <a href="/#media" className="text-xs md:text-sm font-medium text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">媒體庫</a>
                </div>

                <div className="h-4 w-[1px] bg-zinc-300 dark:bg-white/10 hidden md:block"></div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleTheme}
                        className="p-1.5 rounded-full text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 active:scale-90 transition-all cursor-pointer relative z-50"
                        aria-label="Toggle Theme"
                    >
                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    <a
                        href="/admin"
                        className="p-1.5 rounded-full text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 active:scale-90 transition-all cursor-pointer relative z-50"
                        aria-label="Manage"
                    >
                        <Settings size={18} />
                    </a>
                </div>
            </div>
        </nav>
    );
};
