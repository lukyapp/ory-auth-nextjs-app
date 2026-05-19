/* eslint-disable */
import type { OryClientConfiguration } from '@ory/elements-react';
import type { OryLocale } from './resolve-ory-locale';

const baseProjectConfig = {
  default_redirect_url: '/',
  error_ui_url: '/error',
  login_ui_url: '/auth/login',
  // name: 'Ory Next.js App Router Example',
  name: '',
  recovery_enabled: true,
  recovery_ui_url: '/auth/recovery',
  registration_enabled: true,
  registration_ui_url: '/auth/registration',
  settings_ui_url: '/settings',
  verification_enabled: true,
  verification_ui_url: '/auth/verification',
} satisfies OryClientConfiguration['project'];

export function createOryConfig(locale: OryLocale): OryClientConfiguration {
  const project = {
    ...baseProjectConfig,
    default_locale: locale,
    locale_behavior: 'force_default',
  } as OryClientConfiguration['project'] & {
    default_locale: OryLocale;
    locale_behavior: 'force_default';
  };

  return {
    intl: {
      locale,
    },
    project,
    sdk: {
      url: process.env.NEXT_PUBLIC_ORY_SDK_URL,
    },
  };
}

export const oryConfig = createOryConfig('en');
