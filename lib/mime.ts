export const EXT_MIME: Record<string, string> = {
    mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
    avi: 'video/x-msvideo', mkv: 'video/x-matroska', ogv: 'video/ogg',
    m4v: 'video/x-m4v',
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
};

// The only types the app accepts, stores, and serves. SVG/HTML are deliberately absent (script execution).
export const MIME_EXT: Record<string, string> = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp',
    'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov',
    'video/ogg': 'ogv', 'video/x-m4v': 'm4v',
};
export const SAFE_MIME = new Set(Object.keys(MIME_EXT));

const NON_VIDEO_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1', 'avif', 'avis', 'M4A ', 'M4B ', 'M4P ']);

// Detects the real type from the file signature; the type sent by the browser is not trusted.
export function sniffMime(buf: Buffer): string | null {
    if (buf.length < 12) return null;
    const ascii = (s: number, e: number) => buf.subarray(s, e).toString('latin1');

    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
    if (buf[0] === 0x89 && ascii(1, 4) === 'PNG' && buf[4] === 0x0d && buf[5] === 0x0a) return 'image/png';
    if (ascii(0, 6) === 'GIF87a' || ascii(0, 6) === 'GIF89a') return 'image/gif';
    if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
    if (ascii(4, 8) === 'ftyp') {
        const brand = ascii(8, 12);
        if (NON_VIDEO_BRANDS.has(brand)) return null;
        if (brand === 'qt  ') return 'video/quicktime';
        if (brand === 'M4V ') return 'video/x-m4v';
        return 'video/mp4';
    }
    if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return 'video/webm';
    if (ascii(0, 4) === 'OggS') return 'video/ogg';
    return null;
}

export const extOf = (uri: string | undefined): string =>
    uri?.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
