import { ContactLinkType } from './contact-link-type.model';

export interface ContactLinkView {
    type: ContactLinkType;
    url: string;
    expiresAt: string;
}
