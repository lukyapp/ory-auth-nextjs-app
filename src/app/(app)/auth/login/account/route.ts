import { NextRequest, NextResponse } from 'next/server';
import { readAccountHistory } from '../../account-history';
import { logAuthFlow } from '../../auth-flow-log';
import { resolveAppRedirectUrl } from '../../public-url';
import { serializeAccountSelection } from '../account-selection';

export async function GET(request: NextRequest) {
  const loginChallenge = request.nextUrl.searchParams.get('login_challenge')?.trim();

  if (!loginChallenge) {
    return NextResponse.redirect(resolveAppRedirectUrl('/auth/login', request));
  }

  const accountId = request.nextUrl.searchParams.get('account_id')?.trim();
  const accountHistory = accountId ? await readAccountHistory() : [];
  const selectedAccount = accountHistory.find((account) => account.id === accountId);
  const identifier = selectedAccount?.identifier ?? null;
  const loginUrl = resolveAppRedirectUrl('/auth/login', request);

  loginUrl.searchParams.set('login_challenge', loginChallenge);
  loginUrl.searchParams.set('prompt', 'login');
  loginUrl.searchParams.set('account_chooser', 'skip');
  if (identifier) {
    loginUrl.searchParams.set('login_hint', identifier);
  }

  const response = NextResponse.redirect(loginUrl);
  const selectionCookie = serializeAccountSelection({ identifier, loginChallenge });
  response.cookies.set(selectionCookie.name, selectionCookie.value, selectionCookie.options);

  logAuthFlow('login.account.selected', {
    accountId: selectedAccount?.id ?? null,
    hasIdentifier: Boolean(identifier),
    loginChallenge,
  });

  return response;
}
