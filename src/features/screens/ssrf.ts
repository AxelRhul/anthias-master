import dns from "node:dns/promises";
import net from "node:net";

// Anthias devices live on the local network, so private ranges (10.x, 172.16.x, 192.168.x) stay allowed.
// Blocked: loopback, "this host", link-local (cloud metadata 169.254.169.254), multicast and reserved ranges.
function isBlockedIPv4(ip: string): boolean {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 127 || (a === 169 && b === 254) || a >= 224;
}

function isBlockedIPv6(ip: string): boolean {
    const l = ip.toLowerCase();
    const mapped = l.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isBlockedIPv4(mapped[1]);
    return l === "::" || l === "::1" || l.startsWith("fe80") || l.startsWith("ff");
}

export function isBlockedAddress(ip: string): boolean {
    if (net.isIPv4(ip)) return isBlockedIPv4(ip);
    if (net.isIPv6(ip)) return isBlockedIPv6(ip);
    return true;
}

// Resolves hostnames too, so a name pointing at 127.0.0.1 or the metadata address is refused.
export async function isSafeScreenHost(host: string): Promise<boolean> {
    const h = host.trim().toLowerCase();
    if (h === "localhost" || h.endsWith(".localhost") || h === "metadata.google.internal") return false;
    if (net.isIP(h)) return !isBlockedAddress(h);
    try {
        const addresses = await dns.lookup(h, { all: true });
        return addresses.length > 0 && addresses.every(a => !isBlockedAddress(a.address));
    } catch {
        return false;
    }
}
