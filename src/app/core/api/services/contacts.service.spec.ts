import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ContactsService } from "./contacts.service";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { ContactView } from "../model/contact-view.model";
import { environment } from "src/environments/environment";
import { PendingContactInvitationView } from "../model/pending-contact-invitation-view.model";
import { EditContactRequest } from "../request/edit-contact.request";

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
                id: 1,
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
                invitationId: 1,
                senderUserId: 2,
                senderDisplayName: 'Nina',
                status: 'PENDING',
                createdAt: '2026-04-10T09:00:00.000Z',
            },
        ];

        service.getPendingInvitations().subscribe(invitations => {
            expect(invitations).toHaveSize(1);

            let invitation = invitations[0];
            expect(invitation.invitationId).toBe(1);
            expect(invitation.senderUserId).toBe(2);
            expect(invitation.senderDisplayName).toBe('Nina');
            expect(invitation.status).toBe('PENDING');
            expect(invitation.createdAt).toBe('2026-04-10T09:00:00.000Z');
        });

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/v1/contacts/invitations/pending`);
        expect(req.request.method).toBe('GET');
        req.flush(mockInvitations);
    });

    it('should send and invitation', ()=> {
        let mockInvitationRequest = {
            email: 'test@email.com',
            nickName: 'nickName',
        }

        let mockContactInvitationView = {
            id: '1',
            senderUserId: '2',
            recipientUserId: '3',
            nickName: 'nickName',
            status: 'PENDING',
            createdAt: '2026-04-18',
        }

        service.sendInvitation(mockInvitationRequest).subscribe(response => {
            expect(response).toEqual(mockContactInvitationView);
        });
        

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/v1/contacts/invitations`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(mockInvitationRequest);
        req.flush(mockContactInvitationView);
    });

    it('should accept an invitation', () => {
        const mockInvitationId = 1;

        service.acceptInvitation(mockInvitationId).subscribe();

        const req = httpMock.expectOne(
            `${environment.apiBaseUrl}/api/v1/contacts/invitations/${mockInvitationId}/accept`
        );

        expect(req.request.method).toBe('POST');
    });

    it('should remove a contact', () => {
        const mockContactUserId = 1;

        service.removeContact(mockContactUserId).subscribe();

        const req = httpMock.expectOne(
            `${environment.apiBaseUrl}/api/v1/contacts/${mockContactUserId}`
        );

        expect(req.request.method).toBe('DELETE');
    });

    it('should block a contact', () => {
        const mockContactUserId = 1;

        service.blockContact(mockContactUserId).subscribe();

        const req = httpMock.expectOne(
            `${environment.apiBaseUrl}/api/v1/contacts/${mockContactUserId}/block`
        );

        expect(req.request.method).toBe('POST');
    });

    it('should edit a contact', () => {
        const mockContactUserId = 1;

        let mockEditContactRequest: EditContactRequest = {
            nickName: 'new nickName',
        }

        let mockContact: ContactView = {
                id: 1,
                contactUserId: 'contact-user-id',
                nickName: 'new nickName',
                favorite: true,
                createdAt: '2026-04-10T09:00:00.000Z',
        };

        service.editContact(mockContactUserId, mockEditContactRequest).subscribe(response => {
            expect(response).toEqual(mockContact);
        });

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/v1/contacts/${mockContactUserId}`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual(mockEditContactRequest);
        req.flush(mockContact);
    });

});
