/* eslint-disable */
'use client';

// Copyright © 2024 Ory Corp
// SPDX-License-Identifier: Apache-2.0

import { getNodeLabel } from '@ory/client-fetch';
import { OryNodeAnchorProps, uiTextToFormattedMessage } from '@ory/elements-react';
import { forwardRef } from 'react';
import { useIntl } from 'react-intl';
import { omitInputAttributes } from '../../../../util/omitAttributes';
import { cn } from '../../utils/cn';

export const DefaultLinkButton = forwardRef<HTMLAnchorElement, OryNodeAnchorProps>(
  ({ attributes, node }, ref) => {
    const intl = useIntl();
    const label = getNodeLabel(node);
    return (
      <a
        {...omitInputAttributes(attributes)}
        ref={ref}
        title={label ? uiTextToFormattedMessage(label, intl) : ''}
        data-testid={`ory/form/node/link/${attributes.id}`}
        className={cn(
          'bg-button-primary-background-default text-button-primary-foreground-default hover:bg-button-primary-background-hover hover:text-button-primary-foreground-hover cursor-pointer gap-3 border p-4 text-center leading-none font-medium antialiased transition-colors',
        )}
      >
        {label ? uiTextToFormattedMessage(label, intl) : ''}
      </a>
    );
  },
);

DefaultLinkButton.displayName = 'DefaultLinkButton';
