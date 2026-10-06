// Prevents path traversal in URLs built from user-supplied asset IDs
export function isValidAssetId(id: string): boolean {
    return /^[a-zA-Z0-9_-]{1,64}$/.test(id);
}
