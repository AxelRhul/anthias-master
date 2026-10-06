// In-memory failed-attempt counter (single server process). Entries expire after the window.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ENTRIES = 5000;

const attempts = new Map<string, { count: number; first: number }>();

function prune() {
    if (attempts.size < MAX_ENTRIES) return;
    const now = Date.now();
    for (const [key, entry] of attempts) {
        if (now - entry.first > WINDOW_MS) attempts.delete(key);
    }
}

export function isLimited(key: string, max: number): boolean {
    const entry = attempts.get(key);
    if (!entry) return false;
    if (Date.now() - entry.first > WINDOW_MS) {
        attempts.delete(key);
        return false;
    }
    return entry.count >= max;
}

export function recordFailure(key: string) {
    prune();
    const entry = attempts.get(key);
    if (!entry || Date.now() - entry.first > WINDOW_MS) {
        attempts.set(key, { count: 1, first: Date.now() });
    } else {
        entry.count++;
    }
}

export function clearFailures(key: string) {
    attempts.delete(key);
}
