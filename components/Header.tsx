import { Monitor, RefreshCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {LocaleSwitcher} from "@/components/LocaleSwitcher";

export const Header = ({ loading, onRefresh }: any) => {
    const t = useTranslations('Header');
    return (
        <header className="flex justify-between items-center border-b border-slate-800 pb-6">
            <h1 className="text-3xl font-black text-blue-500 flex items-center gap-3 italic">
                <Monitor size={36} /> {t('title')}
            </h1>
            <button onClick={onRefresh} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 transition">
                <RefreshCcw size={18} className={loading ? "animate-spin" : ""} /> {t('refresh')}
            </button>
            <LocaleSwitcher/>
        </header>
    );
};