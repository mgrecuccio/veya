import { normalizePushNotificationIntent } from './push-notification-intent';

describe('normalizePushNotificationIntent', () => {
  it('should normalize supported notification types', () => {
    expect(normalizePushNotificationIntent({
      type: 'MATCH_PROPOSAL_CREATED',
      matchId: '42',
    })).toEqual({
      type: 'MATCH_PROPOSAL_CREATED',
      matchId: 42,
    });
  });

  it('should support backend metadata aliases', () => {
    expect(normalizePushNotificationIntent({
      notificationType: 'MATCH_SUGGESTIONS_AVAILABLE',
      match_id: 7,
    })).toEqual({
      type: 'MATCH_SUGGESTIONS_AVAILABLE',
      matchId: 7,
    });
  });

  it('should ignore unknown notification payloads', () => {
    expect(normalizePushNotificationIntent({ type: 'CONTACT_PHONE_READY' })).toBeNull();
    expect(normalizePushNotificationIntent(null)).toBeNull();
  });
});
