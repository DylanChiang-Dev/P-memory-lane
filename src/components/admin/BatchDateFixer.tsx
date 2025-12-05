import React, { useState } from 'react';
import { Play, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { fetchMediaItems, updateMediaItem } from '../../lib/api';
import { Modal } from '../ui/Modal';

export const BatchDateFixer: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [total, setTotal] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [completed, setCompleted] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const addLog = (msg: string) => {
        setLogs(prev => [msg, ...prev].slice(0, 100));
    };

    const getRandomDate = (start: Date, end: Date) => {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    };

    const handleStartClick = () => {
        setShowConfirmModal(true);
    };

    const startBatchUpdate = async () => {
        setShowConfirmModal(false); // Close the modal
        setLoading(true);
        setCompleted(false);
        setLogs([]);
        setProgress(0);

        try {
            addLog('開始獲取所有電影...');

            // 1. Fetch all movies
            let allMovies: any[] = [];
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                const response = await fetchMediaItems('movies', undefined, page, 100);
                if (response.items.length === 0) {
                    hasMore = false;
                } else {
                    allMovies = [...allMovies, ...response.items];
                    page++;
                    // Safety break
                    if (page > 50) hasMore = false;
                }
            }

            setTotal(allMovies.length);
            addLog(`共找到 ${allMovies.length} 部電影`);

            // 2. Process movies
            let updatedCount = 0;
            let skippedCount = 0;

            for (let i = 0; i < allMovies.length; i++) {
                const movie = allMovies[i];
                setProgress(((i + 1) / allMovies.length) * 100);

                // Check existing date
                const existingDateStr = movie.completed_date || movie.date;
                if (existingDateStr) {
                    const existingDate = new Date(existingDateStr);
                    if (existingDate.getFullYear() >= 2023) {
                        addLog(`[跳過] ${movie.title}: 日期 ${existingDateStr} 在 2023 年之後`);
                        skippedCount++;
                        continue;
                    }
                }

                // Determine date range
                const releaseDateStr = movie.release_date;
                let startDate = new Date('2008-01-01');
                const endDate = new Date('2025-12-31'); // Or today? User said 2025.

                if (releaseDateStr) {
                    const releaseDate = new Date(releaseDateStr);
                    if (releaseDate > startDate) {
                        startDate = releaseDate;
                    }
                }

                if (startDate > endDate) {
                    addLog(`[跳過] ${movie.title}: 上映日期 ${releaseDateStr} 晚於 2025 年`);
                    skippedCount++;
                    continue;
                }

                // Generate random date
                const newDate = getRandomDate(startDate, endDate);
                const newDateStr = newDate.toISOString().split('T')[0];

                addLog(`[更新] ${movie.title}: ${existingDateStr || '無'} -> ${newDateStr}`);

                // Update
                await updateMediaItem('movies', movie.id, {
                    completed_date: newDateStr
                });

                updatedCount++;
                // Small delay to prevent rate limiting if necessary
                // await new Promise(r => setTimeout(r, 50));
            }

            addLog(`完成！更新了 ${updatedCount} 部，跳過 ${skippedCount} 部`);
            setCompleted(true);

        } catch (error) {
            console.error('Batch update failed:', error);
            addLog(`錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-3xl p-6 md:p-8 relative">
            <Modal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={startBatchUpdate}
                title="確認執行批量修復"
                message="這將會自動修改所有符合條件的電影觀看日期。此操作不可逆，建議先備份數據庫。確定要繼續嗎？"
                confirmText="開始修復"
                cancelText="取消"
                isDestructive={true}
            />

            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <AlertTriangle size={20} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">批量日期修復工具</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        自動修復電影觀看日期 (2008-2025)
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-bold mb-2">執行邏輯：</p>
                    <ul className="list-disc list-inside space-y-1 opacity-80">
                        <li>觀看日期隨機分佈在 2008 年至 2025 年之間</li>
                        <li>確保觀看日期晚於電影上映日期</li>
                        <li>若現有觀看日期在 2023 年及以後，則跳過不修改</li>
                    </ul>
                </div>

                {loading && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-zinc-500">
                            <span>進度</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-amber-500 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="h-48 bg-zinc-900 rounded-xl p-4 overflow-y-auto font-mono text-xs text-zinc-400 space-y-1">
                    {logs.length === 0 ? (
                        <span className="opacity-50">等待執行...</span>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className="border-b border-white/5 pb-1 last:border-0">
                                {log}
                            </div>
                        ))
                    )}
                </div>

                <button
                    onClick={handleStartClick}
                    disabled={loading}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${loading
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                        : completed
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-amber-500 text-white hover:bg-amber-600'
                        }`}
                >
                    {loading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            處理中...
                        </>
                    ) : completed ? (
                        <>
                            <CheckCircle2 size={18} />
                            完成
                        </>
                    ) : (
                        <>
                            <Play size={18} />
                            開始修復
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
