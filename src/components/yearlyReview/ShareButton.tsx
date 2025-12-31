import React, { useState } from 'react';
import { toPng } from 'html-to-image';
import { Share, Loader2 } from 'lucide-react';

interface ShareButtonProps {
    targetRef: React.RefObject<HTMLDivElement>;
    fileName?: string;
    label?: string;
    isLarge?: boolean;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
    targetRef,
    fileName = 'yearly-review',
    label,
    isLarge = false
}) => {
    const [loading, setLoading] = useState(false);

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!targetRef.current) return;

        setLoading(true);
        try {
            const options = {
                pixelRatio: 2,
                skipFonts: false,
                cacheBust: true,
                style: {
                    borderRadius: '0'
                }
            };

            const dataUrl = await toPng(targetRef.current, options);

            const link = document.createElement('a');
            link.download = `${fileName}-${new Date().getTime()}.png`;
            link.href = dataUrl;
            link.click();

        } catch (error) {
            console.error('Failed to capture image:', error);
            alert('生成圖片失敗，請重試');
        } finally {
            setLoading(false);
        }
    };

    if (isLarge) {
        return (
            <button
                onClick={handleShare}
                disabled={loading}
                className="flex items-center space-x-2 px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-white/90 active:scale-95 transition-all text-base shadow-xl disabled:opacity-50"
            >
                {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                ) : (
                    <Share size={20} />
                )}
                <span>{loading ? 'Generating...' : (label || 'Share Memory')}</span>
            </button>
        );
    }

    return (
        <button
            onClick={handleShare}
            disabled={loading}
            className="absolute bottom-6 right-8 z-50 p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/20 active:scale-95 transition-all shadow-lg disabled:opacity-50"
            title={label || "分享此頁面"}
        >
            {loading ? (
                <Loader2 size={18} className="animate-spin" />
            ) : (
                <Share size={18} />
            )}
        </button>
    );
};
