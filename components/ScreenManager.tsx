"use client";
import { useRef, useState } from 'react';
import { Wifi, WifiOff, Trash2, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { isValidHost } from '@/lib/validate';
import type { Screen } from '@/lib/types';

type ScreenManagerProps = {
    screens: Screen[];
    onAdd: (ip: string, label: string) => Promise<void>;
    onDelete: (id: number) => void;
    onSync: (id: number) => void;
    syncingId: number | null;
    isAdmin: boolean;
};

export const ScreenManager = ({ screens, onAdd, onDelete, onSync, syncingId, isAdmin }: ScreenManagerProps) => {
    const t = useTranslations('Screens');
    const ipRef = useRef<HTMLInputElement>(null);
    const labelRef = useRef<HTMLInputElement>(null);
    const [adding, setAdding] = useState(false);

    const handleAdd = async () => {
        const ip = ipRef.current?.value.trim() ?? '';
        const label = labelRef.current?.value.trim() ?? '';
        if (!ip || !label) return;
        if (!isValidHost(ip)) {
            alert(t('invalidIp'));
            return;
        }
        setAdding(true);
        await onAdd(ip, label);
        if (ipRef.current) ipRef.current.value = '';
        if (labelRef.current) labelRef.current.value = '';
        setAdding(false);
    };

    return (
        <div className="space-y-6">
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-400"><Wifi size={20} /> {t('title')}</h2>
                <div className="space-y-3">
                    {screens.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                            <div><p className="font-bold">{s.label}</p><p className="text-xs font-mono text-slate-500">{s.ip}</p></div>
                            <div className="flex items-center gap-3">
                                {s.online ? <Wifi className="text-emerald-500" /> : <WifiOff className="text-rose-500" />}
                                <button
                                    onClick={() => onSync(s.id)}
                                    disabled={syncingId !== null}
                                    className="p-1.5 text-slate-600 hover:text-blue-400 transition-colors disabled:opacity-50"
                                    title={t('sync')}
                                >
                                    <RefreshCw size={16} className={syncingId === s.id ? 'animate-spin' : ''} />
                                </button>
                                {isAdmin && (
                                    <button
                                        onClick={() => onDelete(s.id)}
                                        className="p-1.5 text-slate-600 hover:text-rose-500 transition-colors"
                                        title="Supprimer"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            {isAdmin && <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <h2 className="text-lg font-bold mb-4">{t('addTitle')}</h2>
                <div className="space-y-3">
                    <input ref={ipRef} placeholder={t('labelIp')} className="w-full bg-slate-800 p-3 rounded-xl outline-none" />
                    <input ref={labelRef} placeholder={t('labelName')} maxLength={100} className="w-full bg-slate-800 p-3 rounded-xl outline-none" />
                    <button
                        onClick={handleAdd}
                        disabled={adding}
                        className="w-full bg-blue-600 p-3 rounded-xl font-bold disabled:opacity-50"
                    >
                        {adding ? '...' : t('btnSave')}
                    </button>
                </div>
            </section>}
        </div>
    );
};
