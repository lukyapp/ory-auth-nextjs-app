import { resolveOryLocale } from '@/lib/ory/resolve-ory-locale';
import { getLogoutFlow, getServerSession } from '@ory/nextjs/app';
import { redirect } from 'next/navigation';
import { LogoutUi } from './logout-ui';

export default async function LogoutPage() {
  const session = await getServerSession();

  if (!session?.identity) {
    redirect('/');
  }

  const traits =
    session.identity.traits && typeof session.identity.traits === 'object'
      ? (session.identity.traits as Record<string, unknown>)
      : {};
  const displayName =
    resolveOptionalString(traits.name) ||
    resolveOptionalString(traits.email) ||
    resolveOptionalString(traits.username) ||
    resolveOptionalString(traits.phone) ||
    'your account';
  const locale = await resolveOryLocale();
  const flow = await getLogoutFlow({ returnTo: '/' });

  return <LogoutUi displayName={displayName} locale={locale} logoutUrl={flow.logout_url} />;
}

function resolveOptionalString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === 'object' && value !== null) {
    const first = resolveOptionalString((value as Record<string, unknown>).first);
    const last = resolveOptionalString((value as Record<string, unknown>).last);

    if (first && last) {
      return `${first} ${last}`;
    }

    return first ?? last;
  }

  return null;
}
