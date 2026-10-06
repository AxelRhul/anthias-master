"use client";
import { useEffect, useState } from "react";
import { signIn, getProviders } from "next-auth/react";
import { Monitor } from "lucide-react";

export default function LoginPage() {
    const [hasAzure, setHasAzure] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getProviders().then(p => setHasAzure(Boolean(p?.["azure-ad"]))).catch(() => setHasAzure(false));
    }, []);

    const handleCredentials = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const res = await signIn("credentials", { email, password, redirect: false });
        if (res?.error === "TooManyAttempts") setError("Trop de tentatives. Réessayez dans 15 minutes.");
        else if (res?.error) setError("Email ou mot de passe incorrect.");
        else window.location.href = "/";
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <Monitor size={48} className="text-blue-500 mx-auto mb-4" />
                    <h1 className="text-3xl font-black text-blue-500 italic">ANTHIAS MASTER</h1>
                    <p className="text-slate-500 mt-2 text-sm">Connexion requise pour accéder au tableau de bord</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
                    {hasAzure && <>
                    <button
                        onClick={() => signIn("azure-ad", { callbackUrl: "/" })}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition active:scale-95"
                    >
                        <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
                            <rect x="0" y="0" width="10" height="10" fill="#F25022" />
                            <rect x="11" y="0" width="10" height="10" fill="#7FBA00" />
                            <rect x="0" y="11" width="10" height="10" fill="#00A4EF" />
                            <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
                        </svg>
                        Continuer avec Microsoft
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-slate-800" />
                        <span className="text-slate-600 text-sm">ou</span>
                        <div className="flex-1 h-px bg-slate-800" />
                    </div>
                    </>}

                    <form onSubmit={handleCredentials} className="space-y-4">
                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm px-4 py-3 rounded-xl">
                                {error}
                            </div>
                        )}
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl outline-none placeholder-slate-500"
                        />
                        <input
                            type="password"
                            placeholder="Mot de passe"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl outline-none placeholder-slate-500"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition disabled:opacity-50 active:scale-95"
                        >
                            {loading ? "Connexion..." : "Se connecter"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
