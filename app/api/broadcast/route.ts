import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';
import FormData from 'form-data';

const formatAnthiasDate = (d: any) => {
    try {
        const date = d ? new Date(d) : new Date();
        return date.toISOString().split('.')[0] + 'Z';
    } catch {
        return new Date().toISOString().split('.')[0] + 'Z';
    }
};

export async function POST(req: Request) {
    try {
        const data = await req.formData();
        const file = data.get('image') as File;
        if (!file) return NextResponse.json({ error: "Pas de fichier" }, { status: 400 });

        const name = (data.get('name') as string) || file.name;
        const duration = Math.floor(Number(data.get('duration'))) || 10;
        const play_order = Math.floor(Number(data.get('play_order'))) || 0;
        const start_date = data.get('start_date') as string;
        const end_date = data.get('end_date') as string;

        const screens = await prisma.screen.findMany();
        const buffer = Buffer.from(await file.arrayBuffer());

        const results = [];
        for (const screen of screens) {
            try {
                const baseUrl = `http://${screen.ip.trim()}/api/v2`;

                // 1. Upload du fichier
                const form = new FormData();
                form.append('file_upload', buffer, {
                    filename: file.name.replace(/\s+/g, '_'),
                    contentType: file.type
                });

                const fileRes = await axios.post(`${baseUrl}/file_asset`, form, {
                    headers: form.getHeaders(),
                    timeout: 30000
                });

                // 2. Création de l'Asset - MAÎTRE : ON AJOUTE TOUS LES BOULÉENS DE LA DOC
                const assetPayload = {
                    ext: fileRes.data.ext,
                    name: name,
                    uri: fileRes.data.uri,
                    start_date: formatAnthiasDate(start_date),
                    end_date: formatAnthiasDate(end_date),
                    duration: duration,
                    mimetype: file.type,
                    is_enabled: true,
                    is_processing: false, // CRITIQUE : Évite le NoneType
                    nocache: false,       // CRITIQUE : Évite le NoneType
                    play_order: play_order,
                    skip_asset_check: true // CRITIQUE : Évite le NoneType
                };

                await axios.post(`${baseUrl}/assets`, assetPayload, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000
                });

                results.push({ ip: screen.ip, status: 'OK' });
            } catch (err: any) {
                console.error(`[ERR] ${screen.ip}:`, err.response?.data || err.message);
                results.push({ ip: screen.ip, status: 'ERROR' });
            }
        }
        return NextResponse.json(results);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}