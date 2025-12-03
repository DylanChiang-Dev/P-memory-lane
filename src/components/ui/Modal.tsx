import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = false,
}) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-100">
                <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-white/5">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-zinc-600 dark:text-zinc-300">{message}</p>
                </div>
                <div className="flex items-center justify-end gap-3 p-6 pt-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-4 py-2 text-sm font-bold text-white rounded-lg shadow-lg transition-all active:scale-95 ${isDestructive
                                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                                : 'bg-teal-500 hover:bg-teal-600 shadow-teal-500/20'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
