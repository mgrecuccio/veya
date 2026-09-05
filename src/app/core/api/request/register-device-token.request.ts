export type DeviceTokenPlatform = 'IOS' | 'ANDROID' | 'WEB' | string;

export const DEVICE_TOKEN_PLATFORM = {
    IOS: 'IOS',
    ANDROID: 'ANDROID',
    WEB: 'WEB',
} as const satisfies Record<string, DeviceTokenPlatform>;

export interface RegisterDeviceTokenRequest {
    token: string;
    platform: DeviceTokenPlatform;
}
