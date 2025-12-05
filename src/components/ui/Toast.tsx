import React, { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

// Custom Event Name
const TOAST_EVENT = 'show-toast';

// Static toast methods that dispatch events
export const toast = {
    show: (message: string, type: ToastType = 'info', duration: number = 4000) => {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(TOAST_EVENT, {
                detail: { message, type, duration }
            }));
        }
    },
    success: (message: string, duration?: number) => toast.show(message, 'success', duration),
    error: (message: string, duration?: number) => toast.show(message, 'error', duration),
    info: (message: string, duration?: number) => toast.show(message, 'info', duration),
    warning: (message: string, duration?: number) => toast.show(message, 'warning', duration),
};

// Hook for components that want to use toast (optional, for backward compatibility)
export const useToast = () => {
    return {
        showToast: (message: string, type: ToastType = 'info', duration?: number) => {
            toast.show(message, type, duration);
        }
    };
};

export const ToastContainer: React.FC = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        const handleToastEvent = (event: Event) => {
            const customEvent = event as CustomEvent<{ message: string; type: ToastType; duration: number }>;
            const { message, type, duration } = customEvent.detail;

            const id = Math.random().toString(36).substring(7);
            const newToast: Toast = { id, message, type, duration };

            setToasts(prev => [...prev, newToast]);

            if (duration > 0) {
                setTimeout(() => {
                    setToasts(prev => prev.filter(t => t.id !== id));
                }, duration);
            }
        };

        window.addEventListener(TOAST_EVENT, handleToastEvent);
        return () => window.removeEventListener(TOAST_EVENT, handleToastEvent);
    }, []);

    const dismissToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success': return <CheckCircle className="text-emerald-400" size={20} />;
            case 'error': return <AlertCircle className="text-red-400" size={20} />;
            case 'warning': return <AlertTriangle className="text-amber-400" size={20} />;
            default: return <Info className="text-blue-400" size={20} />;
        }
    };

    const getBorderColor = (type: ToastType) => {
        switch (type) {
            case 'success': return 'border-emerald-500/50';
            case 'error': return 'border-red-500/50';
            case 'warning': return 'border-amber-500/50';
            default: return 'border-blue-500/50';
        }
    };

    return (
        <>
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`
                            pointer-events-auto
                            flex items-start gap-3 
                            bg-zinc-900/95 backdrop-blur-md
                            border ${getBorderColor(toast.type)}
                            rounded-xl p-4 pr-10
                            shadow-2xl
                            min-w-[320px] max-w-[420px]
                            animate-slide-in
                        `}
                    >
                        <div className="flex-shrink-0 mt-0.5">
                            {getIcon(toast.type)}
                        </div>
                        <p className="text-sm text-white leading-relaxed">
                            {toast.message}
                        </p>
                        <button
                            onClick={() => dismissToast(toast.id)}
                            className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes slide-in {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out forwards;
                }
            `}</style>
        </>
    );
};
