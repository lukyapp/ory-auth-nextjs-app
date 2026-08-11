import { redirect } from 'next/navigation';
import { logAuthFlow } from '../../auth-flow-log';
import { toErrorPageHref } from '../../hydra-flow-error';
import { isNextRedirectError } from '../../is-next-redirect-error';
import { validateLoginVerification } from '../login-verification';
import { LoginVerificationContinuationForm } from './continuation-form';

type LoginVerificationPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginVerificationPage({ searchParams }: LoginVerificationPageProps) {
  const continuation = await resolveContinuation(searchParams);

  return (
    <LoginVerificationContinuationForm
      intentToken={continuation.intentToken}
      loginChallenge={continuation.loginChallenge}
    />
  );
}

async function resolveContinuation(searchParams: LoginVerificationPageProps['searchParams']) {
  try {
    const continuation = await validateLoginVerification(await searchParams);
    logAuthFlow('login.verification.completed');
    return continuation;
  } catch (error: unknown) {
    if (isNextRedirectError(error)) {
      throw error;
    }
    logAuthFlow('login.verification.failed', {
      errorCode: 'login_verification_error',
    });
    redirect(toErrorPageHref(error));
  }
}
