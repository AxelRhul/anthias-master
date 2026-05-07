import { Wifi, WifiOff } from 'lucide-react';

export const ScreenManager = ({ screens, onAdd }: { screens: any[], onAdd: (ip: string, label: string) => void }) => {
  return (
    <div className="space-y-6">
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <h2 className="text-xl font-bold mb-4 text-slate-400 flex items-center gap-2">
          <Wifi size={20} /> Parc de TV
        </h2>
        <div className="space-y-3">
          {screens.map(s => (
            <div key={s.id} className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <div>
                <p className="font-bold">{s.label}</p>
                <p className="text-xs font-mono text-slate-500">{s.ip}</p>
              </div>
              {s.online ? <Wifi className="text-emerald-500" /> : <WifiOff className="text-rose-500" />}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <h2 className="text-lg font-bold mb-4">Ajouter une Pi</h2>
        <div className="space-y-3">
          <input id="add-ip" placeholder="Adresse IP" className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-blue-500 focus:ring-2" />
          <input id="add-label" placeholder="Nom (ex: Salon)" className="w-full bg-slate-800 p-3 rounded-xl outline-none ring-blue-500 focus:ring-2" />
          <button 
            onClick={() => {
              const ip = (document.getElementById('add-ip') as HTMLInputElement).value;
              const label = (document.getElementById('add-label') as HTMLInputElement).value;
              onAdd(ip, label);
            }} 
            className="w-full bg-blue-600 hover:bg-blue-500 p-3 rounded-xl font-bold transition"
          >
            Enregistrer
          </button>
        </div>
      </section>
    </div>
  );
};