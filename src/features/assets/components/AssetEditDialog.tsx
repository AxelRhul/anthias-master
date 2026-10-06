import { Save, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Asset } from '@/features/assets/types';

type AssetEditDialogProps = {
    asset: Asset;
    onChange: (asset: Asset) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
};

export const AssetEditDialog = ({ asset, onChange, onSubmit, onClose }: AssetEditDialogProps) => {
    const t = useTranslations('modals');
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
            <form onSubmit={onSubmit} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md space-y-6 shadow-2xl">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-amber-400">{t('editTitle')}</h2>
                    <button type="button" onClick={onClose} className="text-slate-500 hover:text-white"><X /></button>
                </div>

                <input value={asset.name} onChange={e => onChange({ ...asset, name: e.target.value })} className="w-full bg-slate-800 p-3 rounded-xl outline-none" placeholder={t('name')} />

                <div className="grid grid-cols-2 gap-4">
                    <input type="number" value={asset.duration} onChange={e => onChange({ ...asset, duration: Number(e.target.value) })} className="w-full bg-slate-800 p-3 rounded-xl outline-none" placeholder={t('duration')} />
                    <select value={asset.is_enabled.toString()} onChange={e => onChange({ ...asset, is_enabled: e.target.value === "true" })} className="w-full bg-slate-800 p-3 rounded-xl outline-none">
                        <option value="true">{t('active')}</option>
                        <option value="false">{t('inactive')}</option>
                    </select>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">{t('startDate')}</label>
                        <input type="datetime-local" value={asset.start_date?.substring(0, 16)} onChange={e => onChange({ ...asset, start_date: e.target.value })} className="w-full bg-slate-800 p-3 rounded-xl outline-none" />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">{t('endDate')}</label>
                        <input type="datetime-local" value={asset.end_date?.substring(0, 16)} onChange={e => onChange({ ...asset, end_date: e.target.value })} className="w-full bg-slate-800 p-3 rounded-xl outline-none" />
                    </div>
                </div>

                <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-4 rounded-xl flex justify-center items-center gap-2 transition-transform active:scale-95">
                    <Save size={20} /> {t('save')}
                </button>
            </form>
        </div>
    );
};
