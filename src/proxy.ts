import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isAdminRole } from "@/lib/roles";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const isApi = pathname.startsWith("/api");

    // Auth.js has its own CSRF protection on /api/auth
    if (isApi && !pathname.startsWith("/api/auth") && MUTATING.has(req.method)) {
        // Blocks cross-origin and cross-port ("same-site") requests from other pages
        const site = req.headers.get("sec-fetch-site");
        if (site && site !== "same-origin" && site !== "none") {
            return NextResponse.json({ error: "forbidden_origin" }, { status: 403 });
        }
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // Toujours laisser passer les routes auth, login et pending
    if (
        pathname.startsWith("/api/auth") ||
        pathname === "/login" ||
        pathname === "/pending"
    ) {
        return NextResponse.next();
    }

    // Non connecté → login (JSON 401 pour l'API)
    if (!token) {
        if (isApi) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // Connecté mais pas encore approuvé → pending
    if (token.role === "PENDING") {
        if (isApi) return NextResponse.json({ error: "forbidden" }, { status: 403 });
        return NextResponse.redirect(new URL("/pending", req.url));
    }

    // Routes admin réservées aux ADMIN
    if (pathname.startsWith("/admin") && !isAdminRole(token.role as string)) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
