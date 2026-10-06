import { anthiasFor, type AnthiasTarget } from '@/lib/anthias';
import { errorDetail } from '@/lib/errors';

type SourceAsset = { asset_id: string; name: string };

// Asset IDs differ between screens: delete by ID on the source screen (the one shown in the library),
// and by name on the other screens.
export async function deleteAssetsEverywhere(screens: AnthiasTarget[], sourceAssets: SourceAsset[]) {
    const [source, ...others] = screens;
    const sourceClient = anthiasFor(source);
    const names = new Set(sourceAssets.map(a => a.name));
    let deleted = 0;
    let failed = 0;

    for (const asset of sourceAssets) {
        try {
            await sourceClient.delete(`/assets/${asset.asset_id}`, { timeout: 10000 });
            deleted++;
        } catch (err) {
            failed++;
            console.error(`[delete] ${asset.name} on ${source.ip}:`, errorDetail(err));
        }
    }

    for (const screen of others) {
        const client = anthiasFor(screen);
        try {
            const res = await client.get('/assets', { timeout: 5000 });
            const list: SourceAsset[] = Array.isArray(res.data) ? res.data : [];
            for (const a of list.filter(item => names.has(item.name))) {
                try {
                    await client.delete(`/assets/${a.asset_id}`, { timeout: 10000 });
                } catch (err) {
                    failed++;
                    console.error(`[delete] ${a.name} on ${screen.ip}:`, errorDetail(err));
                }
            }
        } catch (err) {
            failed++;
            console.error(`[delete] cannot reach ${screen.ip}:`, errorDetail(err));
        }
    }

    return { deleted, failed };
}
