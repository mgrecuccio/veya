export type DeviceTokenPlatform = 'IOS' | 'ANDROID' | 'WEB' | string;

export interface RegisterDeviceTokenRequest {
    token: string;
    platform: DeviceTokenPlatform;
}
