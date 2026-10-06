// Shape of an Anthias asset as the app reads it (other fields are passed through untouched)
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
