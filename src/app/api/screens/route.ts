import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidHost } from '@/features/screens/validate-host';
import { isSafeScreenHost } from '@/features/screens/ssrf';
import { errorCode } from '@/lib/errors';
import { requireAdmin } from '@/features/auth/require-admin';
import { requireUser, unauthorized } from '@/features/auth/require-user';
import { anthias } from '@/lib/anthias';

export async function GET() {
    if (!(await requireUser())) return unauthorized();
    try {
        const screens = await prisma.screen.findMany();

        const monitoredScreens = await Promise.all(screens.map(async (s) => {
            try {
                await anthias.get(`http://${s.ip}/api/v2/assets`, { timeout: 1000 });
                return { ...s, online: true };
            } catch {
                return { ...s, online: false };
            }
        }));

        return NextResponse.json(monitoredScreens);
    } catch {
        return NextResponse.json({ error: "db_error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    if (!(await requireAdmin())) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    try {
        const body = await req.json();
        const ip = typeof body.ip === 'string' ? body.ip.trim() : '';
        const label = typeof body.label === 'string' ? body.label.trim() : '';

        if (!ip || !label) {
            return NextResponse.json({ error: "ip_and_label_required" }, { status: 400 });
        }
        if (!isValidHost(ip)) {
            return NextResponse.json({ error: "invalid_ip" }, { status: 400 });
        }
        if (!(await isSafeScreenHost(ip))) {
            return NextResponse.json({ error: "forbidden_host" }, { status: 400 });
        }
        if (label.length > 100) {
            return NextResponse.json({ error: "label_too_long" }, { status: 400 });
        }

        const screen = await prisma.screen.create({ data: { ip, label } });
        return NextResponse.json(screen, { status: 201 });
    } catch (err) {
        if (errorCode(err) === 'P2002') {
            return NextResponse.json({ error: "ip_already_exists" }, { status: 409 });
        }
        return NextResponse.json({ error: "db_error" }, { status: 500 });
    }
}
