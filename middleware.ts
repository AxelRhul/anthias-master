import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // Toujours laisser passer les routes auth, login et pending
    if (
        pathname.startsWith("/api/auth") ||
        pathname === "/login" ||
        pathname === "/pending"
    ) {
        return NextResponse.next();
    }

    // Non connecté → login
    if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // Connecté mais pas encore approuvé → pending
    if (token.role === "PENDING") {
        return NextResponse.redirect(new URL("/pending", req.url));
    }

    // Routes admin réservées aux ADMIN
    if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
