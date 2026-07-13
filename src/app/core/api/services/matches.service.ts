import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { SuggestedMatchView } from "../model/suggested-match-view.model";
import { MatchInvitationView } from "../model/match-invitation-view.model";
import { CreateMatchRequest } from "../request/create-match.request";
import { MatchView } from "../model/match-view.model";
import { ContactLinkView } from "../model/contact-link-view.model";

@Injectable({ providedIn: 'root' })
export class MatchesService {
    private readonly http = inject(HttpClient);
    private readonly apiBaseUrl = environment.apiBaseUrl;

    getSuggestions(): Observable<SuggestedMatchView[]> {
        return this.http.get<SuggestedMatchView[]>(`${this.apiBaseUrl}/api/v1/matches/suggestions`);
    }

    getIncoming(): Observable<MatchInvitationView[]> {
        return this.http.get<MatchInvitationView[]>(`${this.apiBaseUrl}/api/v1/matches/incoming`);
    }

    getAccepted(): Observable<MatchInvitationView[]> {
        return this.http.get<MatchInvitationView[]>(`${this.apiBaseUrl}/api/v1/matches/accepted`);
    }

    createMatch(payload: CreateMatchRequest): Observable<MatchView> {
        return this.http.post<MatchView>(
            `${this.apiBaseUrl}/api/v1/matches`,
            payload
        );
    }

    acceptMatch(id: number): Observable<MatchView> {
        return this.http.patch<MatchView>(
            `${this.apiBaseUrl}/api/v1/matches/${id}/accept`,
            null,
        );
    }

    declineMatch(id: number): Observable<MatchView> {
        return this.http.patch<MatchView>(
            `${this.apiBaseUrl}/api/v1/matches/${id}/decline`,
            null,
        );
    }

    createContactLink(matchId: number): Observable<ContactLinkView> {
        return this.http.post<ContactLinkView>(
            `${this.apiBaseUrl}/api/v1/matches/${matchId}/contact-link`,
            null
        )
    }

}
