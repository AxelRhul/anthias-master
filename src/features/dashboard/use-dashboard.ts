import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { isAdminRole } from '@/features/auth/roles';
import type { Asset } from '@/features/assets/types';
import type { Screen } from '@/features/screens/types';

export type PendingDelete = { kind: 'one'; id: string; name: string } | { kind: 'off'; count: number };
export type AssetPreviewState = { objectUrl: string; mimetype: string; name: string };

// State and actions of the dashboard page (screens, assets, dialogs). The page itself only renders.
export function useDashboard() {
  const t = useTranslations('modals');
  const { data: session } = useSession();
  const isAdmin = isAdminRole(session?.user?.role);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<PendingDelete | null>(null);
  const [preview, setPreview] = useState<AssetPreviewState | null>(null);
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
  const cancelDelete = () => setConfirm(null);

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

  return {
    isAdmin, screens, assets, loading, toast, syncingId, confirm, preview, editingAsset,
    dismissToast: () => setToast(null),
    setEditingAsset,
    loadAll, addScreen, deleteScreen, syncScreen, handleBroadcast, openViewer, closePreview,
    askDeleteAsset, askDeleteDisabled, cancelDelete, runDelete, saveChanges,
  };
}
