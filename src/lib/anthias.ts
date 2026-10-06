import axios from 'axios';
import { decryptSecret } from '@/lib/crypto';

export type AnthiasTarget = {
    ip: string;
    username?: string | null;
    passwordEnc?: string | null;
};

const fallbackUser = process.env.ANTHIAS_USER;
const fallbackPassword = process.env.ANTHIAS_PASSWORD;

function credentialsOf(screen: AnthiasTarget) {
    if (screen.username && screen.passwordEnc) {
        try {
            return { username: screen.username, password: decryptSecret(screen.passwordEnc) };
        } catch {
            console.error(`[anthias] cannot decrypt the stored password of ${screen.ip} (wrong or missing CREDENTIALS_ENCRYPTION_KEY?)`);
            return undefined;
        }
    }
    // Devices without a login of their own use the optional global one
    if (fallbackUser && fallbackPassword) return { username: fallbackUser, password: fallbackPassword };
    return undefined;
}

// HTTP client bound to one Anthias device: base URL of its API v2 plus its Basic authentication, if any.
export function anthiasFor(screen: AnthiasTarget) {
    return axios.create({
        baseURL: `http://${screen.ip.trim()}/api/v2`,
        auth: credentialsOf(screen),
        timeout: 30000,
    });
}
