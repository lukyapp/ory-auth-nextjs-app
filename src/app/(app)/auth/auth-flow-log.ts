type AuthFlowLogMeta = Record<string, unknown>;

export function logAuthFlow(event: string, meta: AuthFlowLogMeta = {}) {
  console.info(`[auth-flow] ${event}`, sanitizeMeta(meta));
}

function sanitizeMeta(meta: AuthFlowLogMeta) {
  const sanitized = Object.fromEntries(
    Object.entries(meta).map(([key, value]) => {
      if (typeof value === 'string' && value.length > 120) {
        return [key, `${value.slice(0, 117)}...`];
      }

      return [key, value];
    }),
  );

  return sanitized;
}
