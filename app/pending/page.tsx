"use client";
import { signOut } from "next-auth/react";
import { Monitor, Clock } from "lucide-react";

export default function PendingPage() {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
            <div className="w-full max-w-md text-center space-y-6">
                <Monitor size={48} className="text-blue-500 mx-auto" />
                <h1 className="text-3xl font-black text-blue-500 italic">ANTHIAS MASTER</h1>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4">
                    <Clock size={40} className="text-amber-400 mx-auto" />
                    <h2 className="text-xl font-bold text-amber-400">Accès en attente</h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Votre compte a bien été créé. Un administrateur doit approuver votre accès avant que vous puissiez utiliser l'application.
                    </p>
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="text-slate-500 hover:text-slate-300 text-sm underline transition"
                    >
                        Se déconnecter
                    </button>
                </div>
            </div>
        </div>
    );
}
