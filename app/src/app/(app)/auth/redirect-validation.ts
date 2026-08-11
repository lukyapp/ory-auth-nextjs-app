import 'server-only';

export function validateContinuationUrl(value: string, nodeEnv = process.env.NODE_ENV) {
  const url = new URL(value);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Continuation URL must use HTTP or HTTPS.');
  }
  if (nodeEnv === 'production' && url.protocol !== 'https:') {
    throw new Error('Continuation URL must use HTTPS in production.');
  }
  if (nodeEnv === 'production' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error('Continuation URL cannot use localhost in production.');
  }
  return url;
}

export function resolveRegisteredPostLogoutValues(
  requestUrl: string | null | undefined,
  registeredRedirects: string[],
  nodeEnv = process.env.NODE_ENV,
) {
  if (!requestUrl) return { redirectTo: null, state: null };
  const params = new URL(requestUrl, 'http://internal.invalid').searchParams;
  const requested = params.get('post_logout_redirect_uri')?.trim() || null;

  if (requested && !registeredRedirects.includes(requested)) {
    throw new Error('Unregistered post logout redirect URI.');
  }
  if (requested) validateContinuationUrl(requested, nodeEnv);
  return { redirectTo: requested, state: params.get('state')?.trim() || null };
}
