import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/features/auth/require-admin';
import { encryptSecret, isEncryptionConfigured } from '@/lib/crypto';
import { toPublicScreen } from '@/features/screens/public-screen';
import { errorCode } from '@/lib/errors';

// HTTP Basic authentication: the login name cannot contain a colon
const USERNAME = /^[^:\s][^:]{0,99}$/;
const MAX_PASSWORD_LENGTH = 200;

async function parseId(params: Promise<{ id: string }>) {
    const numId = parseInt((await params).id, 10);
    return isNaN(numId) ? null : numId;
}

// Sets the login of a device. An empty password keeps the stored one (only the login changes).
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!(await requireSuperAdmin())) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const id = await parseId(params);
    if (id === null) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

    let body: { username?: unknown; password?: unknown };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    const username = typeof body.username === 'string' ? body.username.trim() : '';
    if (!USERNAME.test(username)) {
        return NextResponse.json({ error: "invalid_username" }, { status: 400 });
    }

    try {
        const screen = await prisma.screen.findUnique({ where: { id } });
        if (!screen) return NextResponse.json({ error: "not_found" }, { status: 404 });

        let passwordEnc = screen.passwordEnc;
        if (typeof body.password === 'string' && body.password.length > 0) {
            if (body.password.length > MAX_PASSWORD_LENGTH) {
                return NextResponse.json({ error: "invalid_password" }, { status: 400 });
            }
            if (!isEncryptionConfigured()) {
                return NextResponse.json({ error: "encryption_key_missing" }, { status: 503 });
            }
            passwordEnc = encryptSecret(body.password);
        }
        if (!passwordEnc) return NextResponse.json({ error: "password_required" }, { status: 400 });

        const updated = await prisma.screen.update({ where: { id }, data: { username, passwordEnc } });
        return NextResponse.json(toPublicScreen(updated, true));
    } catch {
        return NextResponse.json({ error: "db_error" }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!(await requireSuperAdmin())) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const id = await parseId(params);
    if (id === null) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

    try {
        const updated = await prisma.screen.update({ where: { id }, data: { username: null, passwordEnc: null } });
        return NextResponse.json(toPublicScreen(updated, true));
    } catch (err) {
        if (errorCode(err) === 'P2025') return NextResponse.json({ error: "not_found" }, { status: 404 });
        return NextResponse.json({ error: "db_error" }, { status: 500 });
    }
}
