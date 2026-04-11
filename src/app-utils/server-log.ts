type ServerLogMeta = Record<string, unknown>;

export function logInfo(event: string, meta: ServerLogMeta = {}) {
  console.info(formatEvent(event), sanitizeMeta(meta));
}

export function logWarn(event: string, meta: ServerLogMeta = {}) {
  console.warn(formatEvent(event), sanitizeMeta(meta));
}

export function logError(event: string, meta: ServerLogMeta = {}) {
  console.error(formatEvent(event), sanitizeMeta(meta));
}

function formatEvent(event: string) {
  return `[ory-auth-app] ${event}`;
}

function sanitizeMeta(meta: ServerLogMeta) {
  return Object.fromEntries(
    Object.entries(meta).map(([key, value]) => {
      if (typeof value === 'string' && value.length > 160) {
        return [key, `${value.slice(0, 157)}...`];
      }

      if (value instanceof Error) {
        return [
          key,
          {
            message: value.message,
            name: value.name,
          },
        ];
      }

      return [key, value];
    }),
  );
}
