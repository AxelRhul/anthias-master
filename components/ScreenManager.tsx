import { Wifi, WifiOff } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const ScreenManager = ({ screens, onAdd }: any) => {
    const t = useTranslations('Screens');
    return (
        <div className="space-y-6">
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-400"><Wifi size={20} /> {t('title')}</h2>
                <div className="space-y-3">
                    {screens.map((s: any) => (
                        <div key={s.id} className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                            <div><p className="font-bold">{s.label}</p><p className="text-xs font-mono text-slate-500">{s.ip}</p></div>
                            {s.online ? <Wifi className="text-emerald-500" /> : <WifiOff className="text-rose-500" />}
                        </div>
                    ))}
                </div>
            </section>
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <h2 className="text-lg font-bold mb-4">{t('addTitle')}</h2>
                <div className="space-y-3">
                    <input id="add-ip" placeholder={t('labelIp')} className="w-full bg-slate-800 p-3 rounded-xl outline-none" />
                    <input id="add-label" placeholder={t('labelName')} className="w-full bg-slate-800 p-3 rounded-xl outline-none" />
                    <button onClick={() => {
                        const ip = (document.getElementById('add-ip') as HTMLInputElement).value;
                        const label = (document.getElementById('add-label') as HTMLInputElement).value;
                        onAdd(ip, label);
                    }} className="w-full bg-blue-600 p-3 rounded-xl font-bold">{t('btnSave')}</button>
                </div>
            </section>
        </div>
    );
};