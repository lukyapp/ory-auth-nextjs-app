import 'server-only';
import { getServerSession } from '@ory/nextjs/app';
import { z } from 'zod';
import { createAuthIntentToken, verifyAuthIntentToken } from '../auth-intent';
import { HydraFlowError } from '../hydra-flow-error';
import { resolveConfiguredAppPublicOrigin } from '../public-url';
import { getVerifiedEmailStatus } from '../verified-address';

const LoginVerificationSchema = z.object({
  intent_token: z.string().min(1),
  login_challenge: z.string().trim().min(1),
});

export type LoginVerificationInput = z.infer<typeof LoginVerificationSchema>;

export function createLoginVerificationUrl(loginChallenge: string, subject: string) {
  const appOrigin = resolveConfiguredAppPublicOrigin();
  if (!appOrigin) {
    throw new HydraFlowError('Email verification requires NEXT_PUBLIC_SITE_URL.', {
      code: 'hydra_login_verification_config_missing',
      description: 'Unable to start account verification right now.',
      status: 500,
    });
  }

  const intentToken = createAuthIntentToken({
    action: 'login-verify',
    challenge: loginChallenge,
    subject,
  });
  const returnTo = new URL('/auth/login/verification', appOrigin);
  returnTo.searchParams.set('intent_token', intentToken);
  returnTo.searchParams.set('login_challenge', loginChallenge);

  const verificationUrl = new URL('/auth/verification', appOrigin);
  verificationUrl.searchParams.set('return_to', returnTo.toString());
  return verificationUrl;
}

export async function validateLoginVerification(input: unknown) {
  const parsed = LoginVerificationSchema.safeParse(input);
  if (!parsed.success) {
    throw invalidVerificationIntent();
  }

  const session = await getServerSession();
  const identity = session?.identity;
  const subject = identity?.id;
  if (!identity || !subject) {
    throw new HydraFlowError('Email verification requires an active session.', {
      code: 'hydra_login_verification_session_missing',
      description: 'Your authentication session expired. Sign in again to continue.',
      status: 401,
    });
  }

  if (
    !verifyAuthIntentToken(parsed.data.intent_token, {
      action: 'login-verify',
      challenge: parsed.data.login_challenge,
      subject,
    })
  ) {
    throw invalidVerificationIntent();
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
    throw new HydraFlowError('The current identity email is not verified.', {
      code: 'hydra_login_email_unverified',
      description: 'Verify your email address before continuing.',
      status: 403,
    });
  }

  return {
    intentToken: parsed.data.intent_token,
    loginChallenge: parsed.data.login_challenge,
    subject,
  };
}

function invalidVerificationIntent() {
  return new HydraFlowError('Invalid email verification continuation.', {
    code: 'auth_intent_invalid',
    description: 'This verification request expired or is invalid. Please sign in again.',
    status: 403,
  });
}
