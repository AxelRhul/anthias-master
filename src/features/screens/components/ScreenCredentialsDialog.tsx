"use client";
import { useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Screen } from '@/features/screens/types';

type ScreenCredentialsDialogProps = {
    screen: Screen;
    onSave: (username: string, password: string) => Promise<void>;
    onRemove: () => Promise<void>;
    onClose: () => void;
};

export const ScreenCredentialsDialog = ({ screen, onSave, onRemove, onClose }: ScreenCredentialsDialogProps) => {
    const t = useTranslations('Screens');
    const [username, setUsername] = useState(screen.username ?? '');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);

    // The password may stay empty only when one is already stored (the login alone is changed)
    const canSave = username.trim().length > 0 && (password.length > 0 || Boolean(screen.hasCredentials));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        await onSave(username.trim(), password);
        setBusy(false);
    };

    const remove = async () => {
        setBusy(true);
        await onRemove();
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
                    <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2"><KeyRound size={20} /> {t('credentialsTitle')}</h2>
                    <button type="button" onClick={onClose} className="text-slate-500 hover:text-white"><X /></button>
                </div>

                <p className="text-sm text-slate-400">
                    <span className="font-bold text-slate-200">{screen.label}</span> <span className="font-mono">({screen.ip})</span>
                    <br />{t('credentialsHint')}
                </p>

                <input
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    maxLength={100}
                    autoComplete="off"
                    placeholder={t('username')}
                    className="w-full bg-slate-800 p-3 rounded-xl outline-none"
                />
                <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    maxLength={200}
                    autoComplete="new-password"
                    placeholder={screen.hasCredentials ? t('passwordKeep') : t('password')}
                    className="w-full bg-slate-800 p-3 rounded-xl outline-none"
                />

                <div className="flex gap-3">
                    {screen.hasCredentials && (
                        <button type="button" onClick={remove} disabled={busy} className="px-4 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 rounded-xl font-bold transition disabled:opacity-50">
                            {t('credentialsRemove')}
                        </button>
                    )}
                    <button type="submit" disabled={busy || !canSave} className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-black py-3 rounded-xl transition disabled:opacity-50">
                        {t('btnSave')}
                    </button>
                </div>
            </form>
        </div>
    );
};
