import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireSuperAdmin } from '@/features/auth/require-admin';
import { toPublicScreen } from '@/features/screens/public-screen';
import { errorCode } from '@/lib/errors';

const MAX_LABEL_LENGTH = 100;

// Renames a device. Reserved to the SUPER_ADMIN.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!(await requireSuperAdmin())) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const numId = parseInt((await params).id, 10);
    if (isNaN(numId)) {
        return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }

    let body: { label?: unknown };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    const label = typeof body.label === 'string' ? body.label.trim() : '';
    if (!label) return NextResponse.json({ error: "label_required" }, { status: 400 });
    if (label.length > MAX_LABEL_LENGTH) return NextResponse.json({ error: "label_too_long" }, { status: 400 });

    try {
        const updated = await prisma.screen.update({ where: { id: numId }, data: { label } });
        return NextResponse.json(toPublicScreen(updated, true));
    } catch (err) {
        if (errorCode(err) === 'P2025') {
            return NextResponse.json({ error: "not_found" }, { status: 404 });
        }
        return NextResponse.json({ error: "db_error" }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!(await requireAdmin())) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
        return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }

    try {
        await prisma.screen.delete({ where: { id: numId } });
        return NextResponse.json({ success: true });
    } catch (err) {
        if (errorCode(err) === 'P2025') {
            return NextResponse.json({ error: "not_found" }, { status: 404 });
        }
        return NextResponse.json({ error: "db_error" }, { status: 500 });
    }
}
