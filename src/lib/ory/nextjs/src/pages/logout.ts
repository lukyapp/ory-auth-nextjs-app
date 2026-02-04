/* eslint-disable */
'use client';

// Copyright © 2024 Ory Corp
// SPDX-License-Identifier: Apache-2.0
import { LogoutFlow } from '@ory/client-fetch';
import { useEffect, useState } from 'react';
import { clientSideFrontendClient } from './client';

/**
 * A client side hook to create a logout flow.
 *
 * @returns A logout flow
 * @public
 * @group Hooks
 */
export function useLogoutFlow() {
  const [flow, setFlow] = useState<LogoutFlow | undefined>(undefined);

  const createFlow = async () => {
    const flow = await clientSideFrontendClient().createBrowserLogoutFlow({});
    setFlow(flow);
  };

  useEffect(() => {
    if (!flow) {
      void createFlow();
    }
  }, []);

  return flow;
}
