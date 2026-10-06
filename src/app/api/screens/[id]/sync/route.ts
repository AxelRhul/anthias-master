import { NextResponse } from 'next/server';
import { anthiasFor } from '@/lib/anthias';
import FormData from 'form-data';
import { prisma } from '@/lib/prisma';
import { MIME_EXT, sniffMime } from '@/features/assets/mime';
import { requireUser, unauthorized } from '@/features/auth/require-user';
import { errorDetail, errorStatus } from '@/lib/errors';
import { managedNames, normalizeName } from '@/features/assets/managed';
import type { Asset } from '@/features/assets/types';

// A 100 MB file is ~134 MB once base64-encoded by Anthias; anything larger is refused instead of buffered
const MAX_CONTENT_BYTES = 150 * 1024 * 1024;

const toAnthiasDate = (d: string) => new Date(d).toISOString().split('.')[0] + 'Z';

const listAssets = async (client: ReturnType<typeof anthiasFor>): Promise<Asset[]> => {
    const res = await client.get('/assets', { timeout: 5000 });
    return Array.isArray(res.data) ? res.data : [];
};

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!(await requireUser())) return unauthorized();
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

    const target = await prisma.screen.findUnique({ where: { id: numId } });
    if (!target) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const others = await prisma.screen.findMany({ where: { id: { not: numId } }, orderBy: { id: 'asc' } });

    let source: { client: ReturnType<typeof anthiasFor>; assets: Asset[] } | null = null;
    for (const s of others) {
        try {
            const client = anthiasFor(s);
            source = { client, assets: await listAssets(client) };
            break;
        } catch { /* try next screen */ }
    }
    if (!source) return NextResponse.json({ error: "no_source" }, { status: 409 });

    const targetIp = target.ip.trim();
    const targetClient = anthiasFor(target);
    let existing: Asset[];
    try {
        existing = await listAssets(targetClient);
    } catch (err) {
        const status = errorStatus(err);
        const authFailed = status === 401 || status === 403;
        return NextResponse.json({ error: authFailed ? "target_auth_failed" : "target_unreachable" }, { status: 502 });
    }

    // Only the media managed by the app are copied: one added directly on a device through its own
    // interface stays on that device.
    const managed = await managedNames();
    const syncable = source.assets.filter(a => managed.has(normalizeName(a.name)));
    const existingNames = new Set(existing.map(a => normalizeName(a.name)));
    const missing = syncable.filter(a => !existingNames.has(normalizeName(a.name)));

    let copied = 0;
    let failed = 0;
    for (const asset of missing) {
        try {
            const content = await source.client.get(`/assets/${asset.asset_id}/content`, {
                timeout: 120000,
                maxContentLength: MAX_CONTENT_BYTES,
            });
            if (!content.data?.content) throw new Error('no_content');

            const buffer = Buffer.from(content.data.content, 'base64');
            const mime = sniffMime(buffer);
            if (!mime) throw new Error('unsupported_file_type');
            const plainName = normalizeName(asset.name);
            const safeName = plainName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 150) || 'asset';
            const filename = `${safeName}.${MIME_EXT[mime]}`;

            const form = new FormData();
            form.append('file_upload', buffer, {
                filename,
                contentType: mime,
            });
            const fileRes = await targetClient.post('/file_asset', form, {
                headers: form.getHeaders(),
                timeout: 120000,
                maxBodyLength: MAX_CONTENT_BYTES,
            });

            await targetClient.post('/assets', {
                ext: fileRes.data.ext,
                name: plainName,
                uri: fileRes.data.uri,
                start_date: toAnthiasDate(asset.start_date),
                end_date: toAnthiasDate(asset.end_date),
                duration: mime.startsWith('video/') ? 0 : asset.duration,
                mimetype: mime,
                is_enabled: asset.is_enabled,
                is_processing: false,
                nocache: asset.nocache ?? false,
                play_order: asset.play_order ?? 0,
                skip_asset_check: true,
            }, { headers: { 'Content-Type': 'application/json' }, timeout: 10000 });

            copied++;
        } catch (err) {
            failed++;
            console.error(`[sync] ${asset.name} -> ${targetIp}:`, errorDetail(err));
        }
    }

    return NextResponse.json({
        copied,
        failed,
        skipped: syncable.length - missing.length,
        ignored: source.assets.length - syncable.length,
    });
}
