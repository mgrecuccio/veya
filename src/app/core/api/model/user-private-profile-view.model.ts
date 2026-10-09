import { SupportedLanguage } from '../../i18n/i18n.service';

export interface UserPrivateProfileView {
    id: number;
    displayName?: string | null;
    timezone?: string | null;
    phoneNumber: string;
    status: string;
    preferredLanguage?: SupportedLanguage | null;
}
