import 'server-only';
import type { OAuth2LogoutRequest } from '@ory/client-fetch';
import { HydraFlowError } from '../hydra-flow-error';
import { resolveRegisteredPostLogoutValues } from '../redirect-validation';

export function resolveRegisteredPostLogout(logoutRequest: OAuth2LogoutRequest) {
  try {
    return resolveRegisteredPostLogoutValues(
      logoutRequest.request_url,
      logoutRequest.client?.post_logout_redirect_uris ?? [],
    );
  } catch (error: unknown) {
    throw new HydraFlowError('Unregistered post logout redirect URI.', {
      cause: error,
      code: 'logout_redirect_invalid',
      description: 'The post-logout destination is not registered for this client.',
      status: 400,
    });
  }
}
