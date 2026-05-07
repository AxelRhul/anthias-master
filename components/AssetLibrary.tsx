import { Eye, Edit3 } from 'lucide-react';

interface AssetLibraryProps {
  assets: any[];
  onView: (id: string, name: string) => void;
  onEdit: (asset: any) => void;
}

export const AssetLibrary = ({ assets, onView, onEdit }: AssetLibraryProps) => (
  <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
    <h2 className="text-2xl font-bold mb-6 text-blue-400">Médiathèque</h2>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-slate-500 text-xs uppercase border-b border-slate-800">
            <th className="pb-4">Média</th>
            <th className="pb-4">Statut</th>
            <th className="pb-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {assets.map(asset => (
            <tr key={asset.asset_id} className="group hover:bg-slate-800/30 transition">
              <td className="py-4 font-medium">{asset.name}</td>
              <td className="py-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black ${asset.is_enabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                  {asset.is_enabled ? 'ACTIF' : 'OFF'}
                </span>
              </td>
              <td className="py-4 flex gap-2">
                <button onClick={() => onView(asset.asset_id, asset.name)} className="p-2 hover:bg-blue-500/20 rounded-lg text-blue-400 transition"><Eye size={18} /></button>
                <button onClick={() => onEdit(asset)} className="p-2 hover:bg-amber-500/20 rounded-lg text-amber-400 transition"><Edit3 size={18} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);