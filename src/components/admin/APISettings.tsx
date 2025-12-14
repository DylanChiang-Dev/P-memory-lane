import React, { useMemo, useState, useEffect } from 'react';
import { Key, Save, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { fetchIntegrationStatus, saveIntegrationCredentials, type IntegrationStatus, type IntegrationCredentialsPayload } from '../../lib/api';

export const APISettings: React.FC = () => {
    const [status, setStatus] = useState<IntegrationStatus | null>(null);
    const [form, setForm] = useState<IntegrationCredentialsPayload>({
        tmdb_api_key: '',
        rawg_api_key: '',
        google_books_api_key: '',
        igdb_client_id: '',
        igdb_client_secret: ''
    });
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await fetchIntegrationStatus();
                setStatus(res);
            } catch (e) {
                console.error('Failed to load integrations status:', e);
                setStatus(null);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const refreshStatus = async () => {
        setLoading(true);
        try {
            const res = await fetchIntegrationStatus();
            setStatus(res);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setError(null);
        setSaved(false);
        const payload = Object.fromEntries(
            Object.entries(form)
                .map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
                .filter(([, v]) => typeof v === 'string' && v.length > 0)
        ) as IntegrationCredentialsPayload;

        if (Object.keys(payload).length === 0) {
            setError('没有要保存的内容（全部为空）');
            return;
        }

        try {
            const result = await saveIntegrationCredentials(payload);

            if (result.success) {
                const res = await fetchIntegrationStatus();
                setStatus(res);

                const expectedProviders: Array<{ key: keyof IntegrationStatus; label: string }> = [];
                if (payload.tmdb_api_key) expectedProviders.push({ key: 'tmdb', label: 'TMDB' });
                if (payload.rawg_api_key) expectedProviders.push({ key: 'rawg', label: 'RAWG' });
                if (payload.google_books_api_key) expectedProviders.push({ key: 'google_books', label: 'Google Books' });
                if (payload.igdb_client_id || payload.igdb_client_secret) expectedProviders.push({ key: 'igdb', label: 'IGDB' });

                const missing = expectedProviders
                    .filter(p => (res as any)?.[p.key]?.configured !== true)
                    .map(p => p.label);

                if (missing.length > 0) {
                    setError(`已提交保存，但后端仍显示未配置：${missing.join(', ')}。请检查后端是否成功写入/解密 credentials，或是否登录了不同账号。`);
                    return;
                }

                setSaved(true);
                setForm({
                    tmdb_api_key: '',
                    rawg_api_key: '',
                    google_books_api_key: '',
                    igdb_client_id: '',
                    igdb_client_secret: ''
                });
                setTimeout(() => setSaved(false), 3000);
            } else {
                setError(result.error || result.message || '保存失败');
            }
        } catch (err: any) {
            console.warn('Backend save error:', err);
            setError('服务器连接失败');
        }
    };

    const apiItems = useMemo(() => ([
        {
            key: 'tmdb_api_key',
            label: 'TMDB API Key',
            description: '用于搜索电影和电视剧信息（仅保存在服务器端）',
            link: 'https://www.themoviedb.org/settings/api',
            providerKey: 'tmdb',
        },
        {
            key: 'rawg_api_key',
            label: 'RAWG API Key',
            description: '用于游戏搜索（可选，若 IGDB 已配置可不填）',
            link: 'https://rawg.io/apidocs',
            providerKey: 'rawg',
        },
        {
            key: 'igdb_client_id',
            label: 'IGDB Client ID',
            description: 'Twitch 开发者应用 Client ID（Access Token 由后端自动获取）',
            link: 'https://dev.twitch.tv/console',
            providerKey: 'igdb',
        },
        {
            key: 'igdb_client_secret',
            label: 'IGDB Client Secret',
            description: 'Twitch 开发者应用 Client Secret（仅保存在服务器端）',
            link: 'https://dev.twitch.tv/console',
            providerKey: 'igdb',
        },
        {
            key: 'google_books_api_key',
            label: 'Google Books API Key',
            description: '（可选）用于提升 Google Books 配额（仅保存在服务器端）',
            link: 'https://console.cloud.google.com/apis/library/books.googleapis.com',
            providerKey: 'google_books',
        },
    ] as const), []);

    if (loading) {
        return <div className="p-8 text-center text-zinc-500">加载配置中...</div>;
    }

    const configuredLabel = (providerKey: string) => {
        const configured = (status as any)?.[providerKey]?.configured;
        if (configured === true) return '已配置';
        if (configured === false) return '未配置';
        return '未知';
    };

    return (
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-3xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Key size={24} />
                        API 配置
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        密钥只保存在服务器端；前端不会显示已保存的明文
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={refreshStatus}
                        className="px-4 py-2 rounded-full text-sm font-medium border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                        type="button"
                    >
                        刷新状态
                    </button>
                    {saved && (
                        <div className="flex items-center gap-2 text-teal-500 bg-teal-500/10 px-4 py-2 rounded-full animate-fade-in">
                            <CheckCircle2 size={18} />
                            <span className="font-medium">已保存</span>
                        </div>
                    )}
                    {error && (
                        <div className="flex items-center gap-2 text-red-500 bg-red-500/10 px-4 py-2 rounded-full animate-fade-in max-w-[520px]">
                            <AlertCircle size={18} className="flex-shrink-0" />
                            <span className="font-medium text-xs leading-relaxed">{error}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                {apiItems.map((item) => (
                    <div key={item.key} className="space-y-2">
                        <div className="flex items-start justify-between">
                            <div>
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                    {item.label}
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400">
                                        {configuredLabel(item.providerKey)}
                                    </span>
                                </label>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                    {item.description}
                                </p>
                            </div>
                            <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-teal-500 hover:text-teal-600 flex items-center gap-1 whitespace-nowrap"
                            >
                                获取密钥
                                <ExternalLink size={12} />
                            </a>
                        </div>
                        <input
                            type="text"
                            value={(form as any)[item.key] || ''}
                            onChange={(e) =>
                                setForm({ ...form, [item.key]: e.target.value })
                            }
                            placeholder={`输入 ${item.label}（留空则不修改）`}
                            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-black border border-zinc-200 dark:border-white/10 focus:ring-2 focus:ring-teal-500 outline-none transition-all text-zinc-900 dark:text-white font-mono text-sm"
                        />
                    </div>
                ))}
            </div>

            <div className="flex justify-end pt-6 mt-6 border-t border-zinc-200 dark:border-white/10">
                <button
                    onClick={handleSave}
                    className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 transition-all active:scale-95 flex items-center gap-2"
                >
                    <Save size={18} />
                    保存配置
                </button>
            </div>

            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
                <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-2">
                    💡 配置说明
                </h3>
                <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
                    <li>密钥将加密保存在服务器端，与账号绑定</li>
                    <li>IGDB 的 Access Token 会由后端自动获取/刷新</li>
                    <li>为安全起见，本页不会回显已保存的明文密钥</li>
                </ul>
            </div>
        </div>
    );
};
