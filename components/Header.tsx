"use client";
import { Monitor, RefreshCcw, LogOut, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { signOut, useSession } from "next-auth/react";

export const Header = ({ loading, onRefresh }: any) => {
    const t = useTranslations('Header');
    const { data: session } = useSession();
    const isAdmin = (session?.user as any)?.role === "ADMIN";

    return (
        <header className="flex justify-between items-center border-b border-slate-800 pb-6">
            <h1 className="text-3xl font-black text-blue-500 flex items-center gap-3 italic">
                <Monitor size={36} /> {t('title')}
            </h1>
            <div className="flex items-center gap-3">
                <button onClick={onRefresh} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 transition">
                    <RefreshCcw size={18} className={loading ? "animate-spin" : ""} /> {t('refresh')}
                </button>
                <LocaleSwitcher />
                {isAdmin && (
                    <a href="/admin/users"
                        className="bg-slate-800 hover:bg-blue-600/20 text-slate-400 hover:text-blue-400 px-4 py-2 rounded-xl flex items-center gap-2 transition"
                        title="Gestion des utilisateurs">
                        <Users size={18} />
                    </a>
                )}
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 px-4 py-2 rounded-xl flex items-center gap-2 transition"
                    title="Se déconnecter">
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
};
