import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/features/auth/require-admin";
import { canDeleteUser } from "@/features/auth/roles";

// Deletes an account and its sign-in data. Reserved to the SUPER_ADMIN.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await requireSuperAdmin();
    if (!session) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { id } = await params;
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id)) {
        return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!target) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (target.id === session.user.id) {
        return NextResponse.json({ error: "cannot_delete_self" }, { status: 400 });
    }
    if (!canDeleteUser(session.user.id, session.user.role, target)) {
        return NextResponse.json({ error: "forbidden_target" }, { status: 403 });
    }

    // Linked accounts and sessions are removed explicitly instead of relying on SQLite foreign keys
    await prisma.$transaction([
        prisma.account.deleteMany({ where: { userId: id } }),
        prisma.session.deleteMany({ where: { userId: id } }),
        prisma.user.delete({ where: { id } }),
    ]);
    return NextResponse.json({ success: true });
}
