"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import { Minus, Plus, RotateCcw, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

const MIN_SCALE = 1;
const MAX_SCALE = 8;
const BUTTON_FACTOR = 1.4;
const WHEEL_FACTOR = 1.15;
const DOUBLE_CLICK_SCALE = 2.5;
const DRAG_THRESHOLD_PX = 4;

type View = { scale: number; x: number; y: number };
type ZoomableImageProps = { src: string; alt: string; caption: string };

const clampScale = (scale: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));

// Screenshot of the guide: click to open it full screen, then zoom and move around inside it.
export function ZoomableImage({ src, alt, caption }: ZoomableImageProps) {
    const t = useTranslations('Guide');
    const [open, setOpen] = useState(false);

    return (
        <>
            <figure className="space-y-2">
                <button type="button" onClick={() => setOpen(true)} title={t('openImage')} aria-label={t('openImage')} className="block w-full cursor-zoom-in">
                    {/* eslint-disable-next-line @next/next/no-img-element -- static documentation screenshot of unknown size */}
                    <img src={src} alt={alt} className="w-full rounded-xl border border-slate-800 hover:border-blue-500/60 transition" />
                </button>
                <figcaption className="text-sm text-slate-500 italic">{caption}</figcaption>
            </figure>
            {open && <Lightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
        </>
    );
}

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
    const t = useTranslations('Guide');
    const [view, setView] = useState<View>({ scale: 1, x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const stageRef = useRef<HTMLDivElement>(null);
    const pointers = useRef(new Map<number, { x: number; y: number }>());
    const drag = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
    const pinch = useRef<{ distance: number; scale: number } | null>(null);
    const moved = useRef(false);
    const startedOnBackdrop = useRef(false);

    // Changes the scale while keeping the point (cx, cy), relative to the stage center, under the cursor
    const zoom = useCallback((next: (scale: number) => number, cx: number, cy: number) => {
        setView(v => {
            const scale = clampScale(next(v.scale));
            if (scale === MIN_SCALE) return { scale, x: 0, y: 0 };
            const ratio = scale / v.scale;
            return { scale, x: cx - (cx - v.x) * ratio, y: cy - (cy - v.y) * ratio };
        });
    }, []);

    const reset = useCallback(() => setView({ scale: 1, x: 0, y: 0 }), []);

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            else if (e.key === '+' || e.key === '=') zoom(s => s * BUTTON_FACTOR, 0, 0);
            else if (e.key === '-') zoom(s => s / BUTTON_FACTOR, 0, 0);
            else if (e.key === '0') reset();
        };
        window.addEventListener('keydown', onKey);

        // Native listener: React registers wheel handlers as passive, which cannot cancel the page scroll
        const stage = stageRef.current;
        const onWheel = (e: WheelEvent) => {
            if (!stage) return;
            e.preventDefault();
            const rect = stage.getBoundingClientRect();
            const cx = e.clientX - (rect.left + rect.width / 2);
            const cy = e.clientY - (rect.top + rect.height / 2);
            zoom(s => s * (e.deltaY < 0 ? WHEEL_FACTOR : 1 / WHEEL_FACTOR), cx, cy);
        };
        stage?.addEventListener('wheel', onWheel, { passive: false });

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', onKey);
            stage?.removeEventListener('wheel', onWheel);
        };
    }, [onClose, zoom, reset]);

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        moved.current = false;
        startedOnBackdrop.current = e.target === e.currentTarget;

        if (pointers.current.size === 2) {
            const [a, b] = [...pointers.current.values()];
            pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale: view.scale };
            drag.current = null;
        } else {
            drag.current = { startX: e.clientX, startY: e.clientY, originX: view.x, originY: view.y };
            setDragging(true);
        }
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!pointers.current.has(e.pointerId)) return;
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (pinch.current && pointers.current.size === 2) {
            const [a, b] = [...pointers.current.values()];
            const distance = Math.hypot(a.x - b.x, a.y - b.y);
            const rect = e.currentTarget.getBoundingClientRect();
            const cx = (a.x + b.x) / 2 - (rect.left + rect.width / 2);
            const cy = (a.y + b.y) / 2 - (rect.top + rect.height / 2);
            const target = pinch.current.scale * (distance / pinch.current.distance);
            zoom(() => target, cx, cy);
            moved.current = true;
        } else if (drag.current) {
            const dx = e.clientX - drag.current.startX;
            const dy = e.clientY - drag.current.startY;
            if (Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) moved.current = true;
            const { originX, originY } = drag.current;
            setView(v => (v.scale > MIN_SCALE ? { ...v, x: originX + dx, y: originY + dy } : v));
        }
    };

    const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
        pointers.current.delete(e.pointerId);
        pinch.current = null;
        if (pointers.current.size === 0) {
            drag.current = null;
            setDragging(false);
        }
    };

    // Clicking the dark background closes the viewer, unless the click ended a drag. The pointer is
    // captured by the stage, so the click target is always the stage: what matters is where it started.
    const onBackdropClick = () => {
        if (startedOnBackdrop.current && !moved.current) onClose();
    };

    const onDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (startedOnBackdrop.current) return;
        const rect = stageRef.current?.getBoundingClientRect();
        if (!rect) return;
        const cx = e.clientX - (rect.left + rect.width / 2);
        const cy = e.clientY - (rect.top + rect.height / 2);
        zoom(s => (s > MIN_SCALE ? MIN_SCALE : DOUBLE_CLICK_SCALE), cx, cy);
    };

    const controlClass = 'bg-slate-800/90 hover:bg-slate-700 text-slate-100 w-10 h-10 rounded-xl flex items-center justify-center transition';

    return (
        <div role="dialog" aria-modal="true" aria-label={alt} className="fixed inset-0 z-50 bg-black/90">
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <span className="text-slate-300 text-sm tabular-nums px-2">{Math.round(view.scale * 100)}%</span>
                <button type="button" onClick={() => zoom(s => s / BUTTON_FACTOR, 0, 0)} title={t('zoomOut')} aria-label={t('zoomOut')} className={controlClass}><Minus size={18} /></button>
                <button type="button" onClick={() => zoom(s => s * BUTTON_FACTOR, 0, 0)} title={t('zoomIn')} aria-label={t('zoomIn')} className={controlClass}><Plus size={18} /></button>
                <button type="button" onClick={reset} title={t('zoomReset')} aria-label={t('zoomReset')} className={controlClass}><RotateCcw size={18} /></button>
                <button type="button" onClick={onClose} title={t('closeImage')} aria-label={t('closeImage')} className={controlClass}><X size={18} /></button>
            </div>

            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-xs text-slate-400 bg-black/50 rounded-full px-4 py-1.5 pointer-events-none">
                {t('zoomHint')}
            </p>

            <div
                ref={stageRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerEnd}
                onPointerCancel={onPointerEnd}
                onClick={onBackdropClick}
                onDoubleClick={onDoubleClick}
                className="absolute inset-0 flex items-center justify-center overflow-hidden"
                style={{ touchAction: 'none' }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element -- static documentation screenshot of unknown size */}
                <img
                    src={src}
                    alt={alt}
                    draggable={false}
                    className="max-w-[95vw] max-h-[88vh] object-contain select-none rounded-lg"
                    style={{
                        transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
                        cursor: view.scale > MIN_SCALE ? (dragging ? 'grabbing' : 'grab') : 'zoom-in',
                        transition: dragging ? 'none' : 'transform 0.12s ease-out',
                    }}
                />
            </div>
        </div>
    );
}
