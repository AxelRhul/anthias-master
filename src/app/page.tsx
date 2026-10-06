"use client";
import { useTranslations } from 'next-intl';
import { Header } from '@/components/Header';
import { Toast } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ScreenManager } from '@/features/screens/components/ScreenManager';
import { ScreenCredentialsDialog } from '@/features/screens/components/ScreenCredentialsDialog';
import { BroadcastForm } from '@/features/assets/components/BroadcastForm';
import { AssetLibrary } from '@/features/assets/components/AssetLibrary';
import { AssetPreview } from '@/features/assets/components/AssetPreview';
import { AssetEditDialog } from '@/features/assets/components/AssetEditDialog';
import { useDashboard } from '@/features/dashboard/use-dashboard';

export default function MasterOps() {
  const t = useTranslations('modals');
  const d = useDashboard();

  return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Header loading={d.loading} onRefresh={d.loadAll} />

          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-4">
              <ScreenManager
                screens={d.screens}
                onAdd={d.addScreen}
                onDelete={d.deleteScreen}
                onSync={d.syncScreen}
                syncingId={d.syncingId}
                isAdmin={d.isAdmin}
                isSuperAdmin={d.isSuperAdmin}
                onEditCredentials={d.openCredentials}
              />
            </div>

            <div className="col-span-12 lg:col-span-8 space-y-8">
              <BroadcastForm onSubmit={d.handleBroadcast} loading={d.loading} />
              <AssetLibrary
                assets={d.assets}
                onView={d.openViewer}
                onEdit={d.setEditingAsset}
                onDelete={d.askDeleteAsset}
                onDeleteDisabled={d.askDeleteDisabled}
              />
            </div>
          </div>
        </div>

        {d.toast && <Toast message={d.toast} onClose={d.dismissToast} />}

        {d.credentialsFor && (
          <ScreenCredentialsDialog
            screen={d.credentialsFor}
            onSave={d.saveCredentials}
            onRemove={d.removeCredentials}
            onClose={d.closeCredentials}
          />
        )}

        {d.confirm && (
          <ConfirmDialog
            title={t('confirmDeleteTitle')}
            message={d.confirm.kind === 'one'
              ? t('confirmDeleteOne', { name: d.confirm.name })
              : t('confirmDeleteOff', { count: d.confirm.count })}
            cancelLabel={t('cancel')}
            confirmLabel={t('delete')}
            onCancel={d.cancelDelete}
            onConfirm={d.runDelete}
          />
        )}

        {d.preview && (
          <AssetPreview
            name={d.preview.name}
            mimetype={d.preview.mimetype}
            objectUrl={d.preview.objectUrl}
            onClose={d.closePreview}
          />
        )}

        {d.editingAsset && (
          <AssetEditDialog
            asset={d.editingAsset}
            onChange={d.setEditingAsset}
            onSubmit={d.saveChanges}
            onClose={() => d.setEditingAsset(null)}
          />
        )}
      </div>
  );
}
