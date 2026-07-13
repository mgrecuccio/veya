import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { MatchesService } from "./matches.service"
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { SuggestedMatchView } from "../model/suggested-match-view.model";
import { environment } from "src/environments/environment";
import { MatchInvitationView } from "../model/match-invitation-view.model";
import { CreateMatchRequest } from "../request/create-match.request";
import { MatchView } from "../model/match-view.model";
import { ContactLinkView } from "../model/contact-link-view.model";


describe('MatchesService', () => {
    let service: MatchesService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                MatchesService,
                provideHttpClient(),
                provideHttpClientTesting()
            ],
        });

        service = TestBed.inject(MatchesService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should get all suggestions', () => {
        let mockSuggestions: SuggestedMatchView[] = [
            {
                candidateUserId: 1,
                nickName: 'CandidateNickname',
                favorite: true,
                channelType: 'CALL',
                score: 80,
                overlapStart: '2026-06-12T12:00:00Z',
                overlapEnd: '2026-06-12T14:00:00Z'
            }
        ];

        service.getSuggestions().subscribe(suggestions => {
            expect(suggestions).toEqual(mockSuggestions);
        });

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/v1/matches/suggestions`);
        expect(req.request.method).toBe('GET');
        req.flush(mockSuggestions);

    });

    it('should get all incoming', () => {
        let mockIncoming: MatchInvitationView[] = [
            {
                id: 1,
                initiatorUserId: 3,
                initiatorDisplayName: 'InitiatorName',
                channelType: 'CHAT',
                status: 'PROPOSED',
                score: 80,
                overlapStart: '2026-06-12T12:00:00Z',
                overlapEnd: '2026-06-12T12:00:00Z',
                createdAt: '2026-06-12T12:00:00Z',
                respondedAt: '2026-06-12T12:00:00Z'
            }
        ];

        service.getIncoming().subscribe(incoming => {
            expect(incoming).toEqual(mockIncoming);
        });

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/v1/matches/incoming`);
        expect(req.request.method).toBe('GET');
        req.flush(mockIncoming);
    });

    it('should get all accepted', () => {
        let mockAccepted: MatchInvitationView[] = [
            {
                id: 1,
                initiatorUserId: 3,
                initiatorDisplayName: 'InitiatorName',
                channelType: 'CHAT',
                status: 'ACCEPTED',
                score: 80,
                overlapStart: '2026-06-12T12:00:00Z',
                overlapEnd: '2026-06-12T12:00:00Z',
                createdAt: '2026-06-12T12:00:00Z',
                respondedAt: '2026-06-12T12:00:00Z'
            }
        ];

        service.getAccepted().subscribe(accepted => {
            expect(accepted).toEqual(mockAccepted);
        });

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/v1/matches/accepted`);
        expect(req.request.method).toBe('GET');
        req.flush(mockAccepted);
    });

    it('should create a match', () => {
        let mockCreateMatchRequest: CreateMatchRequest = {
            candidateUserId: 1,
            channelType: 'CHAT'
        };

        let mockMatchView: MatchView = {
            id: 1,
            candidateUserId: 1,
            channelType: 'CHAT',
            status: 'PROPOSED',
            score: 80,
            overlapStart: '2026-06-12T12:00:00Z',
            overlapEnd: '2026-06-12T13:00:00Z',
            createdAt: '2026-06-12T12:00:00Z',
            respondedAt: '2026-06-12T12:00:00Z'
        };

        service.createMatch(mockCreateMatchRequest).subscribe(response => {
            expect(response).toEqual(mockMatchView)
        });

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/v1/matches`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(mockCreateMatchRequest);
        req.flush(mockMatchView);
    });

    it('should accept a match request', () => {
        const mockMatchId = 1;

        let mockMatchView: MatchView = {
            id: 1,
            candidateUserId: 1,
            channelType: 'CHAT',
            status: 'PROPOSED',
            score: 80,
            overlapStart: '2026-06-12T12:00:00Z',
            overlapEnd: '2026-06-12T13:00:00Z',
            createdAt: '2026-06-12T12:00:00Z',
            respondedAt: '2026-06-12T12:00:00Z'
        };

        service.acceptMatch(mockMatchId).subscribe(response => {
            expect(response).toEqual(mockMatchView)
        });

        const req = httpMock.expectOne(
            `${environment.apiBaseUrl}/api/v1/matches/${mockMatchId}/accept`
        );
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toBeNull();
        req.flush(mockMatchView);
    });

    it('should decline a match request', () => {
        const mockMatchId = 1;

        let mockMatchView: MatchView = {
            id: 1,
            candidateUserId: 1,
            channelType: 'CHAT',
            status: 'DECLINED',
            score: 80,
            overlapStart: '2026-06-12T12:00:00Z',
            overlapEnd: '2026-06-12T13:00:00Z',
            createdAt: '2026-06-12T12:00:00Z',
            respondedAt: '2026-06-12T12:00:00Z'
        };

        service.declineMatch(mockMatchId).subscribe(response => {
            expect(response).toEqual(mockMatchView)
        });

        const req = httpMock.expectOne(
            `${environment.apiBaseUrl}/api/v1/matches/${mockMatchId}/decline`
        );
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toBeNull();
        req.flush(mockMatchView);
    });

    it('should create a contact link', () => {
        let mockMatchId = 1;

        let mockContactLinkView: ContactLinkView = {
            type: 'WHATSAPP',
            url: 'https://wa.me/32470123456',
            expiresAt: '2026-06-12T12:00:00Z'
        }

        service.createContactLink(mockMatchId).subscribe(response => {
            expect(response).toEqual(mockContactLinkView);
        });

        const req = httpMock.expectOne(
            `${environment.apiBaseUrl}/api/v1/matches/${mockMatchId}/contact-link`
        )
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toBeNull();
        req.flush(mockContactLinkView);
    });
})
