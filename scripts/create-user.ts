import "dotenv/config";
import readline from "node:readline";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

const [rawEmail, name] = process.argv.slice(2);

if (!rawEmail) {
    console.error("Usage: npx tsx scripts/create-user.ts <email> [name]");
    console.error("The password is asked interactively (or read from CREATE_USER_PASSWORD).");
    process.exit(1);
}

const email = rawEmail.trim().toLowerCase();
const MIN_LENGTH = 12;
const MAX_BYTES = 72; // bcrypt ignores everything after 72 bytes

function askHidden(question: string): Promise<string> {
    return new Promise(resolve => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
        let muted = false;
        (rl as any)._writeToOutput = (text: string) => {
            if (!muted) (rl as any).output.write(text);
        };
        rl.question(question, answer => {
            rl.close();
            process.stdout.write("\n");
            resolve(answer);
        });
        muted = true;
    });
}

function checkPassword(password: string): string | null {
    if (password.length < MIN_LENGTH) return `Le mot de passe doit faire au moins ${MIN_LENGTH} caractères.`;
    if (Buffer.byteLength(password) > MAX_BYTES) return `Le mot de passe doit faire au plus ${MAX_BYTES} octets.`;
    if (password.toLowerCase().includes(email.split("@")[0])) return "Le mot de passe ne doit pas contenir l'identifiant de l'email.";
    return null;
}

async function readPassword(): Promise<string> {
    const fromEnv = process.env.CREATE_USER_PASSWORD;
    if (fromEnv) return fromEnv;

    if (!process.stdin.isTTY) {
        console.error("Aucun terminal interactif : définissez CREATE_USER_PASSWORD ou utilisez `docker exec -it`.");
        process.exit(1);
    }
    const first = await askHidden("Mot de passe : ");
    const second = await askHidden("Confirmez le mot de passe : ");
    if (first !== second) {
        console.error("❌ Les mots de passe ne correspondent pas.");
        process.exit(1);
    }
    return first;
}

async function main() {
    const existing = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN", NOT: { email } } });
    if (existing) {
        console.error(`❌ Un SUPER_ADMIN existe déjà (${existing.email}). Il ne peut y en avoir qu'un.`);
        process.exit(1);
    }

    const password = await readPassword();
    const problem = checkPassword(password);
    if (problem) {
        console.error(`❌ ${problem}`);
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
