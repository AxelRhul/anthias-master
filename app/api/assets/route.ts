import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

export async function GET() {
    const screens = await prisma.screen.findMany();
    if (screens.length === 0 || !screens[0].ip) return NextResponse.json([]);

    try {
        const res = await axios.get(`http://${screens[0].ip.trim()}/api/v2/assets`, { timeout: 4000 });
return NextResponse.json(res.data);
    } catch (err) {
        return NextResponse.json({ error: "Impossible de lister" }, { status: 500 });
    }
}