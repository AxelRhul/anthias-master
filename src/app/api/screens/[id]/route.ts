import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/features/auth/require-admin';
import { errorCode } from '@/lib/errors';

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
