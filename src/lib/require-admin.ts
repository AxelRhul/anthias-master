import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { isAdminRole } from "@/lib/roles";

export async function requireAdmin() {
    const session = await getServerSession(authOptions);
    if (!isAdminRole(session?.user?.role)) return null;
    return session;
}
