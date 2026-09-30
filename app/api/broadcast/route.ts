import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';
import FormData from 'form-data';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

const ALLOWED_MIME_PREFIXES = ['image/', 'video/'];

const formatAnthiasDate = (d: any) => {
    try {
        const date = d ? new Date(d) : new Date();
        return date.toISOString().split('.')[0] + 'Z';
    } catch {
        return new Date().toISOString().split('.')[0] + 'Z';
    }
};

export async function POST(req: Request) {
    try {
        const data = await req.formData();
        const file = data.get('file') as File;
        if (!file) return NextResponse.json({ error: "no_file" }, { status: 400 });

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "file_too_large" }, { status: 413 });
        }

        const mimeType = file.type || '';
        if (!ALLOWED_MIME_PREFIXES.some(prefix => mimeType.startsWith(prefix))) {
            return NextResponse.json({ error: "invalid_file_type" }, { status: 415 });
        }

        const rawName = data.get('name') as string;
        const name = (rawName?.trim().slice(0, 255)) || file.name.slice(0, 255);
        const isVideo = mimeType.startsWith('video/');
        const duration = isVideo ? 0 : (Math.floor(Number(data.get('duration'))) || 10);
        const play_order = Math.floor(Number(data.get('play_order'))) || 0;
        const start_date = data.get('start_date') as string;
        const end_date = data.get('end_date') as string;

        // Sanitize filename: keep only safe characters
        const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);

        const screens = await prisma.screen.findMany();
        if (screens.length === 0) {
            return NextResponse.json({ error: "no_screens" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        const results = [];
        for (const screen of screens) {
            try {
                const baseUrl = `http://${screen.ip.trim()}/api/v2`;

                const form = new FormData();
                form.append('file_upload', buffer, {
                    filename: safeFilename,
                    contentType: mimeType,
                });

                const fileRes = await axios.post(`${baseUrl}/file_asset`, form, {
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

                await axios.post(`${baseUrl}/assets`, assetPayload, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000,
                });

                results.push({ ip: screen.ip, status: 'OK' });
            } catch (err: any) {
                console.error(`[ERR] ${screen.ip}:`, err.response?.data || err.message);
                results.push({ ip: screen.ip, status: 'ERROR' });
            }
        }
        return NextResponse.json(results);
    } catch {
        return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
}
