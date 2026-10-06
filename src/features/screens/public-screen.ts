type StoredScreen = {
    id: number;
    ip: string;
    label: string;
    username: string | null;
    passwordEnc: string | null;
    createdAt: Date;
};

// What the API may return about a screen. The encrypted password is never sent to the browser;
// the login name is only shown to the SUPER_ADMIN, who is the only one allowed to edit it.
export function toPublicScreen(screen: StoredScreen, includeUsername: boolean) {
    const hasCredentials = Boolean(screen.username && screen.passwordEnc);
    return {
        id: screen.id,
        ip: screen.ip,
        label: screen.label,
        createdAt: screen.createdAt,
        hasCredentials,
        ...(includeUsername && hasCredentials ? { username: screen.username } : {}),
    };
}
