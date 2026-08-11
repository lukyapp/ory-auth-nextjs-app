/* eslint-disable import/order */
import { createOryConfig } from '@/lib/ory/ory.config';
import { resolveOryLocale } from '@/lib/ory/resolve-ory-locale';
import { getServerSession } from '@ory/nextjs/app';
import { Metadata } from 'next';
import { HomeUi } from './home-ui';

export const metadata: Metadata = {
  title: 'Account',
};

export default async function HomePage() {
  const locale = await resolveOryLocale();
  const oryConfig = createOryConfig(locale);
  const session = await getServerSession();
  const traits =
    session?.identity?.traits && typeof session.identity.traits === 'object'
      ? (session.identity.traits as Record<string, unknown>)
      : {};
  const displayName =
    resolveOptionalString(traits.name) ||
    resolveOptionalString(traits.email) ||
    resolveOptionalString(traits.username) ||
    resolveOptionalString(traits.phone) ||
    'your account';
  const picture = resolveOptionalString(traits.picture);

  return (
    <HomeUi config={oryConfig} displayName={displayName} picture={picture} session={session} />
  );
}

function resolveOptionalString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    const first = resolveOptionalString(record.first);
    const last = resolveOptionalString(record.last);

    if (first && last) {
      return `${first} ${last}`;
    }

    return first ?? last;
  }

  return null;
}
