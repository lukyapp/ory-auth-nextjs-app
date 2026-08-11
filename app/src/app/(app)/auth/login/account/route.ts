import { getServerSession } from '@ory/nextjs/app';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { readAccountHistory } from '../../account-history';
import { logAuthFlow } from '../../auth-flow-log';
import { verifyAuthIntentToken } from '../../auth-intent';
import { assertSameOriginPost, noStoreHeaders } from '../../auth-request';
import { HydraFlowError, toErrorPageHref } from '../../hydra-flow-error';
import { performKratosLogout } from '../../logout/performKratosLogout';
import { resolveHydraContinuationUrl, resolveInternalAppUrl } from '../../public-url';
import { acceptLoginRequest } from '../acceptLoginRequest';
import { serializeAccountSelection } from '../account-selection';
import { getLoginRequest } from '../getLoginRequest';

const AccountSelectionSchema = z.object({
  account_id: z.string().trim().min(1).optional(),
  intent_token: z.string().min(1),
  login_challenge: z.string().trim().min(1),
  selection: z.enum(['current', 'remembered', 'another']),
});

export async function GET() {
  return new NextResponse('Method Not Allowed', {
    headers: { ...noStoreHeaders(), Allow: 'POST' },
    status: 405,
  });
}

export async function POST(request: NextRequest) {
  try {
    assertSameOriginPost(request);
    const parsed = AccountSelectionSchema.safeParse(
      Object.fromEntries((await request.formData()).entries()),
    );
    if (!parsed.success) throw invalidIntent();

    const body = parsed.data;
    const [loginRequest, session] = await Promise.all([
      getLoginRequest(body.login_challenge),
      getServerSession(),
    ]);
    const subject = session?.identity?.id ?? null;
    const action = body.selection === 'current' ? 'login-current' : 'login-account';
    const expectedAccountId = body.selection === 'remembered' ? body.account_id : null;

    if (
      !verifyAuthIntentToken(body.intent_token, {
        accountId: expectedAccountId,
        action,
        challenge: body.login_challenge,
        subject,
      })
    ) {
      throw invalidIntent();
    }

    if (body.selection === 'current') {
      if (!subject || (loginRequest.subject && loginRequest.subject !== subject)) {
        throw invalidIntent();
      }
      const loginAcceptance = await acceptLoginRequest(body.login_challenge);
      if (loginAcceptance.status === 'verification_required') {
        logAuthFlow('login.verification.required');
        return NextResponse.redirect(loginAcceptance.verificationUrl, {
          headers: noStoreHeaders(),
          status: 303,
        });
      }
      if (!loginAcceptance.redirectTo) {
        throw new Error('Hydra did not return a login continuation URL.');
      }
      return NextResponse.redirect(resolveHydraContinuationUrl(loginAcceptance.redirectTo), {
        headers: noStoreHeaders(),
        status: 303,
      });
    }

    const history = body.selection === 'remembered' ? await readAccountHistory() : [];
    const selectedAccount = history.find((account) => account.id === body.account_id);
    if (body.selection === 'remembered' && !selectedAccount) throw invalidIntent();
    if (body.selection === 'another' && body.account_id) throw invalidIntent();

    const loginUrl = resolveInternalAppUrl('/auth/login', request);
    loginUrl.searchParams.set('login_challenge', body.login_challenge);
    loginUrl.searchParams.set('prompt', 'login');
    loginUrl.searchParams.set('account_chooser', 'skip');
    if (selectedAccount?.identifier)
      loginUrl.searchParams.set('login_hint', selectedAccount.identifier);

    const response = subject
      ? await performKratosLogout(request, loginUrl)
      : NextResponse.redirect(loginUrl, { headers: noStoreHeaders(), status: 303 });
    const selectionCookie = serializeAccountSelection({
      identifier: selectedAccount?.identifier ?? null,
      loginChallenge: body.login_challenge,
    });
    response.cookies.set(selectionCookie.name, selectionCookie.value, selectionCookie.options);

    logAuthFlow('login.account.selected', {
      accountId: selectedAccount?.id ?? null,
      hasIdentifier: Boolean(selectedAccount?.identifier),
      loginChallenge: body.login_challenge,
    });
    return response;
  } catch (error: unknown) {
    logAuthFlow('login.account.failed', {
      errorCode: error instanceof HydraFlowError ? error.code : 'auth_flow_error',
    });
    return NextResponse.redirect(resolveInternalAppUrl(toErrorPageHref(error), request), {
      headers: noStoreHeaders(),
      status: 303,
    });
  }
}

function invalidIntent() {
  return new HydraFlowError('Invalid login account intent.', {
    code: 'auth_intent_invalid',
    description: 'This account selection expired or is invalid. Please try again.',
    status: 403,
  });
}
