import { isNextRedirectError } from './is-next-redirect-error';

describe('isNextRedirectError', () => {
  it('returns true when the error message is NEXT_REDIRECT', () => {
    expect(isNextRedirectError({ message: 'NEXT_REDIRECT' })).toBe(true);
  });

  it('returns true when the digest starts with NEXT_REDIRECT', () => {
    expect(isNextRedirectError({ digest: 'NEXT_REDIRECT;replace;/dashboard' })).toBe(true);
  });

  it('returns false for non redirect errors', () => {
    expect(isNextRedirectError(new Error('Boom'))).toBe(false);
    expect(isNextRedirectError(null)).toBe(false);
    expect(isNextRedirectError({ digest: 'SOMETHING_ELSE' })).toBe(false);
  });
});
