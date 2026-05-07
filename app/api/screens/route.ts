import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Importation corrigée
import axios from 'axios';

export async function GET() {
    try {
        const screens = await prisma.screen.findMany();
        
        const monitoredScreens = await Promise.all(screens.map(async (s) => {
            try {
                await axios.get(`http://${s.ip}/api/v2/assets`, { timeout: 1000 });
                return { ...s, online: true };
            } catch {
                return { ...s, online: false };
            }
        }));
        
        return NextResponse.json(monitoredScreens);
    } catch (err) {
        return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const { ip, label } = await req.json();
    const screen = await prisma.screen.create({ data: { ip, label } });
    return NextResponse.json(screen);
}