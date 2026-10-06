import { anthias } from '@/lib/anthias';
import { errorDetail } from '@/lib/errors';

type Screen = { ip: string };
type SourceAsset = { asset_id: string; name: string };

const base = (screen: Screen) => `http://${screen.ip.trim()}/api/v2/assets`;

// Asset IDs differ between screens: delete by ID on the source screen (the one shown in the library),
// and by name on the other screens.
export async function deleteAssetsEverywhere(screens: Screen[], sourceAssets: SourceAsset[]) {
    const [source, ...others] = screens;
    const names = new Set(sourceAssets.map(a => a.name));
    let deleted = 0;
    let failed = 0;

    for (const asset of sourceAssets) {
        try {
            await anthias.delete(`${base(source)}/${asset.asset_id}`, { timeout: 10000 });
            deleted++;
        } catch (err) {
            failed++;
            console.error(`[delete] ${asset.name} on ${source.ip}:`, errorDetail(err));
        }
    }

    for (const screen of others) {
        try {
            const res = await anthias.get(base(screen), { timeout: 5000 });
            const list: SourceAsset[] = Array.isArray(res.data) ? res.data : [];
            for (const a of list.filter(item => names.has(item.name))) {
                try {
                    await anthias.delete(`${base(screen)}/${a.asset_id}`, { timeout: 10000 });
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
