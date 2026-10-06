"use client";
import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const BroadcastForm = ({ onSubmit, loading }: any) => {
    const t = useTranslations('Broadcast');
    const now = new Date().toISOString().slice(0, 16);
    const nextYear = new Date(Date.now() + 31536000000).toISOString().slice(0, 16);
    const [isVideo, setIsVideo] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const prevUrlRef = useRef<string | null>(null);

    useEffect(() => {
        return () => { if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current); };
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (prevUrlRef.current) { URL.revokeObjectURL(prevUrlRef.current); prevUrlRef.current = null; }
        if (!file) { setPreviewUrl(null); setIsVideo(false); return; }
        const url = URL.createObjectURL(file);
        prevUrlRef.current = url;
        setPreviewUrl(url);
        setIsVideo(file.type.startsWith('video/'));
    };

    return (
        <form onSubmit={onSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-emerald-400 flex items-center gap-2"><Send /> {t('title')}</h2>
            <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                    <label className="text-xs font-black text-slate-500 mb-2 block">{t('file')}</label>
                    <input
                        type="file"
                        name="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,video/ogg"
                        required
                        onChange={handleFileChange}
                        className="w-full bg-slate-800 p-4 rounded-2xl border-2 border-dashed border-slate-700"
                    />
                    {previewUrl && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-slate-700 bg-black flex items-center justify-center max-h-48">
                            {isVideo
                                ? <video src={previewUrl} controls className="max-h-48 w-full object-contain" />
                                : <img src={previewUrl} className="max-h-48 object-contain" />
                            }
                        </div>
                    )}
                </div>
                <div className="col-span-2">
                    <label className="text-xs font-black text-slate-500 mb-2 block">{t('assetTitle')}</label>
                    <input name="name" maxLength={255} className="w-full bg-slate-800 p-4 rounded-2xl outline-none" />
                </div>
                <div>
                    <label className="text-xs font-black text-slate-500 mb-2 block">
                        {t('duration')}
                        {isVideo && <span className="ml-2 text-purple-400 font-normal normal-case">{t('durationVideoHint')}</span>}
                    </label>
                    <input
                        name="duration"
                        type="number"
                        value={isVideo ? 0 : undefined}
                        defaultValue={isVideo ? undefined : 10}
                        min="0"
                        max="86400"
                        disabled={isVideo}
                        readOnly={isVideo}
                        className={`w-full bg-slate-800 p-3 rounded-xl ${isVideo ? 'opacity-40 cursor-not-allowed' : ''}`}
                    />
                </div>
                <div>
                    <label className="text-xs font-black text-slate-500 mb-2 block">{t('order')}</label>
                    <input name="play_order" type="number" defaultValue="0" min="0" max="9999" className="w-full bg-slate-800 p-3 rounded-xl" />
                </div>
                <div>
                    <label className="text-xs font-black text-slate-500 mb-2 block">{t('start')}</label>
                    <input name="start_date" type="datetime-local" defaultValue={now} className="w-full bg-slate-800 p-3 rounded-xl" />
                </div>
                <div>
                    <label className="text-xs font-black text-slate-500 mb-2 block">{t('end')}</label>
                    <input name="end_date" type="datetime-local" defaultValue={nextYear} className="w-full bg-slate-800 p-3 rounded-xl" />
                </div>
            </div>
            <button disabled={loading} className="w-full mt-8 py-5 bg-emerald-600 rounded-2xl font-black text-xl">
                {loading ? t('sending') : t('btnSubmit')}
            </button>
        </form>
    );
};