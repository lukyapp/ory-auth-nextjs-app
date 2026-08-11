import 'server-only';
import { env } from '@/check-env';
import {
  createAuthIntentTokenWithSecret,
  verifyAuthIntentTokenWithSecret,
  type AuthIntent,
  type AuthIntentAction,
} from './auth-intent-core';

export type { AuthIntent, AuthIntentAction };

export function createAuthIntentToken(intent: AuthIntent, now = Date.now()) {
  return createAuthIntentTokenWithSecret(env.AUTH_FLOW_SECRET, intent, now);
}

export function verifyAuthIntentToken(
  token: string | null | undefined,
  expectedIntent: AuthIntent,
  now = Date.now(),
) {
  return verifyAuthIntentTokenWithSecret(env.AUTH_FLOW_SECRET, token, expectedIntent, now);
}
