import 'server-only';
import { getServerSession } from '@ory/nextjs/app';
import { getOAuth2ApiFetchClient } from '@ory/sdk/server';
import { createHydraFlowError, HydraFlowError } from '../hydra-flow-error';
import { getVerifiedEmailStatus } from '../verified-address';
import { getLoginRequest } from './getLoginRequest';
import { createLoginVerificationUrl } from './login-verification';

const THIRTY_DAYS = 2_592_000;

export async function acceptLoginRequest(loginChallenge: string) {
  const [loginRequest, serverSession] = await Promise.all([
    getLoginRequest(loginChallenge),
    getServerSession(),
  ]);
  const identity = serverSession?.identity;
  const subject = identity?.id;

  if (!identity || !subject) {
    throw new HydraFlowError('Login acceptance requires an active session.', {
      code: 'hydra_login_session_missing',
      description: 'Your authentication session expired. Sign in again to continue.',
      status: 401,
    });
  }

  if (loginRequest.subject && loginRequest.subject !== subject) {
    throw new HydraFlowError('Login subject does not match the authenticated session.', {
      code: 'hydra_login_subject_mismatch',
      description: 'The login request does not match the current authenticated session.',
      status: 403,
    });
  }

  const emailStatus = getVerifiedEmailStatus(identity);
  if (!emailStatus.email) {
    throw new HydraFlowError('The current identity has no email address.', {
      code: 'hydra_login_email_missing',
      description: 'This account cannot be verified by email.',
      status: 403,
    });
  }
  if (!emailStatus.verified) {
    return {
      status: 'verification_required' as const,
      verificationUrl: createLoginVerificationUrl(loginChallenge, subject).toString(),
    };
  }

  const hydra = await getOAuth2ApiFetchClient();
  try {
    const response = await hydra.acceptOAuth2LoginRequest({
      acceptOAuth2LoginRequest: {
        remember: true,
        remember_for: THIRTY_DAYS,
        subject,
      },
      loginChallenge,
    });

    return { redirectTo: response.redirect_to, status: 'accepted' as const };
  } catch (error: unknown) {
    throw createHydraFlowError('accept login request failed', error, {
      code: 'hydra_login_accept_failed',
      description: 'Unable to continue the login flow right now.',
    });
  }
}
