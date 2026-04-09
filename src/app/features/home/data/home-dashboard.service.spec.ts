import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { HomeDashboardService } from './home-dashboard.service';
import { UserService } from 'src/app/core/api/services/user.service';
import { ContactsService } from 'src/app/core/api/services/contacts.service';
import { AvailabilityService } from 'src/app/core/api/services/availability.service';

describe('HomeDashboardService', () => {
  let service: HomeDashboardService;
  let userService: jasmine.SpyObj<UserService>;
  let contactsService: jasmine.SpyObj<ContactsService>;
  let availabilityService: jasmine.SpyObj<AvailabilityService>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HomeDashboardService,
        {
          provide: UserService,
          useValue: jasmine.createSpyObj<UserService>('UserService', ['getMe']),
        },
        {
          provide: ContactsService,
          useValue: jasmine.createSpyObj<ContactsService>('ContactsService', [
            'getContacts',
            'getPendingInvitations',
          ]),
        },
        {
          provide: AvailabilityService,
          useValue: jasmine.createSpyObj<AvailabilityService>('AvailabilityService', [
            'getRules',
            'getEffectiveAvailability',
          ]),
        },
      ],
    });

    service = TestBed.inject(HomeDashboardService);
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    contactsService = TestBed.inject(ContactsService) as jasmine.SpyObj<ContactsService>;
    availabilityService = TestBed.inject(
      AvailabilityService,
    ) as jasmine.SpyObj<AvailabilityService>;
  });

  function mockBase(): void {
    userService.getMe.and.returnValue(
      of({
        id: 'user-1',
        displayName: 'Maya',
        timezone: 'UTC',
      }),
    );

    contactsService.getContacts.and.returnValue(
      of([
        {
          contactUserId: 'contact-1',
          nickName: 'Alex',
          favorite: false,
          createdAt: '2026-04-01T10:00:00.000Z',
        },
      ]),
    );

    contactsService.getPendingInvitations.and.returnValue(of([]));

    availabilityService.getRules.and.returnValue(
      of([
        {
          id: 'rule-1',
          dayOfWeek: 5,
          startTime: '18:00',
          endTime: '20:00',
          channelType: 'CHAT',
          enabled: true,
        },
      ]),
    );

    availabilityService.getEffectiveAvailability.and.returnValue(
      of([
        {
          startDateTime: '2026-04-10T18:00:00.000Z',
          endDateTime: '2026-04-10T20:00:00.000Z',
        },
      ]),
    );
  }

  it('maps API responses into dashboard state', (done) => {
    mockBase();

    service.getDashboardState(new Date('2026-04-10T09:00:00.000Z')).subscribe((state) => {
      expect(state.dashboard.displayName).toBe('Maya');
      expect(state.dashboard.contactsCount).toBe(1);
      expect(state.dashboard.pendingInvitationsCount).toBe(0);
      expect(state.dashboard.hasAvailabilityRules).toBeTrue();

      expect(state.dashboard.upcomingAvailability.length).toBe(1);
      expect(state.dashboard.upcomingAvailability[0]).toEqual(
        jasmine.objectContaining({
          label: 'Today',
          timeRange: '18:00–20:00',
          channel: 'Available',
          startDateTime: '2026-04-10T18:00:00.000Z',
          endDateTime: '2026-04-10T20:00:00.000Z',
        }),
      );

      done();
    });
  });

  it('computes ready readiness when contacts and enabled rules exist with no pending invitations', (done) => {
    mockBase();

    service.getDashboardState(new Date('2026-04-10T09:00:00.000Z')).subscribe((state) => {
      expect(state.readinessLevel).toBe('ready');
      expect(state.nextBestAction.kind).toBe('ready');
      done();
    });
  });

  it('prioritizes add first contact before all other actions', (done) => {
    mockBase();

    contactsService.getContacts.and.returnValue(of([]));

    service.getDashboardState(new Date('2026-04-10T09:00:00.000Z')).subscribe((state) => {
      expect(state.nextBestAction.kind).toBe('contacts');
      expect(state.nextBestAction.title).toBe('Add your first contact');
      done();
    });
  });

  it('Uses Set your availability when contacts exist but no enabled rules exist', (done) => {
    mockBase();

    availabilityService.getRules.and.returnValue(
      of([{
          id: 'rule-1',
          dayOfWeek: 5,
          startTime: '18:00',
          endTime: '20:00',
        channelType: 'CHAT',
          enabled: false,
        },
      ])
    );

    service.getDashboardState(new Date('2026-04-10T09:00:00.000Z')).subscribe((state) => {
      expect(state.dashboard.hasAvailabilityRules).toBeFalse();
      expect(state.nextBestAction.kind).toBe('availability');
      
      done();
    });
  });

  it('proritizes Review invitations after contacts and availability exist', (done) => {
    mockBase();

    contactsService.getPendingInvitations.and.returnValue(
      of([
        {
          invitationId: 'invite-1',
          senderUserId: 'sender-1',
          senderDisplayName: 'Nina',
          status: 'PENDING',
          createdAt: '2026-04-09T12:00:00.000Z',
        },
      ]),
    );

    service.getDashboardState(new Date('2026-04-10T09:00:00.000Z')).subscribe((state) => {
      expect(state.nextBestAction.kind).toBe('invitations');
      expect(state.nextBestAction.title).toBe('Review invitations');
      
      done();
    });
  });

  it('falls back to friendly displayName when missing', (done) => {
    mockBase();

    userService.getMe.and.returnValue(
      of({
        id: 'user-1,',
        displayName: null,
        timezone: 'UTC'
      }),
    );

    service.getDashboardState(new Date('2026-04-10T09:00:00.000Z')).subscribe((state) => {
      expect(state.dashboard.displayName).toBe('there');
      done();
    });
  });

  it('renders empty upcoming availability when there are no windows', (done) => {
    mockBase();

    availabilityService.getEffectiveAvailability.and.returnValue(
      of([]),
    );

    service.getDashboardState(new Date('2026-04-10T09:00:00.000Z')).subscribe((state) => {
      expect(state.dashboard.upcomingAvailability).toEqual([]);
      expect(state.availabilityErrorMessage).toBeNull();
      done();
    });
  });

  it('keeps dashboard working when availability preview fails', (done) => {
    mockBase();

    availabilityService.getEffectiveAvailability.and.returnValue(
      throwError(() => new Error()),
    );

    service.getDashboardState(new Date('2026-04-10T09:00:00.000Z')).subscribe((state) => {
      expect(state.dashboard.contactsCount).toBe(1);
      expect(state.dashboard.upcomingAvailability).toEqual([]);
      expect(state.availabilityErrorMessage).toBe('Upcoming availability could not be loaded right now.');
      done();
    });
  });

    it('fails the whole dashboard when a core request fails', (done) => {
    mockBase();

    userService.getMe.and.returnValue(
      throwError(() => new Error('user failed')),
    );

    service.getDashboardState(new Date('2026-04-10T09:00:00.000Z')).subscribe({
      next: () => fail('unexpected error'),
      error: (error: Error) => {
        expect(error.message).toBe('We couldn’t load your dashboard right now. Please try again.');
        done();
      },
    });
  });
});