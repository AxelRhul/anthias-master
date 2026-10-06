export const ROLES = ["PENDING", "USER", "ADMIN", "SUPER_ADMIN"] as const;
export type Role = (typeof ROLES)[number];

// SUPER_ADMIN is never assignable from the UI/API: it only exists through scripts/create-user.ts
export const ASSIGNABLE_ROLES: Role[] = ["PENDING", "USER", "ADMIN"];

export const isAdminRole = (role?: string | null) => role === "ADMIN" || role === "SUPER_ADMIN";
export const isSuperAdmin = (role?: string | null) => role === "SUPER_ADMIN";

// Only the SUPER_ADMIN deletes accounts, never its own and never another SUPER_ADMIN
export function canDeleteUser(actorId: string | undefined, actorRole: string | undefined, target: { id: string; role: string }) {
    if (!isSuperAdmin(actorRole)) return false;
    if (target.id === actorId) return false;
    if (isSuperAdmin(target.role)) return false;
    return true;
}

export function canModifyUser(actorId: string | undefined, actorRole: string | undefined, target: { id: string; role: string }) {
    if (!isAdminRole(actorRole)) return false;
    if (target.id === actorId) return false;
    if (isSuperAdmin(target.role)) return false;
    if (target.role === "ADMIN" && !isSuperAdmin(actorRole)) return false;
    return true;
}
