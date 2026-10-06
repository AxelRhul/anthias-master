"use client";
import { useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Screen } from '@/features/screens/types';

type ScreenRenameDialogProps = {
    screen: Screen;
    onSave: (label: string) => Promise<void>;
    onClose: () => void;
};

export const ScreenRenameDialog = ({ screen, onSave, onClose }: ScreenRenameDialogProps) => {
    const t = useTranslations('Screens');
    const [label, setLabel] = useState(screen.label);
    const [busy, setBusy] = useState(false);

    const canSave = label.trim().length > 0 && label.trim() !== screen.label;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        await onSave(label.trim());
        setBusy(false);
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" onClick={onClose}>
            <form
                onSubmit={submit}
                onClick={e => e.stopPropagation()}
                className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md space-y-5 shadow-2xl"
            >
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2"><Pencil size={20} /> {t('renameTitle')}</h2>
                    <button type="button" onClick={onClose} className="text-slate-500 hover:text-white"><X /></button>
                </div>

                <p className="text-sm text-slate-400 font-mono">{screen.ip}</p>

                <input
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    maxLength={100}
                    autoFocus
                    placeholder={t('labelName')}
                    className="w-full bg-slate-800 p-3 rounded-xl outline-none"
                />

                <button type="submit" disabled={busy || !canSave} className="w-full bg-blue-600 hover:bg-blue-500 font-black py-3 rounded-xl transition disabled:opacity-50">
                    {t('btnSave')}
                </button>
            </form>
        </div>
    );
};
