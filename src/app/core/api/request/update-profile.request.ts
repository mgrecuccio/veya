import { SupportedLanguage } from '../../i18n/i18n.service';

export interface UpdateProfileRequest {
    displayName: string;
    timezone: string;
    phoneNumber: string;
    preferredLanguage?: SupportedLanguage;
}
