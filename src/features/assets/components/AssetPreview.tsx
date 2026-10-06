import { useTranslations } from 'next-intl';

type AssetPreviewProps = {
    name: string;
    mimetype: string;
    objectUrl: string;
    onClose: () => void;
};

export const AssetPreview = ({ name, mimetype, objectUrl, onClose }: AssetPreviewProps) => {
    const t = useTranslations('modals');
    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-12" onClick={onClose}>
            <div className="relative max-w-5xl w-full flex flex-col items-center">
                <h3 className="text-2xl font-bold mb-4">{name}</h3>
                {mimetype.startsWith('video/') ? (
                    <video
                        src={objectUrl}
                        controls
                        autoPlay
                        className="max-w-full max-h-[75vh] rounded-xl shadow-2xl border-2 border-slate-800"
                        onClick={e => e.stopPropagation()}
                    />
                ) : (
                    // eslint-disable-next-line @next/next/no-img-element -- blob: URL of an uploaded file, next/image cannot optimize it
                    <img src={objectUrl} alt={name} className="max-w-full max-h-[75vh] rounded-xl shadow-2xl border-2 border-slate-800" />
                )}
                <p className="mt-6 text-slate-500 italic">{t('closeHint')}</p>
            </div>
        </div>
    );
};
