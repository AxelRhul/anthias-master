import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft, BookOpen, Lightbulb } from 'lucide-react';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { GuideImage } from '@/features/guide/components/GuideImage';
import { GUIDE_SECTIONS } from '@/features/guide/sections';

type FaqItem = { q: string; a: string };

export default async function GuidePage() {
    const t = await getTranslations('Guide');

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="sticky top-0 z-40 flex flex-wrap justify-between items-center gap-4 border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm py-4">
                    <div>
                        <h1 className="text-3xl font-black text-blue-500 flex items-center gap-3 italic">
                            <BookOpen size={32} /> {t('title')}
                        </h1>
                        <p className="text-slate-400 mt-2">{t('subtitle')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <LocaleSwitcher />
                        <Link href="/" className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 transition">
                            <ArrowLeft size={18} /> {t('back')}
                        </Link>
                    </div>
                </header>

                <div className="grid grid-cols-12 gap-8">
                    <nav className="col-span-12 lg:col-span-3 lg:sticky lg:top-36 lg:self-start bg-slate-900 border border-slate-800 rounded-3xl p-6">
                        <h2 className="text-xs font-black uppercase text-slate-500 mb-3">{t('toc')}</h2>
                        <ul className="space-y-2">
                            {GUIDE_SECTIONS.map(section => (
                                <li key={section.id}>
                                    <a href={`#${section.id}`} className="text-slate-300 hover:text-blue-400 transition">
                                        {t(`sections.${section.id}.title`)}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <main className="col-span-12 lg:col-span-9 space-y-8">
                        {GUIDE_SECTIONS.map(section => {
                            const base = `sections.${section.id}`;
                            const intro = t(`${base}.intro`);
                            const steps = t.has(`${base}.steps`) ? (t.raw(`${base}.steps`) as string[]) : [];
                            const faq = t.has(`${base}.items`) ? (t.raw(`${base}.items`) as FaqItem[]) : [];

                            return (
                                <section key={section.id} id={section.id} className="scroll-mt-36 bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-5">
                                    <h2 className="text-2xl font-bold text-emerald-400 flex flex-wrap items-center gap-3">
                                        {t(`${base}.title`)}
                                        {section.adminOnly && (
                                            <span className="text-[10px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-3 py-1">
                                                {t('adminBadge')}
                                            </span>
                                        )}
                                    </h2>

                                    {intro && <p className="text-slate-300">{intro}</p>}

                                    {steps.length > 0 && (
                                        <ol className="list-decimal pl-6 space-y-2 text-slate-300 marker:text-slate-500">
                                            {steps.map(step => <li key={step}>{step}</li>)}
                                        </ol>
                                    )}

                                    {faq.length > 0 && (
                                        <dl className="space-y-4">
                                            {faq.map(item => (
                                                <div key={item.q}>
                                                    <dt className="font-bold text-slate-100">{item.q}</dt>
                                                    <dd className="text-slate-400 mt-1">{item.a}</dd>
                                                </div>
                                            ))}
                                        </dl>
                                    )}

                                    {t.has(`${base}.tip`) && (
                                        <p className="flex gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-200 rounded-xl p-4 text-sm">
                                            <Lightbulb size={18} className="shrink-0 mt-0.5" />
                                            {t(`${base}.tip`)}
                                        </p>
                                    )}

                                    {section.images.length > 0 && (
                                        <div className="space-y-4">
                                            {section.images.map(image => (
                                                <GuideImage
                                                    key={image.file}
                                                    file={image.file}
                                                    caption={t(`${base}.images.${image.key}`)}
                                                    missingLabel={t('missingCapture')}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </section>
                            );
                        })}
                    </main>
                </div>
            </div>
        </div>
    );
}
