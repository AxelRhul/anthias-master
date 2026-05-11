const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
const HOSTNAME_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export function isValidHost(host: string): boolean {
    const h = host.trim();
    if (!h || h.length > 253) return false;
    if (IPV4_REGEX.test(h)) {
        return h.split('.').every(part => parseInt(part, 10) <= 255);
    }
    return HOSTNAME_REGEX.test(h);
}

// Prevents path traversal in URLs built from user-supplied asset IDs
export function isValidAssetId(id: string): boolean {
    return /^[a-zA-Z0-9_-]{1,64}$/.test(id);
}
