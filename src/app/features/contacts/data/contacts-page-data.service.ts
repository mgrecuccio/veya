import { Injectable, inject } from "@angular/core";
import { forkJoin, Observable, throwError } from "rxjs";
import { ContactView } from "src/app/core/api/model/contact-view.model";
import { PendingContactInvitationView } from "src/app/core/api/model/pending-contact-invitation-view.model";
import { ContactsService } from "src/app/core/api/services/contacts.service";
import { catchError, map } from "rxjs/operators";
import { ContactInvitationView } from "src/app/core/api/model/contact-invitation-view.model";
import { SendInvitationRequest } from "src/app/core/api/request/send-invitation.request";
import { EditContactRequest } from "src/app/core/api/request/edit-contact.request";

export interface ContactsPageData {
    contacts: ContactView[],
    pendingInvitations: PendingContactInvitationView[],
}

@Injectable({ providedIn: 'root' })
export class ContactsPageDataService {
    private readonly contactsService = inject(ContactsService);

    getPageData(): Observable<ContactsPageData> {
        return forkJoin({
            contacts: this.contactsService.getContacts(),
            pendingInvitations: this.contactsService.getPendingInvitations(),
        }).pipe(
            map(({ contacts, pendingInvitations }) => ({
                contacts,
                pendingInvitations,
            })),
            catchError((error) => {
                console.error('[ContactsPageDataService] Failed to load contacts page', error);
                return throwError(
                    () => new Error('We couldn’t load your circle right now. Please try again.')
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

    removeContact(contactUserId: number): Observable<void> {
        return this.contactsService.removeContact(contactUserId);
    }

    blockContact(contactUserId: number): Observable<void> {
        return this.contactsService.blockContact(contactUserId);
    }

    editContact(contactUserId: number, input: EditContactRequest): Observable<ContactView> {
        return this.contactsService.editContact(contactUserId, input);
    }
}
