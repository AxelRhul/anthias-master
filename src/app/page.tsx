"use client";
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { isAdminRole } from '@/features/auth/roles';
import { Header } from '@/components/Header';
import { ScreenManager } from '@/features/screens/components/ScreenManager';
import { BroadcastForm } from '@/features/assets/components/BroadcastForm';
import { AssetLibrary } from '@/features/assets/components/AssetLibrary';
import { Toast } from '@/components/Toast';
import type { Asset } from '@/features/assets/types';
import type { Screen } from '@/features/screens/types';
import { Save, X } from 'lucide-react';

export default function MasterOps() {
  const t = useTranslations('modals');
  const { data: session } = useSession();
  const isAdmin = isAdminRole(session?.user?.role);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<{ kind: 'one'; id: string; name: string } | { kind: 'off'; count: number } | null>(null);
  const [preview, setPreview] = useState<{ objectUrl: string; mimetype: string; name: string } | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const fetchAll = async () => {
    const sData = await fetch('/api/screens').then(r => r.json());
    const aData = await fetch('/api/assets').then(r => r.json());
    return {
      screens: (Array.isArray(sData) ? sData : []) as Screen[],
      assets: (Array.isArray(aData) ? aData : []) as Asset[],
    };
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const data = await fetchAll();
      setScreens(data.screens);
      setAssets(data.assets);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchAll()
      .then(data => { setScreens(data.screens); setAssets(data.assets); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
    const created = await res.json();
    await loadAll();
    syncScreen(created.id);
  };

  const syncScreen = async (id: number) => {
    setSyncingId(id);
    try {
      const res = await fetch(`/api/screens/${id}/sync`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setToast(data.copied === 0 && data.failed === 0
          ? t('syncUpToDate')
          : t('syncDone', { copied: data.copied, failed: data.failed }));
      } else if (data.error === 'no_source') {
        setToast(t('syncNoSource'));
      } else {
        setToast(t('syncError'));
      }
    } catch {
      setToast(t('syncError'));
    } finally {
      setSyncingId(null);
    }
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

  const askDeleteAsset = (id: string, name: string) => setConfirm({ kind: 'one', id, name });
  const askDeleteDisabled = () => setConfirm({ kind: 'off', count: assets.filter(a => !a.is_enabled).length });

  const runDelete = async () => {
    if (!confirm) return;
    const target = confirm;
    setConfirm(null);
    setLoading(true);
    try {
      const res = await fetch(target.kind === 'one' ? `/api/assets/${target.id}` : '/api/assets', { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setToast(t('deleteDone', { count: data.deleted ?? 0, failed: data.failed ?? 0 }));
      else setToast(t('deleteError'));
    } catch {
      setToast(t('deleteError'));
    }
    setLoading(false);
    loadAll();
  };

  const saveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
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
              <ScreenManager screens={screens} onAdd={addScreen} onDelete={deleteScreen} onSync={syncScreen} syncingId={syncingId} isAdmin={isAdmin} />
            </div>

            <div className="col-span-12 lg:col-span-8 space-y-8">
              <BroadcastForm onSubmit={handleBroadcast} loading={loading} />
              <AssetLibrary assets={assets} onView={openViewer} onEdit={setEditingAsset} onDelete={askDeleteAsset} onDeleteDisabled={askDeleteDisabled} />
            </div>
          </div>
        </div>

        {toast && <Toast message={toast} onClose={() => setToast(null)} />}

        {confirm && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" onClick={() => setConfirm(null)}>
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md space-y-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-rose-400">{t('confirmDeleteTitle')}</h2>
                <p className="text-slate-300">
                  {confirm.kind === 'one' ? t('confirmDeleteOne', { name: confirm.name }) : t('confirmDeleteOff', { count: confirm.count })}
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirm(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold transition">{t('cancel')}</button>
                  <button onClick={runDelete} className="flex-1 bg-rose-600 hover:bg-rose-500 py-3 rounded-xl font-black transition">{t('delete')}</button>
                </div>
              </div>
            </div>
        )}

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
                  // eslint-disable-next-line @next/next/no-img-element -- blob: URL of an uploaded file, next/image cannot optimize it
                  <img src={preview.objectUrl} alt={preview.name} className="max-w-full max-h-[75vh] rounded-xl shadow-2xl border-2 border-slate-800" />
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
                  <input type="number" value={editingAsset.duration} onChange={e => setEditingAsset({ ...editingAsset, duration: Number(e.target.value) })} className="w-full bg-slate-800 p-3 rounded-xl outline-none" placeholder={t('duration')} />
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
