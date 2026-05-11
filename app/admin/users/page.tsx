"use client";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, ShieldCheck, Clock, Users } from "lucide-react";

type User = { id: string; name: string | null; email: string | null; role: string; createdAt: string };

const ROLE_STYLES: Record<string, string> = {
    ADMIN: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    USER: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    PENDING: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
    ADMIN: <ShieldCheck size={14} />,
    USER: <CheckCircle size={14} />,
    PENDING: <Clock size={14} />,
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        const res = await fetch("/api/admin/users");
        setUsers(await res.json());
        setLoading(false);
    };

    const setRole = async (id: string, role: string) => {
        await fetch("/api/admin/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, role }),
        });
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
                                                {user.role !== "ADMIN" && (
                                                    <button onClick={() => setRole(user.id, "ADMIN")}
                                                        className="px-3 py-1.5 text-xs font-bold bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-xl transition flex items-center gap-1">
                                                        <ShieldCheck size={13} /> Admin
                                                    </button>
                                                )}
                                                {user.role !== "USER" && (
                                                    <button onClick={() => setRole(user.id, "USER")}
                                                        className="px-3 py-1.5 text-xs font-bold bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded-xl transition flex items-center gap-1">
                                                        <CheckCircle size={13} /> Approuver
                                                    </button>
                                                )}
                                                {user.role !== "PENDING" && (
                                                    <button onClick={() => setRole(user.id, "PENDING")}
                                                        className="px-3 py-1.5 text-xs font-bold bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 rounded-xl transition flex items-center gap-1">
                                                        <XCircle size={13} /> Révoquer
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

                <a href="/" className="text-slate-500 hover:text-slate-300 text-sm transition">← Retour au tableau de bord</a>
            </div>
        </div>
    );
}
