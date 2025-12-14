import React, { useState } from 'react';
import { Home, List, Database, Settings, Menu, X, LogOut } from 'lucide-react';
import { ThemeToggle } from '../../ui/ThemeToggle';

interface TopNavProps {
    currentPath: string;
}

export const TopNav: React.FC<TopNavProps> = ({ currentPath }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isActive = (path: string) => {
        if (path === '/admin') {
            return currentPath === '/admin' || currentPath === '/admin/';
        }
        return currentPath.startsWith(path);
    };

    const navItems = [
        { href: '/admin', label: '概覽', icon: Home },
        { href: '/admin/habits', label: '習慣', icon: List },
        { href: '/admin/media', label: '媒體庫', icon: Database },
        { href: '/admin/settings', label: '設定', icon: Settings },
    ];

    const linkClass = (active: boolean, mobile = false) => {
        const base = "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 font-medium text-sm";
        const mobileBase = "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm w-full";

        const activeStyle = active
            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white";

        return `${mobile ? mobileBase : base} ${activeStyle}`;
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-white/5 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">

                {/* Left: Logo & Desktop Nav */}
                <div className="flex items-center gap-8">
                    {/* Logo */}
                    <a href="/admin" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                            </svg>
                        </div>
                        <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white">Admin</span>
                    </a>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                            <a
                                key={item.href}
                                href={item.href}
                                className={linkClass(isActive(item.href))}
                            >
                                <item.icon size={16} />
                                {item.label}
                            </a>
                        ))}
                    </nav>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 md:gap-4">
                    <ThemeToggle className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white" />

                    <div className="hidden md:block w-px h-6 bg-zinc-200 dark:bg-white/10"></div>

                    <a
                        href="/"
                        className="hidden md:flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                    >
                        <LogOut size={16} />
                        返回網站
                    </a>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10"
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-white/5 p-4 space-y-2 animate-in slide-in-from-top-2">
                    {navItems.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className={linkClass(isActive(item.href), true)}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </a>
                    ))}
                    <hr className="border-zinc-100 dark:border-white/5 my-2" />
                    <a
                        href="/"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/5 transition-all text-sm font-medium"
                    >
                        <LogOut size={18} />
                        返回網站
                    </a>
                </div>
            )}
        </header>
    );
};
