/* eslint-disable */
'use client';

// Copyright © 2025 Ory Corp
// SPDX-License-Identifier: Apache-2.0
import { messageTestId, OryToastProps, uiTextToFormattedMessage } from '@ory/elements-react';
import { useIntl } from 'react-intl';
import { toast as sonnerToast } from 'sonner';
import IconX from '../../assets/icons/x.svg';
import { cn } from '../../utils/cn';

export function DefaultToast({
  message,
  // Id can be used to close the toast later, but we don't use it here
  id,
}: OryToastProps) {
  const intl = useIntl();

  const title =
    message.type === 'error'
      ? intl.formatMessage({ id: 'settings.messages.toast-title.error' })
      : intl.formatMessage({ id: 'settings.messages.toast-title.success' });
  const messageText = uiTextToFormattedMessage(message, intl);
  return (
    <div
      className="rounded-cards border-interface-border-default-primary bg-interface-background-default-inverted flex-col border px-4 py-2"
      {...messageTestId(message)}
    >
      <div className="flex items-center justify-between">
        <p
          className={cn('font-medium', {
            'text-interface-foreground-validation-success': message.type === 'success',
            'text-interface-foreground-validation-danger': message.type === 'error',
            'text-interface-foreground-validation-warning':
              // Currently unused from Kratos, but kept for future use
              (message.type as 'warning') === 'warning',
          })}
        >
          {title}
        </p>
        <button
          data-testid={`ory/message/${message.id}.close`}
          className="text-interface-foreground-default-inverted cursor-pointer"
          onClick={() => sonnerToast.dismiss(id)}
        >
          <IconX size={16} />
        </button>
      </div>

      <p className="text-interface-foreground-default-inverted">{messageText}</p>
    </div>
  );
}
