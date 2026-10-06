"use client";
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

const locales = ['fr', 'en'] as const;

function setLocaleCookie(locale: string) {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Strict`;
}

export const LocaleSwitcher = () => {
    const locale = useLocale();
    const router = useRouter();

    const switchLocale = (next: string) => {
        setLocaleCookie(next);
        router.refresh();
    };

    return (
        <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
            {locales.map((l) => (
                <button
                    key={l}
                    onClick={() => switchLocale(l)}
                    className={`px-3 py-1 rounded-lg text-sm font-bold uppercase transition ${
                        l === locale
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:text-white'
                    }`}
                >
                    {l}
                </button>
            ))}
        </div>
    );
};
