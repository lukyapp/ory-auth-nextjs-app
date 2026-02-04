/* eslint-disable */
// Copyright © 2024 Ory Corp
// SPDX-License-Identifier: Apache-2.0

import { FlowType } from '@ory/client-fetch';
import { OryFormGroupProps, useOryFlow } from '@ory/elements-react';
import { countRenderableChildren } from '../../../../util/childCounter';
import { cn } from '../../utils/cn';

export function DefaultGroupContainer({ children }: OryFormGroupProps) {
  const { flowType } = useOryFlow();

  const count = countRenderableChildren(children);
  if (count === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'grid',
        flowType === FlowType.OAuth2Consent ? 'grid-cols-2 gap-2' : 'grid-cols-1 gap-8',
      )}
    >
      {children}
    </div>
  );
}
