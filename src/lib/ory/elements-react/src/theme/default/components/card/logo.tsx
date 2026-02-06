/* eslint-disable */
'use client';

// Copyright © 2024 Ory Corp
// SPDX-License-Identifier: Apache-2.0
import { FlowType } from '@ory/client-fetch';
import { useOryConfiguration, useOryFlow } from '@ory/elements-react';
import { useIntl } from 'react-intl';

/**
 * The DefaultCardLogo component renders the logo from the {@link @ory/elements-react!OryProvider} or falls back to the project name.
 *
 * @returns the default logo for the Ory Card component.
 * @group Components
 * @category Default Components
 * @see {@link @ory/elements-react!OryProvider}
 * @see {@link @ory/elements-react!OryElementsConfiguration}
 */
export function DefaultCardLogo() {
  const intl = useIntl();
  const config = useOryConfiguration();
  const { flow, flowType } = useOryFlow();

  const title =
    flowType === FlowType.Login
      ? (flow.oauth2_login_request?.client?.client_name ??
        flow.oauth2_login_request?.client?.client_id)
      : flowType === FlowType.Registration
        ? (flow.oauth2_login_request?.client?.client_name ??
          flow.oauth2_login_request?.client?.client_id)
        : config.project.name;

  if (config.project.logo_light_url) {
    return (
      <img src={config.project.logo_light_url} className="h-full max-h-9 self-start" alt="Logo" />
    );
  }

  return (
    <h1 className="text-interface-foreground-default-primary text-xl leading-normal font-semibold">
      {intl.formatMessage({ id: 'auth.continue-to-app' }, { app: title })}
    </h1>
  );
}
