const PLACEHOLDER_SECRETS = ["replace_with_openssl_rand_base64_32", "changeme", "secret"];

export async function register() {
    if (process.env.NEXT_RUNTIME !== "nodejs") return;
    if (process.env.NEXT_PHASE === "phase-production-build") return;

    const secret = process.env.NEXTAUTH_SECRET ?? "";
    const weak = secret.length < 32 || PLACEHOLDER_SECRETS.includes(secret.toLowerCase());

    if (weak) {
        const message =
            "NEXTAUTH_SECRET is missing, shorter than 32 characters, or still the example value. " +
            "Anyone knowing it can forge a SUPER_ADMIN session. Generate one with: openssl rand -base64 32";
        if (process.env.NODE_ENV === "production") throw new Error(message);
        console.warn(`[security] ${message}`);
    }

    const { isEncryptionConfigured } = await import("@/lib/crypto");
    if (!isEncryptionConfigured()) {
        console.warn(
            "[security] CREDENTIALS_ENCRYPTION_KEY is missing or is not 32 bytes of base64: Anthias device " +
            "passwords cannot be saved or used. Generate one with: openssl rand -base64 32"
        );
    }

    const url = process.env.NEXTAUTH_URL ?? "";
    if (process.env.NODE_ENV === "production" && !url.startsWith("https://")) {
        console.warn("[security] NEXTAUTH_URL is not https://: session cookies will not be marked Secure.");
    }
}
