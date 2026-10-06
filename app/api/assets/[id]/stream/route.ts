import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidAssetId } from '@/lib/validate';
import { sniffMime } from '@/lib/mime';
import { requireUser, unauthorized } from '@/lib/require-user';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!(await requireUser())) return unauthorized();
    const { id } = await params;
    if (!isValidAssetId(id)) {
        return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }

    const screens = await prisma.screen.findMany({ orderBy: { id: 'asc' } });
    if (screens.length === 0) return NextResponse.json({ error: "no_screen" }, { status: 404 });

    const contentRes = await fetch(`http://${screens[0].ip.trim()}/api/v2/assets/${id}/content`);
    if (!contentRes.ok) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const data = await contentRes.json();
    if (!data.content) return NextResponse.json({ error: "no_content" }, { status: 404 });

    const binary = Buffer.from(data.content, 'base64');

    // The type comes from the file signature, never from what was stored. Anything that is not a known
    // image/video (SVG, HTML...) is only offered as a download, so it can never run in the app's origin.
    const mimeType = sniffMime(binary);

    return new NextResponse(binary, {
        headers: {
            'Content-Type': mimeType ?? 'application/octet-stream',
            'Content-Disposition': mimeType ? 'inline' : 'attachment',
            'X-Content-Type-Options': 'nosniff',
            'Content-Security-Policy': "default-src 'none'; sandbox",
            'Cache-Control': 'private, max-age=60',
        },
    });
}
