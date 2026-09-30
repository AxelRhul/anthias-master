import "dotenv/config";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

const [email, password, name] = process.argv.slice(2);

if (!email || !password) {
    console.error("Usage: npx tsx scripts/create-user.ts <email> <password> [name]");
    process.exit(1);
}

async function main() {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.upsert({
        where: { email },
        update: { passwordHash, name: name ?? undefined, role: "ADMIN" },
        create: {
            email,
            passwordHash,
            name: name ?? email.split("@")[0],
            role: "ADMIN",
        },
    });
    console.log(`✅ Utilisateur prêt : ${user.email} (${user.role})`);
}

main().catch(err => { console.error(err); process.exit(1); });
