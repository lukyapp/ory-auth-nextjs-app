import { HydraFlowError, toErrorPageHref, toErrorResponse } from './hydra-flow-error';

describe('toErrorPageHref', () => {
  it('returns an auth error page href for Hydra flow errors', () => {
    const error = new HydraFlowError('Login failed', {
      code: 'hydra_login_accept_failed',
      description: 'Unable to continue the login flow right now.',
      status: 500,
    });

    expect(toErrorPageHref(error)).toBe(
      '/error?error=hydra_login_accept_failed&error_description=Unable+to+continue+the+login+flow+right+now.',
    );
  });

  it('returns a generic auth error page href for unknown errors', () => {
    expect(toErrorPageHref(new Error('Boom'))).toBe(
      '/error?error=auth_flow_error&error_description=Boom',
    );
  });
});

describe('toErrorResponse', () => {
  it('returns the explicit Hydra status and code for Hydra flow errors', () => {
    const error = new HydraFlowError('Consent failed', {
      code: 'hydra_consent_accept_failed',
      description: 'Unable to continue the consent flow right now.',
      status: 400,
    });

    expect(toErrorResponse(error, 'fallback')).toEqual({
      body: {
        code: 'hydra_consent_accept_failed',
        error: 'Unable to continue the consent flow right now.',
      },
      status: 400,
    });
  });

  it('returns a generic 500 response for unknown errors', () => {
    expect(toErrorResponse(new Error('Unexpected failure'), 'fallback')).toEqual({
      body: {
        code: 'auth_flow_error',
        error: 'Unexpected failure',
      },
      status: 500,
    });
  });
});
