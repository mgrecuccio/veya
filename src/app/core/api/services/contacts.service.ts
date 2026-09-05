import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ContactView } from "../model/contact-view.model";
import { PendingContactInvitationView } from "../model/pending-contact-invitation-view.model";
import { environment } from "src/environments/environment";
import { ContactInvitationView } from "../model/contact-invitation-view.model";
import { SendInvitationRequest } from "../request/send-invitation.request";
import { EditContactRequest } from "../request/edit-contact.request";


@Injectable({ providedIn: 'root' })
export class ContactsService {
    private readonly http = inject(HttpClient);
    private readonly apiBaseUrl = environment.apiBaseUrl;

    getContacts(): Observable<ContactView[]> {
        return this.http.get<ContactView[]>(`${this.apiBaseUrl}/api/v1/contacts`);
    }

    getBlockedContacts(): Observable<ContactView[]> {
        return this.http.get<ContactView[]>(`${this.apiBaseUrl}/api/v1/contacts/blocked`);
    }

    getPendingInvitations(): Observable<PendingContactInvitationView[]> {
        return this.http.get<PendingContactInvitationView[]>(`${this.apiBaseUrl}/api/v1/contacts/invitations/pending`);
    }

    sendInvitation(payload: SendInvitationRequest): Observable<ContactInvitationView> {
        return this.http.post<ContactInvitationView>(
            `${this.apiBaseUrl}/api/v1/contacts/invitations`,
            payload,
        );
    }

    acceptInvitation(invitationId: number): Observable<void> {
        return this.http.post<void>(
            `${this.apiBaseUrl}/api/v1/contacts/invitations/${invitationId}/accept`,
            {},
        );
    }

    rejectInvitation(invitationId: number): Observable<void> {
        return this.http.post<void>(
            `${this.apiBaseUrl}/api/v1/contacts/invitations/${invitationId}/reject`,
            {},
        );
    }

    cancelInvitation(invitationId: number): Observable<void> {
        return this.http.delete<void>(
            `${this.apiBaseUrl}/api/v1/contacts/invitations/${invitationId}`,
        );
    }

    removeContact(contactUserId: number): Observable<void> {
        return this.http.delete<void>(
            `${this.apiBaseUrl}/api/v1/contacts/${contactUserId}`,
        );
    }

    blockContact(contactUserId: number): Observable<void> {
        return this.http.post<void>(
            `${this.apiBaseUrl}/api/v1/contacts/${contactUserId}/block`,
            {},
        );
    }

    unblockContact(contactUserId: number): Observable<void> {
        return this.http.post<void>(
            `${this.apiBaseUrl}/api/v1/contacts/${contactUserId}/unblock`,
            {},
        );
    }

    editContact(contactUserId: number, payload: EditContactRequest): Observable<ContactView> {
        return this.http.put<ContactView>(
            `${this.apiBaseUrl}/api/v1/contacts/${contactUserId}`,
            payload
        );
    }
}
