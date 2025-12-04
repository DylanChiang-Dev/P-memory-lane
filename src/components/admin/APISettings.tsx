import React, { useState, useEffect } from 'react';
import { Key, Save, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { apiConfigManager, type APIConfig } from '../../lib/apiConfig';
import { fetchUserSettings, saveUserSettings } from '../../lib/api';

export const APISettings: React.FC = () => {
    const [config, setConfig] = useState<APIConfig>(apiConfigManager.getDefaultConfig());
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSettings = async () => {
            setLoading(true);
            try {
                // Try to fetch from backend first
                const settings = await fetchUserSettings();
                let currentConfig = settings && settings.api_keys ? settings.api_keys : apiConfigManager.getConfig();

                // FORCE FIX: Replace known invalid token
                if (currentConfig.igdb_access_token === 'x2pdmmdlmuqy1i380kr8ezq7vg2xp4') {
                    console.log('Detected invalid token, forcing update...');
                    currentConfig = {
                        ...currentConfig,
                        igdb_access_token: 'o96j83dm2bx02p59jb3l2f5wm7jx5i'
                    };
                    // Save the fix immediately
                    apiConfigManager.saveConfig(currentConfig);
                }

                setConfig(currentConfig);

                if (settings && settings.api_keys) {
                    // Also update local manager for immediate use in other components
                    apiConfigManager.saveConfig(settings.api_keys);
                }
            } catch (err) {
                console.error('Failed to load settings:', err);
                let localConfig = apiConfigManager.getConfig();

                // FORCE FIX: Replace known invalid token (local fallback)
                if (localConfig.igdb_access_token === 'x2pdmmdlmuqy1i380kr8ezq7vg2xp4') {
                    localConfig = {
                        ...localConfig,
                        igdb_access_token: 'o96j83dm2bx02p59jb3l2f5wm7jx5i'
                    };
                    apiConfigManager.saveConfig(localConfig);
                }

                setConfig(localConfig);
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const handleSave = async () => {
        setError(null);
        setSaved(false);

        // Always save to local storage first so frontend works
        apiConfigManager.saveConfig(config);

        try {
            // Save to backend
            const result = await saveUserSettings({ api_keys: config });

            if (result.success) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            } else {
                // Backend failed, but we saved locally
                console.warn('Backend save failed, but saved locally:', result.error);
                setSaved(true); // Show saved status anyway
                setError('已保存到本地 (服务器同步失败: ' + (result.error || '未授权') + ')');
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (err: any) {
            // Network error, but we saved locally
            console.warn('Backend save error, but saved locally:', err);
            setSaved(true);
            setError('已保存到本地 (服务器连接失败)');
            setTimeout(() => setSaved(false), 3000);
        }
    };

    const apiItems = [
        {
            key: 'tmdb_api_key',
            label: 'TMDB API Key',
            description: '用于搜索电影和电视剧信息',
            link: 'https://www.themoviedb.org/settings/api',
            required: true,
        },
        {
            key: 'rawg_api_key',
            label: 'RAWG API Key',
            description: '（旧）用于搜索游戏信息，建议迁移到 IGDB',
            link: 'https://rawg.io/apidocs',
            required: false,
        },
        {
            key: 'igdb_client_id',
            label: 'IGDB Client ID',
            description: '（推荐）Twitch 开发者应用 ID',
            link: 'https://dev.twitch.tv/console',
            required: true,
        },
        {
            key: 'igdb_access_token',
            label: 'IGDB Access Token',
            description: '（推荐）Twitch 应用访问令牌',
            link: 'https://dev.twitch.tv/console',
            required: true,
        },
        {
            key: 'google_books_api_key',
            label: 'Google Books API Key',
            description: '（可选）用于增强书籍搜索功能',
            link: 'https://console.cloud.google.com/apis/library/books.googleapis.com',
            required: false,
        },
    ];

    if (loading) {
        return <div className="p-8 text-center text-zinc-500">加载配置中...</div>;
    }

    return (
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-3xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Key size={24} />
                        API 配置
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        配置外部 API 密钥以启用搜索功能
                    </p>
                </div>
                {saved && (
                    <div className="flex items-center gap-2 text-teal-500 bg-teal-500/10 px-4 py-2 rounded-full animate-fade-in">
                        <CheckCircle2 size={18} />
                        <span className="font-medium">已保存</span>
                    </div>
                )}
                {error && (
                    <div className="flex items-center gap-2 text-red-500 bg-red-500/10 px-4 py-2 rounded-full animate-fade-in">
                        <AlertCircle size={18} />
                        <span className="font-medium">{error}</span>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                {apiItems.map((item) => (
                    <div key={item.key} className="space-y-2">
                        <div className="flex items-start justify-between">
                            <div>
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                    {item.label}
                                    {item.required && (
                                        <span className="text-red-500 text-xs">*必填</span>
                                    )}
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
                            value={config[item.key as keyof APIConfig] || ''}
                            onChange={(e) =>
                                setConfig({ ...config, [item.key]: e.target.value })
                            }
                            placeholder={`输入 ${item.label}`}
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
                    <li>API 密钥将加密保存在服务器端</li>
                    <li>TMDB 和 RAWG 是必需的，用于搜索电影、剧集和游戏</li>
                    <li>Google Books API Key 是可选的，不填写也可以使用基本搜索</li>
                    <li>配置后刷新页面即可生效</li>
                </ul>
            </div>
        </div>
    );
};
