import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { isAdminRole } from "@/lib/roles";

// Reads the role from the database (via the jwt callback), so a revoked user is rejected immediately.
export async function requireUser() {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (role === "USER" || isAdminRole(role)) return session;
    return null;
}

export const unauthorized = () => NextResponse.json({ error: "unauthorized" }, { status: 401 });
