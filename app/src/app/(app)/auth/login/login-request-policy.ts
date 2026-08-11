export function resolveLoginChallenge({
  flowLoginChallenge,
  queryLoginChallenge,
}: {
  flowLoginChallenge?: string | null;
  queryLoginChallenge?: string | null;
}) {
  const queryChallenge = normalizeOptionalString(queryLoginChallenge);
  const flowChallenge = normalizeOptionalString(flowLoginChallenge);

  if (queryChallenge && flowChallenge && queryChallenge !== flowChallenge) {
    return {
      loginChallenge: undefined,
      status: 'mismatch' as const,
    };
  }

  return {
    loginChallenge: queryChallenge ?? flowChallenge ?? undefined,
    status: 'ok' as const,
  };
}

export function resolveLoginRequestParameter({
  param,
  queryValue,
  requestUrl,
}: {
  param: string;
  queryValue?: string | null;
  requestUrl?: string | null;
}) {
  return resolveRequestUrlParam(requestUrl, param) ?? normalizeOptionalString(queryValue);
}

function resolveRequestUrlParam(requestUrl: string | null | undefined, param: string) {
  if (!requestUrl) {
    return undefined;
  }

  try {
    return normalizeOptionalString(new URL(requestUrl, 'http://localhost').searchParams.get(param));
  } catch {
    return undefined;
  }
}

function normalizeOptionalString(value: string | null | undefined) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}
