import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth-options";
import { isAdminRole } from "@/features/auth/roles";

export async function requireAdmin() {
    const session = await getServerSession(authOptions);
    if (!isAdminRole(session?.user?.role)) return null;
    return session;
}
