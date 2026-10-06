import { existsSync } from 'node:fs';
import path from 'node:path';

type GuideImageProps = {
    file: string;
    caption: string;
    missingLabel: string;
};

// Screenshots are plain files in public/images/guide/. A missing file shows nothing in production, and a
// dashed placeholder naming the expected file in development, so the guide never displays a broken image.
export function GuideImage({ file, caption, missingLabel }: GuideImageProps) {
    const exists = existsSync(path.join(process.cwd(), 'public', 'images', 'guide', file));

    if (!exists) {
        if (process.env.NODE_ENV === 'production') return null;
        return (
            <div className="rounded-xl border-2 border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">
                {missingLabel} : <code className="text-slate-300">public/images/guide/{file}</code>
                <p className="mt-1 italic">{caption}</p>
            </div>
        );
    }

    return (
        <figure className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- static documentation screenshot of unknown size */}
            <img src={`/images/guide/${file}`} alt={caption} className="w-full rounded-xl border border-slate-800" />
            <figcaption className="text-sm text-slate-500 italic">{caption}</figcaption>
        </figure>
    );
}
