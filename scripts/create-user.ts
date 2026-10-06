import "dotenv/config";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

const [email, password, name] = process.argv.slice(2);

if (!email || !password) {
    console.error("Usage: npx tsx scripts/create-user.ts <email> <password> [name]");
    process.exit(1);
}

async function main() {
    const existing = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN", NOT: { email } } });
    if (existing) {
        console.error(`❌ Un SUPER_ADMIN existe déjà (${existing.email}). Il ne peut y en avoir qu'un.`);
        process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.upsert({
        where: { email },
        update: { passwordHash, name: name ?? undefined, role: "SUPER_ADMIN" },
        create: {
            email,
            passwordHash,
            name: name ?? email.split("@")[0],
            role: "SUPER_ADMIN",
        },
    });
    console.log(`✅ Utilisateur prêt : ${user.email} (${user.role})`);
}

main().catch(err => { console.error(err); process.exit(1); });
