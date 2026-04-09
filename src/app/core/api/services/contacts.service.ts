import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ContactView } from "../model/contact-view.model";
import { PendingContactInvitationView } from "../model/pending-contact-invitation-view.model";
import { environment } from "src/environments/environment";


@Injectable({ providedIn: 'root' })
export class ContactsService {
    private readonly http = inject(HttpClient);
    private readonly apiBaseUrl = environment.apiBaseUrl;

    getContacts(): Observable<ContactView[]> {
        return this.http.get<ContactView[]>(`${this.apiBaseUrl}/api/v1/contacts`);
    }

    getPendingInvitations(): Observable<PendingContactInvitationView[]> {
        return this.http.get<PendingContactInvitationView[]>(`${this.apiBaseUrl}/api/v1/contacts/invitations/pending`);
    }

    

}