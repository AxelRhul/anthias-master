"use client";
import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface ToastProps {
    message: string;
    onClose: () => void;
}

export const Toast = ({ message, onClose }: ToastProps) => {
    useEffect(() => {
        const t = setTimeout(onClose, 3500);
        return () => clearTimeout(t);
    }, [onClose]);

    return (
        <div className="toast-enter fixed bottom-8 left-1/2 z-50 flex items-center gap-3 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl">
            <CheckCircle size={22} />
            <span className="font-bold text-base">{message}</span>
        </div>
    );
};
