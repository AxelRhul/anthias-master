import { NextResponse } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';
import { prisma } from '@/lib/prisma';
import { EXT_MIME, extOf } from '@/lib/mime';

const toAnthiasDate = (d: string) => new Date(d).toISOString().split('.')[0] + 'Z';

const listAssets = async (ip: string): Promise<any[]> => {
    const res = await axios.get(`http://${ip}/api/v2/assets`, { timeout: 5000 });
    return Array.isArray(res.data) ? res.data : [];
};

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

    const target = await prisma.screen.findUnique({ where: { id: numId } });
    if (!target) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const others = await prisma.screen.findMany({ where: { id: { not: numId } }, orderBy: { id: 'asc' } });

    let source: { ip: string; assets: any[] } | null = null;
    for (const s of others) {
        try {
            source = { ip: s.ip.trim(), assets: await listAssets(s.ip.trim()) };
            break;
        } catch { /* try next screen */ }
    }
    if (!source) return NextResponse.json({ error: "no_source" }, { status: 409 });

    const targetIp = target.ip.trim();
    let existing: any[];
    try {
        existing = await listAssets(targetIp);
    } catch {
        return NextResponse.json({ error: "target_unreachable" }, { status: 502 });
    }

    const existingNames = new Set(existing.map(a => a.name));
    const missing = source.assets.filter(a => !existingNames.has(a.name));

    let copied = 0;
    let failed = 0;
    for (const asset of missing) {
        try {
            const content = await axios.get(`http://${source.ip}/api/v2/assets/${asset.asset_id}/content`, {
                timeout: 120000,
                maxContentLength: Infinity,
            });
            if (!content.data?.content) throw new Error('no_content');

            const ext = extOf(asset.uri);
            const mime = EXT_MIME[ext] ?? asset.mimetype ?? 'application/octet-stream';
            const safeName = String(asset.name).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 150) || 'asset';
            const filename = ext ? `${safeName}.${ext}` : safeName;

            const form = new FormData();
            form.append('file_upload', Buffer.from(content.data.content, 'base64'), {
                filename,
                contentType: mime,
            });
            const fileRes = await axios.post(`http://${targetIp}/api/v2/file_asset`, form, {
                headers: form.getHeaders(),
                timeout: 120000,
                maxBodyLength: Infinity,
            });

            await axios.post(`http://${targetIp}/api/v2/assets`, {
                ext: fileRes.data.ext,
                name: asset.name,
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
        } catch (err: any) {
            failed++;
            console.error(`[sync] ${asset.name} -> ${targetIp}:`, err.response?.data || err.message);
        }
    }

    return NextResponse.json({ copied, failed, skipped: source.assets.length - missing.length });
}
