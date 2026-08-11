export function isNextRedirectError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as {
    digest?: unknown;
    message?: unknown;
  };

  return (
    candidate.message === 'NEXT_REDIRECT' ||
    (typeof candidate.digest === 'string' && candidate.digest.startsWith('NEXT_REDIRECT'))
  );
}
