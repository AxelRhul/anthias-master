// Shapes of the Anthias API objects the app reads (other fields are passed through untouched)
export type Asset = {
    asset_id: string;
    name: string;
    uri?: string;
    mimetype?: string;
    is_enabled: boolean;
    duration: number;
    start_date: string;
    end_date: string;
    play_order?: number;
    nocache?: boolean;
    [key: string]: unknown;
};

export type Screen = {
    id: number;
    ip: string;
    label: string;
    online?: boolean;
};

export type AppUser = {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    createdAt: string;
};
