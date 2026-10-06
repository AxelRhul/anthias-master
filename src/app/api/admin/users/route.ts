import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/features/auth/require-admin";
import { ASSIGNABLE_ROLES, canModifyUser } from "@/features/auth/roles";

export async function GET() {
    if (!(await requireAdmin())) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
}

export async function PATCH(req: Request) {
    const session = await requireAdmin();
    if (!session) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const { id, role } = await req.json();
    if (!id || !(ASSIGNABLE_ROLES as string[]).includes(role)) {
        return NextResponse.json({ error: "invalid_params" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!target) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const actor = session.user;
    if (target.id === actor.id) {
        return NextResponse.json({ error: "cannot_change_own_role" }, { status: 400 });
    }
    if (!canModifyUser(actor.id, actor.role, target)) {
        return NextResponse.json({ error: "forbidden_target" }, { status: 403 });
    }

    const user = await prisma.user.update({
        where: { id },
        data: { role },
        select: { id: true, name: true, email: true, role: true },
    });
    return NextResponse.json(user);
}
