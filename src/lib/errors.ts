// Error code (Prisma "P2002", Node "ECONNREFUSED"...) of an unknown thrown value
export function errorCode(err: unknown): string | undefined {
    if (typeof err === "object" && err !== null && "code" in err) {
        return String((err as { code: unknown }).code);
    }
    return undefined;
}

// What is worth logging: the response body of a failed HTTP call, otherwise the message
export function errorDetail(err: unknown): unknown {
    if (typeof err === "object" && err !== null) {
        const data = (err as { response?: { data?: unknown } }).response?.data;
        if (data !== undefined) return data;
    }
    return err instanceof Error ? err.message : String(err);
}
