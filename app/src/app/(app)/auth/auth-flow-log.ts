import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { logInfo } from '@/app-utils/server-log';

type AuthFlowLogMeta = Record<string, unknown>;

export function logAuthFlow(event: string, meta: AuthFlowLogMeta = {}) {
  logInfo(
    `auth-flow.${event}`,
    sanitizeAuthLogMeta({ correlationId: resolveCorrelationId(meta), ...meta }),
  );
}

export function sanitizeAuthLogMeta(meta: AuthFlowLogMeta) {
  const sanitized = Object.fromEntries(
    Object.entries(meta).map(([key, value]) => {
      if (
        typeof value === 'string' &&
        key !== 'errorCode' &&
        /(challenge|subject|identifier|email|token|code|verifier|identityId|flowId|sessionId|accountId|state$)/i.test(
          key,
        )
      ) {
        return [key, fingerprint(value)];
      }

      if (typeof value === 'string' && /(redirect|returnTo|requestUrl|uiAction)/i.test(key)) {
        return [key, summarizeUrl(value)];
      }

      if (typeof value === 'string' && value.length > 120) {
        return [key, `${value.slice(0, 117)}...`];
      }

      return [key, value];
    }),
  );

  return sanitized;
}

function resolveCorrelationId(meta: AuthFlowLogMeta) {
  const source = Object.entries(meta).find(
    ([key, value]) =>
      typeof value === 'string' && /(challenge|subject|identityId|flowId|sessionId)/i.test(key),
  )?.[1];
  return createHash('sha256')
    .update(typeof source === 'string' ? source : randomUUID())
    .digest('hex')
    .slice(0, 12);
}

function fingerprint(value: string) {
  return `sha256:${createHash('sha256').update(value).digest('hex').slice(0, 12)}`;
}

function summarizeUrl(value: string) {
  try {
    const url = new URL(value, 'http://internal.invalid');
    return url.origin === 'http://internal.invalid' ? url.pathname : `${url.origin}${url.pathname}`;
  } catch {
    return '[invalid-url]';
  }
}
