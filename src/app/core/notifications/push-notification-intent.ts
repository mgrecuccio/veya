export type PushNotificationIntentType =
  | 'MATCH_PROPOSAL_CREATED'
  | 'MATCH_PROPOSAL_ACCEPTED'
  | 'MATCH_SUGGESTIONS_AVAILABLE';

export interface PushNotificationIntent {
  type: PushNotificationIntentType;
  matchId?: number;
}

const SUPPORTED_INTENTS = new Set<PushNotificationIntentType>([
  'MATCH_PROPOSAL_CREATED',
  'MATCH_PROPOSAL_ACCEPTED',
  'MATCH_SUGGESTIONS_AVAILABLE',
]);

export function normalizePushNotificationIntent(
  data: unknown,
): PushNotificationIntent | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const payload = data as Record<string, unknown>;
  const rawType =
    payload['type'] ??
    payload['notificationType'] ??
    payload['eventType'] ??
    payload['intent'];

  if (typeof rawType !== 'string' || !SUPPORTED_INTENTS.has(rawType as PushNotificationIntentType)) {
    return null;
  }

  return {
    type: rawType as PushNotificationIntentType,
    matchId: parseOptionalNumber(payload['matchId'] ?? payload['match_id']),
  };
}

function parseOptionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
