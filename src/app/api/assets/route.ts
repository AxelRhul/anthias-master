import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteAssetsEverywhere } from '@/features/assets/delete-everywhere';
import { requireUser, unauthorized } from '@/features/auth/require-user';
import { anthiasFor } from '@/lib/anthias';
import type { Asset } from '@/features/assets/types';

export async function GET() {
    if (!(await requireUser())) return unauthorized();
    const screens = await prisma.screen.findMany({ orderBy: { id: 'asc' } });
    if (screens.length === 0 || !screens[0].ip) return NextResponse.json([]);

    try {
        const res = await anthiasFor(screens[0]).get('/assets', { timeout: 4000 });
        return NextResponse.json(res.data);
    } catch {
        return NextResponse.json({ error: "Impossible de lister" }, { status: 500 });
    }
}

// Deletes every disabled (OFF) asset shown in the library, on all screens.
export async function DELETE() {
    if (!(await requireUser())) return unauthorized();
    const screens = await prisma.screen.findMany({ orderBy: { id: 'asc' } });
    if (screens.length === 0) return NextResponse.json({ error: "no_screen" }, { status: 404 });

    let disabled: Asset[];
    try {
        const res = await anthiasFor(screens[0]).get('/assets', { timeout: 5000 });
        const assets: Asset[] = Array.isArray(res.data) ? res.data : [];
        disabled = assets.filter(a => !a.is_enabled);
    } catch {
        return NextResponse.json({ error: "source_unreachable" }, { status: 502 });
    }

    if (disabled.length === 0) return NextResponse.json({ deleted: 0, failed: 0 });

    const result = await deleteAssetsEverywhere(screens, disabled);
    return NextResponse.json(result);
}
