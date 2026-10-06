import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Reversible encryption for secrets the app must send back in clear (the Anthias devices' passwords).
// Format: v1:<iv>:<auth tag>:<ciphertext>, all base64. The key is CREDENTIALS_ENCRYPTION_KEY (32 bytes, base64).
const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer | null {
    const raw = process.env.CREDENTIALS_ENCRYPTION_KEY?.trim();
    if (!raw) return null;
    const key = Buffer.from(raw, "base64");
    return key.length === 32 ? key : null;
}

export const isEncryptionConfigured = () => getKey() !== null;

export function encryptSecret(plain: string): string {
    const key = getKey();
    if (!key) throw new Error("encryption_key_missing");

    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
    return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), encrypted.toString("base64")].join(":");
}

export function decryptSecret(payload: string): string {
    const key = getKey();
    if (!key) throw new Error("encryption_key_missing");

    const [version, iv, tag, data] = payload.split(":");
    if (version !== "v1" || !iv || !tag || !data) throw new Error("invalid_secret_format");

    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, "base64"));
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}
