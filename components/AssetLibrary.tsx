import { Eye, Edit3, Image, Film } from 'lucide-react';
import { useTranslations } from 'next-intl';

const decodeHtml = (s: string) => {
  if (typeof document === 'undefined') return s;
  const el = document.createElement('textarea');
  el.innerHTML = s;
  return el.value;
};

const VIDEO_EXTS = new Set(['mp4', 'webm', 'mov', 'avi', 'mkv', 'ogv', 'm4v']);

const isVideo = (asset: any) => {
  if (asset.mimetype?.startsWith('video')) return true;
  const ext = asset.uri?.split('.').pop()?.toLowerCase();
  return ext ? VIDEO_EXTS.has(ext) : false;
};

export const AssetLibrary = ({ assets, onView, onEdit }: any) => {
  const t = useTranslations('Library');
  return (
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-blue-400">{t('title')}</h2>
        <table className="w-full text-left">
          <thead>
          <tr className="text-slate-500 text-xs uppercase border-b border-slate-800">
            <th className="pb-4">{t('colMedia')}</th>
            <th className="pb-4">{t('colStatus')}</th>
            <th className="pb-4">{t('colActions')}</th>
          </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
          {assets.map((asset: any) => (
              <tr key={asset.asset_id} className="hover:bg-slate-800/30 transition">
                <td className="py-4 font-medium flex items-center gap-2">
                  {isVideo(asset) ? <Film size={14} className="text-purple-400 shrink-0" /> : <Image size={14} className="text-blue-400 shrink-0" />}
                  {decodeHtml(asset.name ?? '')}
                </td>
                <td className="py-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black ${asset.is_enabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                  {asset.is_enabled ? t('statusActive') : t('statusOff')}
                </span>
                </td>
                <td className="py-4 flex gap-2">
                  <button onClick={() => onView(asset.asset_id, decodeHtml(asset.name ?? ''))} className="p-2 text-blue-400"><Eye size={18} /></button>
                  <button onClick={() => onEdit(asset)} className="p-2 text-amber-400"><Edit3 size={18} /></button>
                </td>
              </tr>
          ))}
          </tbody>
        </table>
      </section>
  );
};