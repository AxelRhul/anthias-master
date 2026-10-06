const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
const OCTET_REGEX = /^(0|[1-9]\d{0,2})$/;
const HOSTNAME_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export function isValidHost(host: string): boolean {
    const h = host.trim();
    if (!h || h.length > 253) return false;
    if (IPV4_REGEX.test(h)) {
        // No leading zeros: "0177.0.0.1" is read as octal (127.0.0.1) by the OS resolver
        return h.split('.').every(part => OCTET_REGEX.test(part) && parseInt(part, 10) <= 255);
    }
    // Purely numeric / hex names such as "2130706433" or "0x7f000001" are alternate spellings of an IP
    if (/^[0-9.]+$/.test(h) || /^0x/i.test(h)) return false;
    return HOSTNAME_REGEX.test(h);
}

// Prevents path traversal in URLs built from user-supplied asset IDs
export function isValidAssetId(id: string): boolean {
    return /^[a-zA-Z0-9_-]{1,64}$/.test(id);
}
