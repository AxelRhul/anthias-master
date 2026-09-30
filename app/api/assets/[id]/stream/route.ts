import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidAssetId } from '@/lib/validate';
import { EXT_MIME } from '@/lib/mime';

function resolveMime(raw: string, uriExt: string): string {
    if (raw && raw !== 'application/octet-stream' && raw.includes('/')) return raw;
    return EXT_MIME[uriExt] || raw || 'application/octet-stream';
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!isValidAssetId(id)) {
        return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }

    const screens = await prisma.screen.findMany();
    if (screens.length === 0) return NextResponse.json({ error: "no_screen" }, { status: 404 });

    const base = `http://${screens[0].ip.trim()}/api/v2/assets`;

    const [metaRes, contentRes] = await Promise.all([
        fetch(`${base}/${id}`),
        fetch(`${base}/${id}/content`),
    ]);
    if (!contentRes.ok) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const data = await contentRes.json();
    if (!data.content) return NextResponse.json({ error: "no_content" }, { status: 404 });

    const binary = Buffer.from(data.content, 'base64');

    let uriExt = '';
    if (metaRes.ok) {
        const meta = await metaRes.json();
        uriExt = (meta.uri as string | undefined)?.split('.').pop()?.toLowerCase() ?? '';
    }

    const mimeType = resolveMime(data.mimetype ?? '', uriExt);

    return new NextResponse(binary, {
        headers: {
            'Content-Type': mimeType,
            'Cache-Control': 'private, max-age=60',
        },
    });
}
