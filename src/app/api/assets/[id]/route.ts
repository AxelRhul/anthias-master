import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidAssetId } from '@/lib/validate';
import { deleteAssetsEverywhere } from '@/lib/anthias-delete';
import { requireUser, unauthorized } from '@/lib/require-user';
import { anthias } from '@/lib/anthias';

const formatAnthiasDate = (d: string) => {
    try {
        return new Date(d).toISOString().split('.')[0] + 'Z';
    } catch {
        return new Date().toISOString().split('.')[0] + 'Z';
    }
};

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!(await requireUser())) return unauthorized();
    const { id } = await params;
    if (!isValidAssetId(id)) {
        return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }

    const screens = await prisma.screen.findMany({ orderBy: { id: 'asc' } });
    if (screens.length === 0) return NextResponse.json({ error: "no_screen" }, { status: 404 });

    let name: string;
    try {
        const res = await anthias.get(`http://${screens[0].ip.trim()}/api/v2/assets/${id}`, { timeout: 5000 });
        name = res.data.name;
    } catch {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const result = await deleteAssetsEverywhere(screens, [{ asset_id: id, name }]);
    return NextResponse.json(result);
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!(await requireUser())) return unauthorized();
    const { id } = await params;
    if (!isValidAssetId(id)) {
        return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }

    const screens = await prisma.screen.findMany();
    if (screens.length === 0) return NextResponse.json({ error: "no_screen" }, { status: 404 });

    try {
        const res = await anthias.get(`http://${screens[0].ip.trim()}/api/v2/assets/${id}/content`, { timeout: 10000 });
        return NextResponse.json(res.data);
    } catch {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!(await requireUser())) return unauthorized();
    const { id } = await params;
    if (!isValidAssetId(id)) {
        return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }

    const body = await req.json();
    const screens = await prisma.screen.findMany();

    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 255) : '';
    const duration = parseInt(body.duration, 10);
    const play_order = parseInt(body.play_order, 10);

    if (!name) return NextResponse.json({ error: "name_required" }, { status: 400 });
    if (isNaN(duration) || duration < 1) return NextResponse.json({ error: "invalid_duration" }, { status: 400 });

    const payload = {
        name,
        duration,
        is_enabled: Boolean(body.is_enabled),
        start_date: formatAnthiasDate(body.start_date),
        end_date: formatAnthiasDate(body.end_date),
        play_order: isNaN(play_order) ? 0 : play_order,
    };

    const results = await Promise.all(screens.map(async (screen) => {
        try {
            await anthias.put(`http://${screen.ip}/api/v2/assets/${id}`, payload, { timeout: 5000 });
            return { ip: screen.ip, status: "OK" };
        } catch {
            return { ip: screen.ip, status: "ERROR" };
        }
    }));

    return NextResponse.json(results);
}
