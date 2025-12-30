import React, { useState } from 'react';
import { submitCheckin } from '../../lib/api';
import { getLocalDateString } from '../../lib/date';
import { HABIT_TYPES, type ActivityType } from '../../lib/habitConfig';
import { X, Plus, Activity } from 'lucide-react';

export const CheckinForm: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activityType, setActivityType] = useState<ActivityType>('exercise');
    const [formData, setFormData] = useState({
        duration_minutes: 30,
        intensity: 'medium',
        pages_read: 20,
        cumulative_xp: 0,  // 当前总经验
        notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Build payload based on activity type
        const basePayload = {
            activity_type: activityType,
            activity_date: getLocalDateString(),  // 使用本地日期
            notes: formData.notes
        };

        let payload: any = basePayload;

        switch (activityType) {
            case 'exercise':
                payload = {
                    ...basePayload,
                    duration_minutes: formData.duration_minutes,
                    intensity: formData.intensity
                };
                break;
            case 'reading':
                payload = {
                    ...basePayload,
                    pages_read: formData.pages_read
                };
                break;
            case 'duolingo':
                payload = {
                    ...basePayload,
                    cumulative_xp: formData.cumulative_xp  // 后端会自动计算差值
                };
                break;
        }

        const result = await submitCheckin(payload);
        if (result.success) {
            setIsOpen(false);
            alert('打卡成功！');
            // Dispatch event to refresh habit data
            window.dispatchEvent(new CustomEvent('habit-checkin-success'));
        } else {
            alert(`打卡失敗: ${result.error || '未知錯誤'}`);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 bg-white text-black p-4 rounded-full shadow-lg shadow-white/10 hover:scale-110 hover:bg-zinc-200 transition-all duration-300 z-50"
            >
                <Plus size={24} />
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                            <Activity size={18} />
                        </div>
                        <h2 className="text-lg font-bold text-white">每日打卡</h2>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">活動類型</label>
                        <div className="grid grid-cols-3 gap-2">
                            {HABIT_TYPES.map((type) => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setActivityType(type.id)}
                                    className={`py-3 rounded-xl text-sm font-medium transition-all border ${activityType === type.id
                                        ? 'bg-white text-black border-white'
                                        : 'bg-zinc-800/50 text-zinc-400 border-transparent hover:bg-zinc-800'
                                        }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Exercise-specific fields */}
                    {activityType === 'exercise' && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">時長 (分鐘)</label>
                                <input
                                    type="number"
                                    value={formData.duration_minutes}
                                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                                    className="w-full rounded-xl bg-zinc-800/50 border-white/5 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 py-3 px-4 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">強度</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'low', label: '輕鬆' },
                                        { id: 'medium', label: '適中' },
                                        { id: 'high', label: '高強度' }
                                    ].map((level) => (
                                        <button
                                            key={level.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, intensity: level.id })}
                                            className={`py-2 rounded-xl text-sm font-medium transition-all border ${formData.intensity === level.id
                                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                                                : 'bg-zinc-800/50 text-zinc-400 border-transparent hover:bg-zinc-800'
                                                }`}
                                        >
                                            {level.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Reading-specific fields */}
                    {activityType === 'reading' && (
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">閱讀頁數</label>
                            <input
                                type="number"
                                value={formData.pages_read}
                                onChange={(e) => setFormData({ ...formData, pages_read: parseInt(e.target.value) || 0 })}
                                className="w-full rounded-xl bg-zinc-800/50 border-white/5 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 py-3 px-4 transition-all"
                                placeholder="今天閱讀了多少頁？"
                            />
                        </div>
                    )}

                    {/* Duolingo-specific fields */}
                    {activityType === 'duolingo' && (
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">當前總經驗 (XP)</label>
                            <input
                                type="number"
                                value={formData.cumulative_xp}
                                onChange={(e) => setFormData({ ...formData, cumulative_xp: parseInt(e.target.value) || 0 })}
                                className="w-full rounded-xl bg-zinc-800/50 border-white/5 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 py-3 px-4 transition-all"
                                placeholder="輸入 Duolingo 顯示的總經驗值"
                            />
                            <p className="text-xs text-zinc-500 mt-2">
                                💡 輸入 Duolingo 個人資料顯示的總 XP，系統會自動計算今日獲得的經驗
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">備註</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full rounded-xl bg-zinc-800/50 border-white/5 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 py-3 px-4 transition-all resize-none"
                            rows={3}
                            placeholder="今天感覺如何？"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors"
                        >
                            保存記錄
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
