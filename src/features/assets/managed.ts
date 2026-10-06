import { prisma } from '@/lib/prisma';

// Anthias returns asset names HTML-escaped ("d&#39;écran"). Names are compared in their plain form.
export function normalizeName(name: string): string {
    return name
        .replace(/&#39;|&#x27;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .trim();
}

export async function managedNames(): Promise<Set<string>> {
    const rows = await prisma.managedAsset.findMany({ select: { name: true } });
    return new Set(rows.map(r => r.name));
}

export async function markManaged(names: string[]) {
    const unique = [...new Set(names.map(normalizeName).filter(Boolean))];
    await prisma.$transaction(
        unique.map(name => prisma.managedAsset.upsert({ where: { name }, create: { name }, update: {} }))
    );
}

export async function unmarkManaged(names: string[]) {
    const unique = [...new Set(names.map(normalizeName))];
    if (unique.length === 0) return;
    await prisma.managedAsset.deleteMany({ where: { name: { in: unique } } });
}

// A managed media keeps being managed after it is renamed from the app
export async function renameManaged(oldName: string, newName: string) {
    const from = normalizeName(oldName);
    const to = normalizeName(newName);
    if (!from || !to || from === to) return;
    const existing = await prisma.managedAsset.findUnique({ where: { name: from } });
    if (!existing) return;
    await prisma.$transaction([
        prisma.managedAsset.delete({ where: { name: from } }),
        prisma.managedAsset.upsert({ where: { name: to }, create: { name: to }, update: {} }),
    ]);
}

// Upgrade path: when nothing is tracked yet, the media already on the reference device are the ones
// that were broadcast before this tracking existed, so they are adopted once.
export async function adoptBaselineIfEmpty(assets: { name: string }[]) {
    if (assets.length === 0) return;
    if ((await prisma.managedAsset.count()) > 0) return;
    await markManaged(assets.map(a => a.name));
}
