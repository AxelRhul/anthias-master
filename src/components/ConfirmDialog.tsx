type ConfirmDialogProps = {
    title: string;
    message: string;
    cancelLabel: string;
    confirmLabel: string;
    onCancel: () => void;
    onConfirm: () => void;
};

export const ConfirmDialog = ({ title, message, cancelLabel, confirmLabel, onCancel, onConfirm }: ConfirmDialogProps) => (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" onClick={onCancel}>
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md space-y-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-rose-400">{title}</h2>
            <p className="text-slate-300">{message}</p>
            <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold transition">{cancelLabel}</button>
                <button onClick={onConfirm} className="flex-1 bg-rose-600 hover:bg-rose-500 py-3 rounded-xl font-black transition">{confirmLabel}</button>
            </div>
        </div>
    </div>
);
