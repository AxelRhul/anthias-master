export type Screen = {
    id: number;
    ip: string;
    label: string;
    online?: boolean;
    // The device answers but refuses the stored (or missing) login
    authFailed?: boolean;
    hasCredentials?: boolean;
    // Only sent to the SUPER_ADMIN. The password is never sent to the browser.
    username?: string;
};
