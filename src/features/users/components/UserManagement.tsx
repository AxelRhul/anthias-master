"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CheckCircle, ShieldCheck, Clock, Users, Crown, Trash2 } from "lucide-react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { canDeleteUser, canModifyUser } from "@/features/auth/roles";
import type { AppUser } from "@/features/users/types";

const ROLE_STYLES: Record<string, string> = {
    SUPER_ADMIN: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    ADMIN: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    USER: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    PENDING: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
    SUPER_ADMIN: <Crown size={14} />,
    ADMIN: <ShieldCheck size={14} />,
    USER: <CheckCircle size={14} />,
    PENDING: <Clock size={14} />,
};

export function UserManagement() {
    const { data: session } = useSession();
    const myId = session?.user?.id;
    const myRole = session?.user?.role;
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [toDelete, setToDelete] = useState<AppUser | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        try {
            const res = await fetch("/api/admin/users");
            const data = await res.json().catch(() => null);
            if (res.ok && Array.isArray(data)) setUsers(data);
            else console.error("[admin/users] GET failed", res.status, data);
        } finally {
            setLoading(false);
        }
    };

    const setRole = async (id: string, role: string) => {
        const res = await fetch("/api/admin/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, role }),
        });
        if (!res.ok) console.error("[admin/users] PATCH failed", res.status, await res.json().catch(() => null));
        load();
    };

    const deleteUser = async () => {
        if (!toDelete) return;
        const target = toDelete;
        setToDelete(null);
        const res = await fetch(`/api/admin/users/${target.id}`, { method: "DELETE" });
        if (!res.ok) {
            console.error("[admin/users] DELETE failed", res.status, await res.json().catch(() => null));
            setError("La suppression du compte a échoué.");
        } else {
            setError(null);
        }
        load();
    };

    useEffect(() => { load(); }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <Users size={28} className="text-blue-500" />
                    <h1 className="text-2xl font-black text-blue-500 italic">Gestion des utilisateurs</h1>
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm px-4 py-3 rounded-xl">{error}</div>
                )}

                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-slate-500">Chargement...</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-500 text-xs uppercase border-b border-slate-800">
                                    <th className="px-6 py-4">Utilisateur</th>
                                    <th className="px-6 py-4">Rôle</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-800/30 transition">
                                        <td className="px-6 py-4">
                                            <p className="font-bold">{user.name ?? "—"}</p>
                                            <p className="text-xs text-slate-500 font-mono">{user.email}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${ROLE_STYLES[user.role]}`}>
                                                {ROLE_ICONS[user.role]} {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {user.id === myId && <span className="text-xs text-slate-500 italic">Vous</span>}
                                                {user.id !== myId && !canModifyUser(myId, myRole, user) && !canDeleteUser(myId, myRole, user) && <span className="text-xs text-slate-600 italic">—</span>}
                                                {canModifyUser(myId, myRole, user) && user.role === "PENDING" && (
                                                    <button onClick={() => setRole(user.id, "USER")}
                                                        className="px-3 py-1.5 text-xs font-bold bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded-xl transition flex items-center gap-1">
                                                        <CheckCircle size={13} /> Approuver
                                                    </button>
                                                )}
                                                {canModifyUser(myId, myRole, user) && user.role !== "PENDING" && (
                                                    <select
                                                        value={user.role}
                                                        onChange={e => setRole(user.id, e.target.value)}
                                                        className="bg-slate-800 border border-slate-700 text-sm font-bold px-3 py-1.5 rounded-xl outline-none cursor-pointer"
                                                    >
                                                        <option value="USER">USER</option>
                                                        <option value="ADMIN">ADMIN</option>
                                                    </select>
                                                )}
                                                {canDeleteUser(myId, myRole, user) && (
                                                    <button
                                                        onClick={() => setToDelete(user)}
                                                        title="Supprimer le compte"
                                                        className="p-1.5 text-slate-600 hover:text-rose-500 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm transition">← Retour au tableau de bord</Link>
            </div>

            {toDelete && (
                <ConfirmDialog
                    title="Supprimer le compte"
                    message={`Supprimer définitivement le compte de ${toDelete.name ?? toDelete.email ?? "cet utilisateur"} ? Cette action est irréversible.`}
                    cancelLabel="Annuler"
                    confirmLabel="Supprimer"
                    onCancel={() => setToDelete(null)}
                    onConfirm={deleteUser}
                />
            )}
        </div>
    );
}
