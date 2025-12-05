import React, { useState } from 'react';
import { Dumbbell, BookOpen, Languages, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { submitCheckin } from '../../lib/api';
import { Modal } from '../ui/Modal';

const HABIT_TYPES = [
    { id: 'exercise', label: '運動', icon: Dumbbell, color: 'bg-orange-500', unit: '分钟' },
    { id: 'reading', label: '閱讀', icon: BookOpen, color: 'bg-blue-500', unit: '页' },
    { id: 'duolingo', label: 'Duolingo', icon: Languages, color: 'bg-green-500', unit: 'XP' },
];

export const HabitConsole: React.FC = () => {
    const [selectedType, setSelectedType] = useState('exercise');
    const [value, setValue] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    // Notification State
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Modal State
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleGenerateTestData = async () => {
        setLoading(true);
        try {
            const today = new Date();
            const habits = ['exercise', 'reading', 'duolingo'];

            for (let i = 0; i < 90; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toLocaleDateString('en-CA');

                // 70% chance to have data for each habit
                for (const habit of habits) {
                    if (Math.random() > 0.3) {
                        let payload: any = {
                            activity_type: habit,
                            activity_date: dateStr,
                            notes: 'Test Data'
                        };

                        if (habit === 'exercise') {
                            // Random 10-90 mins
                            payload.duration_minutes = Math.floor(Math.random() * 80) + 10;
                            payload.intensity = payload.duration_minutes >= 60 ? 'high' : payload.duration_minutes >= 30 ? 'medium' : 'low';
                        } else if (habit === 'reading') {
                            // Random 10-100 pages
                            payload.duration_minutes = 30;
                            payload.pages_read = Math.floor(Math.random() * 90) + 10;
                        } else if (habit === 'duolingo') {
                            // Random 20-150 XP
                            payload.xp_earned = Math.floor(Math.random() * 130) + 20;
                        }

                        await submitCheckin(payload);
                    }
                }
            }

            showNotification('success', '測試數據生成完成！');
            window.dispatchEvent(new Event('habit-checkin-success'));
        } catch (error) {
            console.error('Failed to generate test data:', error);
            showNotification('error', '生成失敗，請重試');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload: any = {
                activity_type: selectedType,
                activity_date: new Date().toLocaleDateString('en-CA'),
                notes
            };

            if (selectedType === 'exercise') {
                payload.duration_minutes = parseInt(value) || 30;
                payload.intensity = 'medium';
            } else if (selectedType === 'reading') {
                payload.duration_minutes = 30; // Default
                payload.pages_read = parseInt(value) || 0;
            } else if (selectedType === 'duolingo') {
                payload.xp_earned = parseInt(value) || 0;
            }

            await submitCheckin(payload);
            showNotification('success', '打卡成功！');
            window.dispatchEvent(new Event('habit-checkin-success'));
            setValue('');
            setNotes('');
        } catch (error) {
            console.error('Check-in failed:', error);
            showNotification('error', '打卡失敗，請重試');
        } finally {
            setLoading(false);
        }
    };

    const currentType = HABIT_TYPES.find(t => t.id === selectedType) || HABIT_TYPES[0];

    return (
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-3xl p-6 md:p-8 relative overflow-hidden">
            <Modal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleGenerateTestData}
                title="生成測試數據"
                message="這將會生成過去 90 天的隨機測試數據，可能會覆蓋現有的部分數據。確定要繼續嗎？"
                confirmText="確認生成"
                cancelText="取消"
            />

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">今日打卡</h2>
                    <div className="flex items-center gap-4 mt-1">
                        <p className="text-zinc-500 dark:text-zinc-400">快速記錄今天的成就</p>
                        <button
                            onClick={() => setShowConfirmModal(true)}
                            className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                            生成測試數據
                        </button>
                    </div>
                </div>
                {notification && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full animate-fade-in ${notification.type === 'success'
                        ? 'text-teal-500 bg-teal-500/10'
                        : 'text-red-500 bg-red-500/10'
                        }`}>
                        {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        <span className="font-medium">{notification.message}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Type Selection */}
                <div className="space-y-4">
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">選擇項目</label>
                    <div className="grid grid-cols-1 gap-3">
                        {HABIT_TYPES.map((type) => (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => setSelectedType(type.id)}
                                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left cursor-pointer ${selectedType === type.id
                                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10 ring-1 ring-teal-500'
                                    : 'border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-xl ${type.color} flex items-center justify-center text-white shadow-md`}>
                                    <type.icon size={20} />
                                </div>
                                <div>
                                    <span className={`block font-bold ${selectedType === type.id ? 'text-teal-700 dark:text-teal-400' : 'text-zinc-700 dark:text-zinc-200'}`}>
                                        {type.label}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Input Form */}
                <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6 bg-zinc-50 dark:bg-white/5 p-6 rounded-2xl border border-zinc-100 dark:border-white/5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                {selectedType === 'exercise' ? '運動時長 (分鐘)' :
                                    selectedType === 'reading' ? '閱讀頁數' : '獲得 XP'}
                            </label>
                            <input
                                type="number"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder="0"
                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-black border border-zinc-200 dark:border-white/10 focus:ring-2 focus:ring-teal-500 outline-none transition-all text-zinc-900 dark:text-white"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                日期
                            </label>
                            <input
                                type="date"
                                defaultValue={new Date().toISOString().split('T')[0]}
                                className="w-full min-w-[180px] px-4 py-3 rounded-xl bg-white dark:bg-black border border-zinc-200 dark:border-white/10 focus:ring-2 focus:ring-teal-500 outline-none transition-all text-zinc-900 dark:text-white [&::-webkit-calendar-picker-indicator]:dark:invert"
                                style={{ minWidth: '180px' }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">備註 (可選)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="今天感覺如何..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-black border border-zinc-200 dark:border-white/10 focus:ring-2 focus:ring-teal-500 outline-none transition-all text-zinc-900 dark:text-white resize-none"
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                            確認打卡
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
