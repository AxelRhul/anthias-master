import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { anthias } from '@/lib/anthias';
import FormData from 'form-data';
import { requireUser, unauthorized } from '@/features/auth/require-user';
import { MIME_EXT, sniffMime } from '@/features/assets/mime';
import { errorDetail } from '@/lib/errors';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_FORM_OVERHEAD = 1024 * 1024; // multipart boundaries and the other form fields

const formatAnthiasDate = (d: FormDataEntryValue | null) => {
    try {
        const date = typeof d === 'string' && d ? new Date(d) : new Date();
        return date.toISOString().split('.')[0] + 'Z';
    } catch {
        return new Date().toISOString().split('.')[0] + 'Z';
    }
};

export async function POST(req: Request) {
    if (!(await requireUser())) return unauthorized();

    // Checked before the body is parsed, otherwise the whole upload would already be held in memory
    const declaredLength = Number(req.headers.get('content-length'));
    if (!declaredLength) return NextResponse.json({ error: "length_required" }, { status: 411 });
    if (declaredLength > MAX_FILE_SIZE + MAX_FORM_OVERHEAD) {
        return NextResponse.json({ error: "file_too_large" }, { status: 413 });
    }

    try {
        const data = await req.formData();
        const file = data.get('file');
        if (!(file instanceof File)) return NextResponse.json({ error: "no_file" }, { status: 400 });

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "file_too_large" }, { status: 413 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const mimeType = sniffMime(buffer);
        if (!mimeType) {
            return NextResponse.json({ error: "invalid_file_type" }, { status: 415 });
        }

        const rawName = data.get('name');
        const name = (typeof rawName === 'string' ? rawName.trim().slice(0, 255) : '') || file.name.slice(0, 255);
        const isVideo = mimeType.startsWith('video/');
        const duration = isVideo ? 0 : (Math.floor(Number(data.get('duration'))) || 10);
        const play_order = Math.floor(Number(data.get('play_order'))) || 0;
        const start_date = data.get('start_date');
        const end_date = data.get('end_date');

        // Safe characters only, and the extension always matches the detected type
        const baseName = file.name.replace(/\.[^.]*$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 150) || 'asset';
        const safeFilename = `${baseName}.${MIME_EXT[mimeType]}`;

        const screens = await prisma.screen.findMany();
        if (screens.length === 0) {
            return NextResponse.json({ error: "no_screens" }, { status: 400 });
        }

        const results = [];
        for (const screen of screens) {
            try {
                const baseUrl = `http://${screen.ip.trim()}/api/v2`;

                const form = new FormData();
                form.append('file_upload', buffer, {
                    filename: safeFilename,
                    contentType: mimeType,
                });

                const fileRes = await anthias.post(`${baseUrl}/file_asset`, form, {
                    headers: form.getHeaders(),
                    timeout: 30000,
                });

                const assetPayload = {
                    ext: fileRes.data.ext,
                    name,
                    uri: fileRes.data.uri,
                    start_date: formatAnthiasDate(start_date),
                    end_date: formatAnthiasDate(end_date),
                    duration,
                    mimetype: mimeType,
                    is_enabled: true,
                    is_processing: false,
                    nocache: false,
                    play_order,
                    skip_asset_check: true,
                };

                await anthias.post(`${baseUrl}/assets`, assetPayload, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000,
                });

                results.push({ ip: screen.ip, status: 'OK' });
            } catch (err) {
                console.error(`[ERR] ${screen.ip}:`, errorDetail(err));
                results.push({ ip: screen.ip, status: 'ERROR' });
            }
        }
        return NextResponse.json(results);
    } catch {
        return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
}
