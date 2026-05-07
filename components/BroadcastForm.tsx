import { Send } from 'lucide-react';

export const BroadcastForm = ({ onSubmit, loading }: { onSubmit: (e: any) => void, loading: boolean }) => {
  const now = new Date().toISOString().slice(0, 16);
  const nextYear = new Date(Date.now() + 31536000000).toISOString().slice(0, 16);

  return (
    <form onSubmit={onSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-emerald-400 flex items-center gap-2">
        <Send size={24} /> Diffusion Groupée
      </h2>
      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-2">
          <label className="text-xs font-black text-slate-500 uppercase mb-2 block">Fichier Média</label>
          <input type="file" name="image" required className="w-full bg-slate-800 p-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-emerald-500 transition cursor-pointer" />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-black text-slate-500 uppercase mb-2 block">Titre de l'Asset</label>
          <input name="name" className="w-full bg-slate-800 p-4 rounded-2xl outline-none ring-emerald-500 focus:ring-2" placeholder="Ex: Menu du jour" />
        </div>
        <div className="grid grid-cols-2 gap-4 col-span-2">
           <div>
             <label className="text-xs font-black text-slate-500 uppercase mb-2 block">Durée (sec)</label>
             <input name="duration" type="number" defaultValue="10" className="w-full bg-slate-800 p-3 rounded-xl outline-none" />
           </div>
           <div>
             <label className="text-xs font-black text-slate-500 uppercase mb-2 block">Ordre</label>
             <input name="play_order" type="number" defaultValue="0" className="w-full bg-slate-800 p-3 rounded-xl outline-none" />
           </div>
        </div>
        <div>
          <label className="text-xs font-black text-slate-500 uppercase mb-2 block">Début</label>
          <input name="start_date" type="datetime-local" defaultValue={now} className="w-full bg-slate-800 p-3 rounded-xl outline-none" />
        </div>
        <div>
          <label className="text-xs font-black text-slate-500 uppercase mb-2 block">Fin</label>
          <input name="end_date" type="datetime-local" defaultValue={nextYear} className="w-full bg-slate-800 p-3 rounded-xl outline-none" />
        </div>
      </div>
      <button disabled={loading} className="w-full mt-8 py-5 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black text-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98]">
        {loading ? "TRANSFERT EN COURS..." : "DÉPLOYER SUR LE PARC"}
      </button>
    </form>
  );
};