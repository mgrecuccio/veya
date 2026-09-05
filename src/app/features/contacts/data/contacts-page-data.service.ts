import { Injectable, inject } from "@angular/core";
import { forkJoin, Observable, throwError } from "rxjs";
import { ContactView } from "src/app/core/api/model/contact-view.model";
import { PendingContactInvitationView } from "src/app/core/api/model/pending-contact-invitation-view.model";
import { ContactsService } from "src/app/core/api/services/contacts.service";
import { catchError, map } from "rxjs/operators";
import { ContactInvitationView } from "src/app/core/api/model/contact-invitation-view.model";
import { SendInvitationRequest } from "src/app/core/api/request/send-invitation.request";
import { EditContactRequest } from "src/app/core/api/request/edit-contact.request";
import { toUserFacingApiError } from "src/app/core/api/api-error.util";

export interface ContactsPageData {
    contacts: ContactView[],
    blockedContacts: ContactView[],
    pendingInvitations: PendingContactInvitationView[],
}

@Injectable({ providedIn: 'root' })
export class ContactsPageDataService {
    private readonly contactsService = inject(ContactsService);

    getPageData(): Observable<ContactsPageData> {
        return forkJoin({
            contacts: this.contactsService.getContacts(),
            blockedContacts: this.contactsService.getBlockedContacts(),
            pendingInvitations: this.contactsService.getPendingInvitations(),
        }).pipe(
            map(({ contacts, blockedContacts, pendingInvitations }) => ({
                contacts,
                blockedContacts,
                pendingInvitations,
            })),
            catchError((error) => {
                console.error('[ContactsPageDataService] Failed to load contacts page', error);
                return throwError(() =>
                    toUserFacingApiError(
                        error,
                        'We couldn’t load your circle right now. Please try again.',
                    ),
                );
            }),
        );
    }

    sendInvitation(input: SendInvitationRequest): Observable<ContactInvitationView> {
        return this.contactsService.sendInvitation(input);
    }

    acceptInvitation(invitationId: number): Observable<void> {
        return this.contactsService.acceptInvitation(invitationId);
    }

    rejectInvitation(invitationId: number): Observable<void> {
        return this.contactsService.rejectInvitation(invitationId);
    }

    cancelInvitation(invitationId: number): Observable<void> {
        return this.contactsService.cancelInvitation(invitationId);
    }

    removeContact(contactUserId: number): Observable<void> {
        return this.contactsService.removeContact(contactUserId);
    }

    blockContact(contactUserId: number): Observable<void> {
        return this.contactsService.blockContact(contactUserId);
    }

    unblockContact(contactUserId: number): Observable<void> {
        return this.contactsService.unblockContact(contactUserId);
    }

    editContact(contactUserId: number, input: EditContactRequest): Observable<ContactView> {
        return this.contactsService.editContact(contactUserId, input);
    }
}
