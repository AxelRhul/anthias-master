// Structure of the user guide. The texts live in src/messages/*.json under "Guide.sections.<id>";
// each screenshot `file` is read from public/images/guide/ and its caption from "Guide.sections.<id>.images.<key>".
export type GuideImageDef = { file: string; key: string };
export type GuideSectionDef = { id: string; images: GuideImageDef[]; adminOnly?: boolean };

export const GUIDE_SECTIONS: GuideSectionDef[] = [
    { id: 'overview', images: [{ file: 'dashboard.png', key: 'dashboard' }] },
    {
        id: 'access',
        images: [
            { file: 'login.png', key: 'login' },
            { file: 'pending.png', key: 'pending' },
        ],
    },
    {
        id: 'broadcast',
        images: [
            { file: 'broadcast-form.png', key: 'broadcastForm' },
            { file: 'broadcast-video.png', key: 'broadcastVideo' },
        ],
    },
    {
        id: 'library',
        images: [
            { file: 'library.png', key: 'library' },
            { file: 'asset-preview.png', key: 'assetPreview' },
            { file: 'asset-edit.png', key: 'assetEdit' },
        ],
    },
    { id: 'delete', images: [{ file: 'delete-confirm.png', key: 'deleteConfirm' }] },
    { id: 'devices', images: [{ file: 'device-status.png', key: 'deviceStatus' }] },
    { id: 'users', adminOnly: true, images: [{ file: 'admin-users.png', key: 'adminUsers' }] },
    { id: 'faq', images: [] },
];
