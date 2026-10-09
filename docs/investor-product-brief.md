# Veya — Investor Product Brief

**Confidential discussion draft · 7 October 2026**

> **One-line proposition:** Veya is a private social coordination app that helps people reconnect with friends they already trust when their availability naturally overlaps.

## Executive summary

Modern communication tools make it easy to message anyone, but they do not solve a more basic problem: knowing **who is available, at the same time, and genuinely open to reconnecting**. Plans are often lost in group-chat friction, uncertain schedules, and the social cost of repeatedly asking.

Veya turns that coordination problem into a lightweight, consent-based loop:

1. Build a private circle of trusted contacts.
2. Express recurring or one-off availability and a preferred channel, such as chat or call.
3. Receive suggestions only when availability and preferences align.
4. Propose a reconnection without exposing private calendar details.
5. Continue only after the other person accepts, then move into an existing communication channel such as WhatsApp.

Veya is not a dating app, a public social network, or another full calendar. It is a **serendipity engine for existing relationships**: a layer between having free time and actually spending it with someone who matters.

The product is at a beta-stage implementation rather than a validated commercial stage. The current mobile codebase contains the central contact, availability, suggestion, mutual-consent, and messaging-handoff flows. The next investment case should therefore be built around proving network density, repeat use, and successful real-world reconnections—not around claiming product-market fit before the evidence exists.

## Mission and vision

### Mission

**Help people maintain meaningful relationships by making it effortless, private, and timely to reconnect when both people have space.**

### Vision

Veya can become the trusted availability layer for personal relationships: the place that understands when someone is open to connection, identifies the right person in their existing circle, obtains mutual consent, and hands the conversation to the channel people already use.

### The human problem

The issue is not a lack of contacts. It is the widening gap between the intention to stay connected and the moment when contact actually happens. Veya addresses three kinds of friction:

- **Timing friction:** people do not know when their free time overlaps.
- **Initiation friction:** reaching out can feel intrusive when the other person's context is unknown.
- **Planning friction:** even a simple call or coffee can become a long scheduling exchange.

This is a meaningful and widespread problem. The World Health Organization reported in 2025 that roughly one in six people globally experiences loneliness, while the European Commission's 2022 EU-wide survey found that 13% of respondents felt lonely most or all of the time and 35% felt lonely at least some of the time. Veya should not present itself as a treatment for loneliness; these findings establish the importance of social connection and the scale of the unmet human need. [WHO Commission on Social Connection](https://www.who.int/publications/i/item/978240112360), [European Commission Joint Research Centre](https://joint-research-centre.ec.europa.eu/scientific-activities/survey-methods-and-analysis-centre/loneliness/loneliness-prevalence-eu_en)

## How Veya works

| Stage | User action | What Veya contributes |
| --- | --- | --- |
| 1. Trusted circle | Invite or accept people the user already knows | A private, permissioned social graph rather than public discovery |
| 2. Availability | Define recurring windows, temporary availability/unavailability, or signal “Free now” | Intent and timing without publishing an entire calendar |
| 3. Matching | Select chat or call preferences and receive a small set of suggestions | Backend-computed overlap, preference checks, and prioritisation |
| 4. Mutual consent | Propose, accept, or decline a reconnection | Low-pressure coordination; neither party is connected automatically |
| 5. Handoff | Open the accepted connection in WhatsApp | Immediate action in a familiar channel rather than forcing a new chat habit |

The core product loop is deliberately narrow:

**availability → relevant suggestion → proposal → mutual acceptance → conversation**

That focus matters. Veya does not need to replace calendars, messaging apps, or event platforms to create value; it connects them at the point where existing tools are weak.

## Product foundations

### 1. Existing relationships over follower graphs

Veya starts with people the user already knows. This reduces discovery risk, supports relevance from the first useful match, and positions the product around relationship maintenance rather than audience building.

### 2. Privacy by product design

The experience is invite-only and exposes availability windows rather than the content of a user's calendar. Contact details are not meant to appear throughout the interface, and WhatsApp links are generated by the backend only after an accepted match.

### 3. Consent before contact

A suggestion is not a connection. One person proposes and the other accepts or declines. This creates a clear boundary and lowers the pressure of unsolicited communication.

### 4. Context, not just time

Availability can be recurring or temporary and can distinguish between a chat and a call. Quiet hours and notification preferences let the product respect the user's rhythm.

### 5. Low-friction completion

Veya's job ends when the reconnection begins. Handing an accepted match to WhatsApp avoids asking users to rebuild communication behaviour inside another inbox.

### 6. Backend authority and safety

Matching decisions, accepted state, and contact links come from the backend. Push notifications are treated as prompts to refresh authoritative state, not as trusted records. This reduces stale-state and privacy risks.

## Current feature set

### Account and trust

- Registration, login, password recovery, token refresh, and protected routes
- Phone verification and phone-number setup
- Profile, timezone, password, notification preferences, logout, and account deletion
- User-controlled chat/call matching and quiet hours

### Trusted contacts

- Phone-number invitations, including a native single-contact picker
- Accept, reject, and cancel invitation flows
- Contact nickname and favourite status
- Remove, block, unblock, and blocked-contact management

### Availability

- Recurring weekly availability rules
- Chat or call as the intended availability channel
- One-off available and unavailable overrides
- Effective availability preview and a home readiness dashboard
- “Free now” interface for spontaneous intent

### Matching and reconnection

- Backend-computed match suggestions
- Proposal creation
- Incoming proposal accept/decline
- Accepted-match list and detail
- Backend-generated WhatsApp handoff
- Business-error handling for expired, duplicate, blocked, low-score, missing-overlap, and missing-phone scenarios

### Mobile delivery

- Shared Angular/Ionic application with native iOS and Android shells
- Push-token registration and notification-routing logic
- Responsive loading, empty, error, and retry states

## Product and technical status

The repository demonstrates a substantive mobile client rather than a slide-only concept:

- Angular 20, Ionic 8, Capacitor 8, TypeScript, RxJS, and SCSS
- Feature-oriented separation between UI, application state, typed API services, and authentication
- Native iOS and Android projects
- Unit tests around API contracts and key product flows
- Production API configuration and a backend-authoritative matching model
- TypeScript validation passing on 7 October 2026

The responsible investor description is **“beta-stage product with the core loop implemented”**, not “production-proven platform.” Before a public pilot, the team should complete and evidence:

- Persistence/backend integration for the current “Free now” home toggle
- End-to-end testing of the complete two-user flow on physical devices
- Production Firebase/APNs configuration and delivery verification
- Privacy documentation, consent language, retention/deletion verification, and GDPR review
- Instrumentation for activation, match quality, reconnection outcomes, retention, and invite conversion
- Reconciliation of implementation status with internal product/spec documentation

## Why the opportunity is interesting

### A large need sits between communication and scheduling

Messaging apps solve conversation after someone decides to reach out. Calendars solve personal time management. Event planners solve organised group activity. Veya targets the under-served moment in between: **“I have time and would enjoy connecting—who in my circle is also receptive?”**

### The product can generate a meaningful network effect

Each additional trusted contact increases the probability of useful overlap for the inviting user and gives the invited person an immediate connection. This is a local, reciprocal network effect rather than a public follower effect. The key qualification is density: a user with one inactive contact receives little value, while a group with several active contacts can experience frequent matches.

### The category has visible demand validation

Howbout, a social calendar and adjacent competitor, says its product has reached 10 million users and 200 million plans, while public reporting in 2024 described an $8 million Series A and more than $13 million raised in total. That does not validate Veya's exact proposition, but it shows consumer demand and investor interest in products that use time to strengthen real-world relationships. [Howbout App Store listing](https://apps.apple.com/us/app/howbout-shared-calendar/id1477248221), [TechCrunch funding report](https://techcrunch.com/2024/09/13/howbout-raises-8m-from-goodwater-to-build-a-calendar-that-you-can-share-with-your-friends/)

### Veya can occupy a distinct position

The differentiation is not simply “see when friends are free.” It is the combination of:

- a closed, trusted graph;
- selective availability rather than full-calendar sharing;
- a small number of computed suggestions rather than calendar browsing;
- explicit mutual consent;
- support for spontaneous moments; and
- handoff to an existing channel rather than a replacement messenger.

### The architecture supports efficient cross-platform iteration

One Angular/Ionic codebase targets web technology, iOS, and Android while keeping matching and privacy-sensitive decisions server-side. This can support a capital-efficient pilot, although scale economics cannot be assessed until backend operating data is available.

## Market analysis

### Category definition

Veya sits at the intersection of four established behaviours:

1. private social networking;
2. personal scheduling and availability;
3. friend and relationship maintenance; and
4. messaging-channel initiation.

It should initially be described as a **private social coordination** product. Calling it only a calendar app understates matching and consent; calling it a social network invites comparison with public feeds and discovery products that it intentionally avoids.

### Market signals

- The EU had approximately **450.4 million residents** on 1 January 2025. [Eurostat](https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20250711-1)
- In 2025, **93.8%** of EU residents aged 16–74 had recently used the internet, **82.3%** used instant messaging, **75.7%** made internet calls, and **67.3%** participated in social networks. These are behaviours directly adjacent to Veya's use case. [Eurostat, Key figures on Europe 2026](https://ec.europa.eu/eurostat/documents/15216629/23964567/KS-01-26-035-EN-N.pdf)
- **89.3% of EU 16–29-year-olds** used online social networks in 2025, making younger adults a digitally reachable starting segment. [Eurostat](https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20260409-1)
- Belgium, a practical launch market for the current team, had **11.87 million residents** at the start of 2026. [Statbel](https://statbel.fgov.be/en/themes/population/structure-population)

These figures establish reachability, not demand for Veya. The investable question is what fraction of digitally active adults has both an unmet coordination problem and enough participating friends to experience the product's value.

### Directional market sizing

Because Veya has no validated price or conversion rate yet, user-based sizing is more honest than quoting a large third-party “social networking market” revenue number.

| Layer | Definition | Directional size | Interpretation |
| --- | --- | ---: | --- |
| TAM | Digitally active European adults who use social/messaging tools and maintain personal relationships | **100m+ potential users** | A broad behavioural ceiling, not a forecast. EU digital usage supports this order of magnitude. |
| Initial SAM | Socially active adults in Belgium, then nearby dense European markets, who regularly struggle to coordinate with existing friends | **1–5m potential users** | A planning range to validate through research; it is not yet supported by Veya usage data. |
| 3-year SOM target | Users reachable through focused city/community launches and invitation loops | **100k–500k MAU** | An execution target requiring evidence of strong invite conversion, network density, and retention. |

The TAM is intentionally expressed as an order of magnitude. Applying unrelated market-report revenue forecasts would create false precision. The next financing milestone should replace the SAM and SOM assumptions with observed funnel data from one dense launch geography.

### Competitive landscape

| Alternative | What it does well | Gap Veya can target |
| --- | --- | --- |
| WhatsApp and other messengers | Ubiquitous conversation and group coordination | Users still need to decide whom to contact and whether the moment is appropriate |
| Shared social calendars such as Howbout | Calendar visibility, event planning, group coordination | Veya can require less schedule disclosure and focus on computed one-to-one opportunities |
| Doodle and scheduling tools | Efficiently select a time for an already intended meeting | They do not create the intention or identify the right existing contact |
| Meetup and interest communities | Discover people and organised events | Veya is for private, existing relationships rather than strangers or public groups |
| Friend-discovery and friendship apps | Expand a social graph | Veya helps activate a graph the user already has |
| Doing nothing / ad hoc messaging | Familiar and free | High initiation friction, repeated coordination, and missed overlap remain unsolved |

The strongest competitive threat is not a direct clone; it is the habit of using a messenger plus a calendar. Veya must prove that its suggestion layer creates enough incremental reconnections to earn a recurring place on the phone.

## Business model hypotheses

Monetisation should follow engagement proof. Charging too early can suppress the network density the product needs.

### Recommended sequence

1. **Free core product:** contacts, availability, proposals, acceptance, and basic handoff remain free to maximise useful network formation.
2. **Consumer premium:** test features such as advanced availability patterns, calendar integrations, larger circles, travel/timezone intelligence, personal connection insights, and enhanced notification controls.
3. **Selective partnerships:** later test privacy-compatible partnerships with venues or activities at the moment two people decide to meet. Avoid selling personal relationship or availability data.

### Illustrative revenue scenarios

These examples are arithmetic, not forecasts:

| MAU | Paid conversion | Monthly price | Approximate subscription ARR |
| ---: | ---: | ---: | ---: |
| 100,000 | 3% | €3.99 | €144k |
| 500,000 | 4% | €3.99 | €958k |
| 1,000,000 | 5% | €4.99 | €2.99m |

Figures are gross, before app-store fees, VAT, churn, discounts, support, and infrastructure. The first monetisation experiment should measure willingness to pay without restricting the core network loop.

## Go-to-market thesis

Veya should optimise for **density before breadth**. A scattered national launch can create many registered users with nobody relevant available; a concentrated group can experience the product immediately.

### Beachhead

- Start in Belgium with urban, mobile-first adults who have established but difficult-to-coordinate friendships.
- Recruit small pre-existing clusters—friend groups, alumni groups, sports communities, coworking communities, and internationally mobile professionals.
- Onboard groups together and aim for at least 5–8 relevant contacts per activated user.

### Growth loop

1. A user joins with a concrete invitation from someone they know.
2. Both users express availability and receive value from their first overlap.
3. Each adds more trusted contacts to increase match frequency.
4. A successful reconnection provides the reason to return and invite again.

Generic paid acquisition should remain secondary until Veya demonstrates that an acquired cluster—not just an individual—activates and retains.

## Metrics investors should expect

### North-star metric

**Successful reconnections per weekly active user**, confirmed through an accepted match followed by a handoff or lightweight post-match confirmation.

### Activation

- Registration and phone-verification completion
- Percentage of new users with 3, 5, and 8 accepted contacts
- Percentage setting at least one availability window
- Time to first eligible overlap and first accepted match

### Network and match quality

- Invitation acceptance and invite-to-activation rates
- Eligible overlaps per active user per week
- Suggestion-to-proposal and proposal-to-acceptance rates
- Handoff rate after acceptance
- Decline, expiry, block, and notification-opt-out rates

### Retention

- Week 1, week 4, and week 12 retention by contact density
- Weekly availability-setting rate
- Successful reconnections per retained cohort
- Percentage of groups with multiple active members

### Economics

- Cost per activated cluster, not only cost per install
- Viral coefficient and invitations per activated user
- Premium trial, conversion, churn, and net revenue retention if subscriptions launch

## Key risks and how to test them

| Risk | Why it matters | Earliest useful test |
| --- | --- | --- |
| Cold start and low density | The product is weak when few trusted contacts are active | Cohort users in groups; compare retention by accepted-contact count |
| Insufficient frequency | Free time overlap may not occur often enough to form a habit | Measure eligible overlaps and successful reconnections per user/week |
| Privacy sensitivity | Availability and phone data require high trust | Test progressive disclosure, clear consent, and privacy comprehension before launch |
| Social discomfort | Suggestions or proposals may feel awkward | Measure proposal/decline behaviour and conduct qualitative follow-ups |
| Incumbent response | Calendars or messengers could reproduce features | Build differentiated matching data, trust, brand, and outcome learning—not only UI features |
| Weak monetisation | The core utility may be expected to remain free | Validate premium willingness only after strong retention cohorts emerge |
| Notification fatigue | Too many prompts can cause opt-outs and churn | Cap suggestions, respect quiet hours, and optimise for accepted outcomes rather than sends |
| Execution readiness | Native push, two-user state, and “Free now” must work reliably | Complete a device-level release checklist before recruiting a larger pilot |

## What can become defensible

The current technology stack alone is not a moat. Defensibility can emerge from:

- **Trusted graph density:** active reciprocal networks are harder to displace than downloaded apps.
- **Match-quality learning:** outcome data can improve when, how, and whom to suggest without exposing calendar contents.
- **Privacy reputation:** consistent restraint around personal schedules and contact data can become a brand asset.
- **Behavioural habit:** becoming the default place to express social availability creates durable intent data.
- **Distribution loops:** successful reconnections naturally involve and recruit another known person.

Each of these must be measured; none should yet be presented as an achieved moat.

## Proposed 12–18 month plan

### Phase 1 — Pilot readiness (0–3 months)

- Complete “Free now” persistence and full two-user device testing
- Finish production push configuration and observability
- Complete privacy/GDPR and app-store readiness work
- Add outcome analytics and recruit 10–20 dense pilot groups

### Phase 2 — Prove the loop (3–6 months)

- Demonstrate first-match speed, invitation acceptance, and repeated reconnections
- Improve onboarding until new groups reach useful contact density
- Tune suggestion limits, timing, and notification relevance
- Establish qualitative evidence that Veya creates meetings or calls that otherwise would not happen

### Phase 3 — Repeatable local growth (6–12 months)

- Expand within one or two dense Belgian cities or communities
- Test calendar integration without requiring full-calendar disclosure
- Build referral mechanics around successful outcomes
- Identify the strongest segment based on retention, not assumptions

### Phase 4 — Monetisation and geographic replication (12–18 months)

- Test a premium tier with retained cohorts
- Replicate the launch playbook in a second market or language region
- Evaluate partnerships only where they strengthen the reconnection outcome and preserve trust

## Investment thesis

Veya is interesting if an investor believes five things:

1. Existing friendships are valuable but systematically under-served by current social products.
2. Availability and mutual intent can unlock interactions that messaging alone does not create.
3. A private, consent-based design can earn trust where full calendar sharing or public broadcasting cannot.
4. Dense invitation-led networks can produce efficient, compounding distribution.
5. The current beta is sufficient to test these beliefs without first funding a long foundational build.

The opportunity is real, but the decisive evidence is still ahead. The next round of work should be judged on **validated reconnection outcomes and cohort retention**, not downloads or total registrations.

## 30-second pitch

> We all have people we care about and intend to see more often, but modern life makes timing and initiation surprisingly hard. Veya is a private, invite-only app that finds moments when trusted friends are both free and open to reconnecting. Users share selective availability—not their full calendar—receive a few relevant suggestions, and connect only after mutual consent. Veya then hands the conversation to a familiar channel such as WhatsApp. The core mobile product is already implemented; the next step is to prove that dense local groups create repeated real-world reconnections and a scalable invitation loop.

## Diligence notes

- Product and implementation statements were checked against the Veya frontend repository on 7 October 2026.
- Market figures use the latest accessible official or first-party sources as of that date.
- Market-size ranges and revenue tables are explicit planning assumptions, not audited forecasts.
- No claims about registered users, active users, revenue, retention, partnerships, or completed reconnections are made because no such evidence is present in the repository.
