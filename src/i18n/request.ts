import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

const locales = ['fr', 'en'] as const;
type Locale = (typeof locales)[number];

function isValidLocale(l: string | undefined): l is Locale {
    return locales.includes(l as Locale);
}

export default getRequestConfig(async () => {
    const cookieStore = await cookies();
    const raw = cookieStore.get('NEXT_LOCALE')?.value;
    const locale: Locale = isValidLocale(raw) ? raw : 'fr';

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default
    };
});