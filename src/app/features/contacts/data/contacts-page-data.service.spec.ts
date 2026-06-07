import { ContactsService } from "src/app/core/api/services/contacts.service";
import { ContactsPageDataService } from "./contacts-page-data.service";
import { TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";


describe('ContactPageDataService', () => {
    let service: ContactsPageDataService;
    let contactsService: jasmine.SpyObj<ContactsService>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                ContactsPageDataService,
                {
                    provide: ContactsService,
                    useValue: jasmine.createSpyObj<ContactsService>('ContactsService', [
                        'getContacts',
                        'getPendingInvitations',
                        'sendInvitation',
                        'acceptInvitation',
                        'removeContact',
                        'blockContact',
                        'editContact',
                    ]),
                }
            ]
        });

        service = TestBed.inject(ContactsPageDataService);
        contactsService = TestBed.inject(ContactsService) as jasmine.SpyObj <ContactsService>;
    });

    function mockBase(): void {
        contactsService.getContacts.and.returnValue(
            of([
                {
                  id: 1,
                  contactUserId: 'contact-1',
                  nickName: 'Alex',
                  favorite: false,
                  createdAt: '2026-04-01T10:00:00.000Z',
                },
            ]),
        );

        contactsService.getPendingInvitations.and.returnValue(
            of([
                {
                    invitationId: 1,
                    senderUserId: 2,
                    senderEmail: 'test@email.com',
                    senderDisplayName: 'senderDisplayName',
                    nickName: 'nickName',
                    status: 'PENDING',
                    createdAt: '2026-04-19',
                }
            ])
        );

        contactsService.sendInvitation.and.returnValue(
            of({
                id: 'invitation-id-1',
                senderUserId: 'sender-user-id-1',
                recipientUserId: '1',
                nickName: 'nickName',
                status: 'PENDING',
                createdAt: '2026-04-19',
            })
        );
    }

    it('maps API responses into contacts page data', (done) => {
        mockBase();

        service.getPageData().subscribe((contactPageData) => {
            expect(contactPageData.contacts.length).toBe(1);
            expect(contactPageData.pendingInvitations.length).toBe(1);
            expect(contactPageData.pendingInvitations[0]).toEqual(
                jasmine.objectContaining({
                    invitationId: 1,
                    senderUserId: 2,
                    senderEmail: 'test@email.com',
                    senderDisplayName: 'senderDisplayName',
                    nickName: 'nickName',
                    status: 'PENDING',
                    createdAt: '2026-04-19',
                }),
            );

            expect(contactPageData.contacts[0]).toEqual(
                jasmine.objectContaining({
                    id: 1,
                    contactUserId: 'contact-1',
                    nickName: 'Alex',
                    favorite: false,
                    createdAt: '2026-04-01T10:00:00.000Z',
                }),
            );

            done();
        });
    });

    it('fails the whole contacts page when a core request fails', (done) => {
        mockBase();
    
        contactsService.getContacts.and.returnValue(
            throwError(() => new Error('Internal Server Error'))
        );
    
        service.getPageData().subscribe({
            next: () => fail('unexpected error'),
            error: (error: Error) => {
              expect(error.message).toBe('We couldn’t load your circle right now. Please try again.');
              done();
            },
        });
    });

    it('should delegate sendInvitation to ContactsService', (done) => {
        const input = {
            email: 'test@email.com',
            nickName: 'Nick',
        };

        const response = {
            id: 'invitation-id-1',
            senderUserId: 'sender-user-id-1',
            recipientUserId: '1',
            nickName: 'Nick',
            status: 'PENDING',
            createdAt: '2026-04-19',
        };

        contactsService.sendInvitation.and.returnValue(of(response));

        service.sendInvitation(input).subscribe((result) => {
            expect(contactsService.sendInvitation).toHaveBeenCalledWith(input);
            expect(result).toEqual(response);
            done();
        });
    });

    it('should delegate acceptInvitation to ContactsService', (done) => {
        contactsService.acceptInvitation.and.returnValue(of(void 0));

        service.acceptInvitation(123).subscribe(() => {
            expect(contactsService.acceptInvitation).toHaveBeenCalledWith(123);
            done();
        });
    });

    it('should delegate acceptInvitation to ContactsService', (done) => {
        contactsService.acceptInvitation.and.returnValue(of(void 0));

        service.acceptInvitation(123).subscribe(() => {
            expect(contactsService.acceptInvitation).toHaveBeenCalledWith(123);
            done();
        });
    });

    it('should delegate blockContact to ContactsService', (done) => {
        contactsService.blockContact.and.returnValue(of(void 0));

        service.blockContact(77).subscribe(() => {
            expect(contactsService.blockContact).toHaveBeenCalledWith(77);
            done();
        });
    });

    it('should delegate editContact to ContactsService', (done) => {
        const response = {
            id: 7,
            contactUserId: '7',
            nickName: 'Updated name',
            favorite: false,
            createdAt: '2026-04-19',
        };

        contactsService.editContact.and.returnValue(of(response));

        service.editContact(7, { nickName: 'Updated name', favorite: false }).subscribe((result) => {
            expect(contactsService.editContact).toHaveBeenCalledWith(7, {
                nickName: 'Updated name',
                favorite: false,
            });
            expect(result).toEqual(response);
            done();
        });
    });
});
