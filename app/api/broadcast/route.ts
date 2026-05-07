import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';
import FormData from 'form-data';

export async function POST(req: Request) {
    const data = await req.formData();
    const file = data.get('image') as File;
    const name = data.get('name') as string;
    const duration = data.get('duration') as string;
    const play_order = data.get('play_order') as string;
    
    // Récupération des dates du formulaire
    const start_date = data.get('start_date') as string;
    const end_date = data.get('end_date') as string;

    const screens = await prisma.screen.findMany();
    const buffer = Buffer.from(await file.arrayBuffer());

    // Helper pour le formatage Anthias (YYYY-MM-DDTHH:mm:ssZ)
    const formatAnthiasDate = (d: string) => new Date(d).toISOString().split('.')[0] + 'Z';

    const results = [];
    for (const screen of screens) {
        try {
            const form = new FormData();
            form.append('file_upload', buffer, { filename: file.name, contentType: file.type });
            const fileRes = await axios.post(`http://${screen.ip}/api/v2/file_asset`, form, { headers: form.getHeaders() });

            await axios.post(`http://${screen.ip}/api/v2/assets`, {
                name: name || file.name,
                uri: fileRes.data.uri,
                ext: fileRes.data.ext,
                duration: parseInt(duration),
                play_order: parseInt(play_order),
                is_enabled: true,
                mimetype: file.type,
                // Dates programmées
                start_date: formatAnthiasDate(start_date),
                end_date: formatAnthiasDate(end_date)
            });
            results.push({ ip: screen.ip, status: 'OK' });
        } catch (err: any) {
            results.push({ ip: screen.ip, status: 'ERROR' });
        }
    }
    return NextResponse.json(results);
}