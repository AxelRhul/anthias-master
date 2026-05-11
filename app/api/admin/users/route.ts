import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

const VALID_ROLES = ["PENDING", "USER", "ADMIN"];

async function requireAdmin() {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "ADMIN") return null;
    return session;
}

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
    if (!(await requireAdmin())) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const { id, role } = await req.json();
    if (!id || !VALID_ROLES.includes(role)) {
        return NextResponse.json({ error: "invalid_params" }, { status: 400 });
    }
    const user = await prisma.user.update({
        where: { id },
        data: { role },
        select: { id: true, name: true, email: true, role: true },
    });
    return NextResponse.json(user);
}
