import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

const formatAnthiasDate = (d: string) => new Date(d).toISOString().split('.')[0] + 'Z';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const screens = await prisma.screen.findMany();
    if (screens.length === 0 || !screens[0].ip) return NextResponse.json({ error: "Aucun écran" });

    try {
        const res = await axios.get(`http://${screens[0].ip.trim()}/api/v2/assets/${id}/content`, { timeout: 10000 });
        return NextResponse.json(res.data);
    } catch (err) {
        return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await req.json();
    const screens = await prisma.screen.findMany();

    const payload = {
        name: body.name,
        duration: parseInt(body.duration),
        is_enabled: body.is_enabled,
        start_date: formatAnthiasDate(body.start_date),
        end_date: formatAnthiasDate(body.end_date),
        play_order: parseInt(body.play_order) || 0
    };

    const results = await Promise.all(screens.map(async (screen) => {
        try {
            await axios.put(`http://${screen.ip}/api/v2/assets/${id}`, payload, { timeout: 5000 });
            return { ip: screen.ip, status: "OK" };
        } catch (err) {
            return { ip: screen.ip, status: "ERROR" };
        }
    }));

    return NextResponse.json(results);
}