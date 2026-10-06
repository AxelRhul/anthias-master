import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidHost } from '@/features/screens/validate-host';
import { isSafeScreenHost } from '@/features/screens/ssrf';
import { toPublicScreen } from '@/features/screens/public-screen';
import { errorCode, errorStatus } from '@/lib/errors';
import { requireAdmin } from '@/features/auth/require-admin';
import { requireUser, unauthorized } from '@/features/auth/require-user';
import { isSuperAdmin } from '@/features/auth/roles';
import { anthiasFor } from '@/lib/anthias';

// With Basic authentication a Raspberry Pi takes over a second to answer (it checks the password on every
// request), so the presence check must wait longer than that. Devices are probed in parallel.
const PROBE_TIMEOUT_MS = 5000;

// A device that answers 401/403 is reachable but refuses our credentials
async function probe(screen: Parameters<typeof anthiasFor>[0]) {
    try {
        await anthiasFor(screen).get('/assets', { timeout: PROBE_TIMEOUT_MS });
        return { online: true, authFailed: false };
    } catch (err) {
        const status = errorStatus(err);
        if (status === 401 || status === 403) return { online: true, authFailed: true };
        return { online: false, authFailed: false };
    }
}

export async function GET() {
    const session = await requireUser();
    if (!session) return unauthorized();
    const includeUsername = isSuperAdmin(session.user.role);
    try {
        const screens = await prisma.screen.findMany({ orderBy: { id: 'asc' } });

        const monitoredScreens = await Promise.all(screens.map(async (s) => ({
            ...toPublicScreen(s, includeUsername),
            ...(await probe(s)),
        })));

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
        return NextResponse.json(toPublicScreen(screen, false), { status: 201 });
    } catch (err) {
        if (errorCode(err) === 'P2002') {
            return NextResponse.json({ error: "ip_already_exists" }, { status: 409 });
        }
        return NextResponse.json({ error: "db_error" }, { status: 500 });
    }
}
