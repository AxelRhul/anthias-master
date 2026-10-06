import "dotenv/config";
import { prisma } from "../src/lib/prisma";

// Removes the Microsoft tokens stored by older versions of the app (they are never used).
async function main() {
    const result = await prisma.account.updateMany({
        data: {
            access_token: null,
            refresh_token: null,
            id_token: null,
            expires_at: null,
            ext_expires_in: null,
            token_type: null,
            scope: null,
            session_state: null,
        },
    });
    console.log(`✅ Jetons purgés sur ${result.count} compte(s) lié(s).`);
}

main().catch(err => { console.error(err); process.exit(1); });
