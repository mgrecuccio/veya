import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
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
        id: 1,
        displayName: 'Maya',
        timezone: 'UTC',
        email: 'test@email.com',
        phoneNumber: '0032889944',
        status: 'ACTIVE'
      }),
    );

    contactsService.getContacts.and.returnValue(
      of([
        {
          id: 1,
          contactUserId: 2,
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
          id: 1,
          userId: 2,
          dayOfWeek: 'FRIDAY',
          startTime: '18:00',
          endTime: '20:00',
          channelType: 'CHAT',
          enabled: true,
          createdAt: '2026-04-10T09:00:00.000Z',
          updatedAt: '2026-04-10T09:00:00.000Z',
        },
      ]),
    );

    availabilityService.getEffectiveAvailability.and.returnValue(
      of([
        {
          startDateTime: '2026-04-10T18:00:00.000Z',
          endDateTime: '2026-04-10T20:00:00.000Z',
          channelType: 'CHAT',
        },
      ]),
    );
  }

  it('maps API responses into dashboard state', (done) => {
    mockBase();

    const now = new Date('2026-04-10T09:00:00.000Z');
    const expectedTo = new Date(now);
    expectedTo.setDate(expectedTo.getDate() + 1);
    expectedTo.setHours(0, 0, 0, 0);

    service.getDashboardState(now).subscribe((state) => {
      expect(state.dashboard.displayName).toBe('Maya');
      expect(state.dashboard.contactsCount).toBe(1);
      expect(state.dashboard.pendingInvitationsCount).toBe(0);
      expect(state.dashboard.hasAvailabilityRules).toBeTrue();

      expect(state.dashboard.upcomingAvailability.length).toBe(1);
      expect(state.dashboard.upcomingAvailability[0]).toEqual(
        jasmine.objectContaining({
          label: 'Today',
          timeRange: '18:00–20:00',
          startDateTime: '2026-04-10T18:00:00.000Z',
          endDateTime: '2026-04-10T20:00:00.000Z',
        }),
      );
      expect(availabilityService.getEffectiveAvailability).toHaveBeenCalledWith(
        '2026-04-10T09:00:00.000Z',
        expectedTo.toISOString(),
      );

      done();
    });
  });

  it('computes ready readiness when contacts exist with no pending invitations', (done) => {
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

  it('stays ready when contacts exist but no enabled rules exist', (done) => {
    mockBase();

    availabilityService.getRules.and.returnValue(
      of([{
          id: 1,
          userId: 2,
          dayOfWeek: 'MONDAY',
          startTime: '18:00',
          endTime: '20:00',
          channelType: 'CHAT',
          enabled: false,
          createdAt: '2026-04-10T09:00:00.000Z',
          updatedAt: '2026-04-10T09:00:00.000Z'
        },
      ])
    );

    service.getDashboardState(new Date('2026-04-10T09:00:00.000Z')).subscribe((state) => {
      expect(state.dashboard.hasAvailabilityRules).toBeFalse();
      expect(state.readinessLevel).toBe('ready');
      expect(state.nextBestAction.kind).toBe('ready');
      
      done();
    });
  });

  it('prioritizes Review invitations after contacts exist', (done) => {
    mockBase();

    contactsService.getPendingInvitations.and.returnValue(
      of([
        {
          invitationId: 1,
          senderUserId: 2,
          senderDisplayName: 'Nina',
          status: 'PENDING',
          createdAt: '2026-04-09T12:00:00.000Z',
        },
      ]),
    );

    service.getDashboardState(new Date('2026-04-10T09:00:00.000Z')).subscribe((state) => {
      expect(state.nextBestAction.kind).toBe('invitations');
      expect(state.nextBestAction.title).toBe('Review received invitations');
      expect(state.readinessLevel).toBe('almost-ready');
      
      done();
    });
  });

  it('does not include availability in setup progress', (done) => {
    mockBase();

    service.getDashboardState(new Date('2026-04-10T09:00:00.000Z')).subscribe((state) => {
      expect(state.setupItems.map((item) => item.key)).toEqual(['contacts', 'invitations']);
      expect(state.completedSetupItems).toBe(2);
      done();
    });
  });

  it('falls back to friendly displayName when missing', (done) => {
    mockBase();

    userService.getMe.and.returnValue(
      of({
        id: 1,
        displayName: null,
        timezone: 'UTC',
        email: 'test@email.com',
        phoneNumber: '0032889944',
        status: 'ACTIVE'
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
      expect(state.availabilityErrorMessage).toBe('Today’s availability could not be loaded right now.');
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

  it('preserves backend error code when a core request fails', (done) => {
      mockBase();

      userService.getMe.and.returnValue(
        throwError(() => new HttpErrorResponse({
          status: 422,
          error: {
            code: 'PHONE_NUMBER_REQUIRED',
            message: 'Phone number is required.',
          },
        })),
      );

      service.getDashboardState(new Date('2026-04-10T09:00:00.000Z')).subscribe({
        next: () => fail('unexpected error'),
        error: (error: Error & { code?: string }) => {
          expect(error.message).toBe('We couldn’t load your dashboard right now. Please try again.');
          expect(error.code).toBe('PHONE_NUMBER_REQUIRED');
          done();
        },
      });
  });
});
