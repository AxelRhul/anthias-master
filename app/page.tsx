"use client";
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/Header';
import { ScreenManager } from '@/components/ScreenManager';
import { BroadcastForm } from '@/components/BroadcastForm';
import { AssetLibrary } from '@/components/AssetLibrary';
import { Toast } from '@/components/Toast';
import { Save, X } from 'lucide-react';

export default function MasterOps() {
  const t = useTranslations('modals');
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const [screens, setScreens] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [editingAsset, setEditingAsset] = useState<any>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const sRes = await fetch('/api/screens');
      const sData = await sRes.json();
      setScreens(Array.isArray(sData) ? sData : []);
      const aRes = await fetch('/api/assets');
      const aData = await aRes.json();
      setAssets(Array.isArray(aData) ? aData : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const deleteScreen = async (id: number) => {
    await fetch(`/api/screens/${id}`, { method: 'DELETE' });
    loadAll();
  };

  const addScreen = async (ip: string, label: string) => {
    const res = await fetch('/api/screens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, label }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? 'Erreur lors de l\'ajout');
      return;
    }
    loadAll();
  };

  const handleBroadcast = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    await fetch('/api/broadcast', { method: 'POST', body: fd });
    setLoading(false);
    setToast(t('broadcastDone'));
    loadAll();
  };

  const openViewer = async (id: string, name: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/assets/${id}/stream`);
      if (!res.ok) throw new Error('fetch failed');
      const contentType = res.headers.get('content-type') ?? '';
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      setPreview({ objectUrl, mimetype: contentType, name });
    } catch {
      setPreview(null);
    }
    setLoading(false);
  };

  const closePreview = () => {
    if (preview?.objectUrl) URL.revokeObjectURL(preview.objectUrl);
    setPreview(null);
  };

  const saveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/assets/${editingAsset.asset_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingAsset)
    });
    setEditingAsset(null);
    setLoading(false);
    loadAll();
  };

  return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Header loading={loading} onRefresh={loadAll} />

          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-4">
              <ScreenManager screens={screens} onAdd={addScreen} onDelete={deleteScreen} isAdmin={isAdmin} />
            </div>

            <div className="col-span-12 lg:col-span-8 space-y-8">
              <BroadcastForm onSubmit={handleBroadcast} loading={loading} />
              <AssetLibrary assets={assets} onView={openViewer} onEdit={setEditingAsset} />
            </div>
          </div>
        </div>

        {toast && <Toast message={toast} onClose={() => setToast(null)} />}

        {preview && (
            <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-12" onClick={closePreview}>
              <div className="relative max-w-5xl w-full flex flex-col items-center">
                <h3 className="text-2xl font-bold mb-4">{preview.name}</h3>
                {preview.mimetype?.startsWith('video/') ? (
                  <video
                    src={preview.objectUrl}
                    controls
                    autoPlay
                    className="max-w-full max-h-[75vh] rounded-xl shadow-2xl border-2 border-slate-800"
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <img src={preview.objectUrl} className="max-w-full max-h-[75vh] rounded-xl shadow-2xl border-2 border-slate-800" />
                )}
                <p className="mt-6 text-slate-500 italic">{t('closeHint')}</p>
              </div>
            </div>
        )}

        {editingAsset && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
              <form onSubmit={saveChanges} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md space-y-6 shadow-2xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-amber-400">{t('editTitle')}</h2>
                  <button type="button" onClick={() => setEditingAsset(null)} className="text-slate-500 hover:text-white"><X /></button>
                </div>

                <input value={editingAsset.name} onChange={e => setEditingAsset({ ...editingAsset, name: e.target.value })} className="w-full bg-slate-800 p-3 rounded-xl outline-none" placeholder={t('name')} />

                <div className="grid grid-cols-2 gap-4">
                  <input type="number" value={editingAsset.duration} onChange={e => setEditingAsset({ ...editingAsset, duration: e.target.value })} className="w-full bg-slate-800 p-3 rounded-xl outline-none" placeholder={t('duration')} />
                  <select value={editingAsset.is_enabled.toString()} onChange={e => setEditingAsset({ ...editingAsset, is_enabled: e.target.value === "true" })} className="w-full bg-slate-800 p-3 rounded-xl outline-none">
                    <option value="true">{t('active')}</option>
                    <option value="false">{t('inactive')}</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">{t('startDate')}</label>
                    <input type="datetime-local" value={editingAsset.start_date?.substring(0, 16)} onChange={e => setEditingAsset({ ...editingAsset, start_date: e.target.value })} className="w-full bg-slate-800 p-3 rounded-xl outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">{t('endDate')}</label>
                    <input type="datetime-local" value={editingAsset.end_date?.substring(0, 16)} onChange={e => setEditingAsset({ ...editingAsset, end_date: e.target.value })} className="w-full bg-slate-800 p-3 rounded-xl outline-none" />
                  </div>
                </div>

                <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-4 rounded-xl flex justify-center items-center gap-2 transition-transform active:scale-95">
                  <Save size={20} /> {t('save')}
                </button>
              </form>
            </div>
        )}
      </div>
  );
}
