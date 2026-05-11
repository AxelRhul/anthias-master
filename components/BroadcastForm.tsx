import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const BroadcastForm = ({ onSubmit, loading }: any) => {
    const t = useTranslations('Broadcast');
    const now = new Date().toISOString().slice(0, 16);
    const nextYear = new Date(Date.now() + 31536000000).toISOString().slice(0, 16);

    return (
        <form onSubmit={onSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-emerald-400 flex items-center gap-2"><Send /> {t('title')}</h2>
            <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                    <label className="text-xs font-black text-slate-500 mb-2 block">{t('file')}</label>
                    <input type="file" name="image" required className="w-full bg-slate-800 p-4 rounded-2xl border-2 border-dashed border-slate-700" />
                </div>
                <div className="col-span-2">
                    <label className="text-xs font-black text-slate-500 mb-2 block">{t('assetTitle')}</label>
                    <input name="name" className="w-full bg-slate-800 p-4 rounded-2xl outline-none" />
                </div>
                <div>
                    <label className="text-xs font-black text-slate-500 mb-2 block">{t('duration')}</label>
                    <input name="duration" type="number" defaultValue="10" className="w-full bg-slate-800 p-3 rounded-xl" />
                </div>
                <div>
                    <label className="text-xs font-black text-slate-500 mb-2 block">{t('order')}</label>
                    <input name="play_order" type="number" defaultValue="0" className="w-full bg-slate-800 p-3 rounded-xl" />
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