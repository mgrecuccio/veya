import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ContactsService } from "./contacts.service";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { ContactView } from "../model/contact-view.model";
import { environment } from "src/environments/environment";
import { PendingContactInvitationView } from "../model/pending-contact-invitation-view.model";

describe('ContactService', () => {
    let service: ContactsService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                ContactsService,
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
        });

        service = TestBed.inject(ContactsService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should get all contacts', () => {
        let mockContacts: ContactView[] = [
            {
                contactUserId: 'contact-user-id',
                nickName: 'Nina',
                favorite: true,
                createdAt: '2026-04-10T09:00:00.000Z',
            }
        ];

        service.getContacts().subscribe(contacts => {
            expect(contacts).toEqual(mockContacts)
        });

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/v1/contacts`);
        expect(req.request.method).toBe('GET');
        req.flush(mockContacts);
    });

    it('should call pending invitations', () => {
        let mockInvitations: PendingContactInvitationView[] = [
            {
                invitationId: 'invitation-id',
                senderUserId: 'sender-user-id',
                senderDisplayName: 'Nina',
                status: 'PENDING',
                createdAt: '2026-04-10T09:00:00.000Z',
            },
        ];

        service.getPendingInvitations().subscribe(invitations => {
            expect(invitations).toHaveSize(1);

            let invitation = invitations[0];
            expect(invitation.invitationId).toBe('invitation-id');
            expect(invitation.senderUserId).toBe('sender-user-id');
            expect(invitation.senderDisplayName).toBe('Nina');
            expect(invitation.status).toBe('PENDING');
            expect(invitation.createdAt).toBe('2026-04-10T09:00:00.000Z');
        });

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/v1/contacts/invitations/pending`);
        expect(req.request.method).toBe('GET');
        req.flush(mockInvitations);
    });
});