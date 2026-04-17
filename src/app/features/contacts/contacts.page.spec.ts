import { fakeAsync, flushMicrotasks, TestBed } from "@angular/core/testing";
import { ContactsPage } from "./contacts.page";
import { ContactsPageDataService } from "./data/contacts-page-data.service";
import { ActionSheetController, AlertController } from '@ionic/angular';
import { of, Subject, throwError } from "rxjs";


describe('ContactsPage', () => {
    let fixture: any;
    let component: ContactsPage;
    let dataService: jasmine.SpyObj<ContactsPageDataService>;
    let actionSheetController: jasmine.SpyObj<ActionSheetController>;
    let alertController: jasmine.SpyObj<AlertController>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContactsPage],
            providers: [
                {
                    provide: ContactsPageDataService,
                    useValue: jasmine.createSpyObj<ContactsPageDataService>(
                        'ContactsPageDataService',
                        [
                            'getPageData',
                            'sendInvitation',
                            'acceptInvitation',
                            'removeContact',
                            'blockContact',
                            'editContact',
                        ],
                    ),
                },
                {
                    provide: ActionSheetController,
                    useValue: jasmine.createSpyObj<ActionSheetController>(
                        'ActionSheetController',
                        [
                            'create',
                        ],
                    ),
                },
                {
                    provide: AlertController,
                    useValue: jasmine.createSpyObj<AlertController>(
                        'AlertController',
                        [
                            'create',
                        ],
                    ),
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ContactsPage);
        component = fixture.componentInstance;
        dataService = TestBed.inject(ContactsPageDataService) as jasmine.SpyObj<ContactsPageDataService>;
        actionSheetController = TestBed.inject(ActionSheetController) as jasmine.SpyObj<ActionSheetController>;
        alertController = TestBed.inject(AlertController) as jasmine.SpyObj<AlertController>;
    });

    it('should emit loading then success', (done) => {
        dataService.getPageData.and.returnValue(
            of({
                contacts: [],
                pendingInvitations: [],
            })
        );

        const states: string[] = [];

        component.vmState$.subscribe((state) => {
            states.push(state.kind);

            if (state.kind === 'success') {
                expect(states).toEqual(['loading', 'success']);
                expect(state.data.showFullyEmptyState).toBeTrue();
                done();
            }
        });
    });

    it('should emit loading then error when page load fails', (done) => {
        dataService.getPageData.and.returnValue(
            throwError(() => new Error('Load failed'))
        );

        const states: string[] = [];

        component.vmState$.subscribe((state) => {
            states.push(state.kind);

            if (state.kind === 'error') {
                expect(states).toEqual(['loading', 'error']);
                expect(state.message).toBe('Load failed');
                done();
            }
        });
    });

    it('should reload when retry is called', () => {
        dataService.getPageData.and.returnValue(
            of({ contacts: [], pendingInvitations: [] })
        );

        const sub = component.vmState$.subscribe();
        expect(dataService.getPageData).toHaveBeenCalledTimes(1);

        component.retry();
        expect(dataService.getPageData).toHaveBeenCalledTimes(2);

        sub.unsubscribe();
    });

    it('should open the invite panel', () => {
        component.openInvite();
        expect(component.inviteExpanded()).toBeTrue();
    });

    it('should close the panel and reset the form', () => {
        component.inviteForm.setValue({
            email: 'test@email.com',
            nickName: 'nickName',
        });

        component.inviteExpanded.set(true);
        component.closeInvite();

        expect(component.inviteExpanded()).toBeFalse();
        expect(component.inviteForm.getRawValue()).toEqual({
            email: '',
            nickName: '',
        });
    });

    it('should not submit the invite when form is invalid', fakeAsync(() => {
        component.inviteForm.setValue({
            email: '',
            nickName: '',
        });

        component.submitInvite();
        flushMicrotasks();

        expect(dataService.sendInvitation).not.toHaveBeenCalled();
    }));

    it('should handle invite submit success', fakeAsync(() => {
        dataService.sendInvitation.and.returnValue(of({} as any));
        dataService.getPageData.and.returnValue(
            of({ contacts: [], pendingInvitations: [] })
        );

        spyOn(component, 'retry');

        component.inviteExpanded.set(true);
        component.inviteForm.setValue({
            email: 'test@email.com',
            nickName: 'Nick',
        });

        component.submitInvite();

        expect(component.inviteSubmitting()).toBeFalse();
        expect(component.inviteExpanded()).toBeFalse();
        expect(component.retry).toHaveBeenCalled();

        flushMicrotasks();

        expect(component.toastState()).toEqual({
            isOpen: true,
            message: 'Invitation sent.',
            color: 'success',
        });
    }));

    it('should set busy id and clear it after accepting invitation', async () => {
        const response$ = new Subject<void>();
        dataService.acceptInvitation.and.returnValue(response$);
        const present = jasmine.createSpy('present').and.returnValue(Promise.resolve());
        alertController.create.and.returnValue(Promise.resolve({ present } as any));
        spyOn(component, 'retry');

        component.acceptInvitation({
            id: 10,
            displayLabel: 'Alex',
            nickName: 'Alex',
            senderUserId: 42,
            initials: 'A',
            createdAt: null,
            createdLabel: 'today',
        });

        expect(component.rowActionBusyId()).toBe(10);
        expect(dataService.acceptInvitation).toHaveBeenCalledWith(10);

        response$.next();
        response$.complete();

        expect(component.rowActionBusyId()).toBeNull();
        expect(component.retry).toHaveBeenCalled();
        await Promise.resolve();
        expect(alertController.create).toHaveBeenCalled();
        expect(present).toHaveBeenCalled();
    });

    it('should ignore acceptInvitation when another row action is busy', () => {
        component.rowActionBusyId.set(99);

        component.acceptInvitation({
            id: 10,
            displayLabel: 'Alex',
            nickName: 'Alex',
            senderUserId: 42,
            initials: 'A',
            createdAt: null,
            createdLabel: 'today',
        });

        expect(dataService.acceptInvitation).not.toHaveBeenCalled();
    });

    it('should create and present an action sheet for a managing a contact', async() => {
        const present = jasmine.createSpy('present').and.returnValue(Promise.resolve());
        actionSheetController.create.and.returnValue(
            Promise.resolve({ present } as any)
        );

        await component.openContactActions({
            id: 1,
            displayLabel: 'Alex',
            nickName: 'Alex',
            initials: 'A',
            favorite: false,
            createdAt: null,
            createdLabel: 'today',
        });

        expect(actionSheetController.create).toHaveBeenCalled();
        expect(present).toHaveBeenCalled();
    });
});
