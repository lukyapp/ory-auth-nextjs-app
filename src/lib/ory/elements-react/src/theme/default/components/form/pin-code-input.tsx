/* eslint-disable */
// Copyright © 2024 Ory Corp
// SPDX-License-Identifier: Apache-2.0

'use client';

import { FlowType } from '@ory/client-fetch';
import { OryNodeInputProps, useOryFlow } from '@ory/elements-react';
// OVERRIDE START
import type { ClipboardEvent } from 'react';
// OVERRIDE END
import { cn } from '../../utils/cn';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './shadcn/otp-input';

export const DefaultPinCodeInput = ({ node, inputProps }: OryNodeInputProps) => {
  const { flowType } = useOryFlow();

  const { value, maxLength, ...restInputProps } = inputProps;
  const elements = maxLength ?? 6;

  const valueCasted = value as string;

  // OVERRIDE START
  const normalizePastedCode = (pasted: string) => pasted.replace(/\D/g, '').slice(0, elements);

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pastedCode = normalizePastedCode(event.clipboardData.getData('text/plain'));

    if (pastedCode.length !== elements) {
      return;
    }

    event.preventDefault();
    restInputProps.onChange?.({
      target: {
        name: restInputProps.name,
        value: pastedCode,
      },
      currentTarget: {
        name: restInputProps.name,
        value: pastedCode,
      },
    });
  };
  // OVERRIDE END

  return (
    <InputOTP
      data-testid={`ory/form/node/input/${node.attributes.name}`}
      {...restInputProps}
      // OVERRIDE START
      maxLength={elements}
      onPaste={handlePaste}
      pasteTransformer={normalizePastedCode}
      pushPasswordManagerStrategy="none"
      // OVERRIDE END
      value={valueCasted}
    >
      <InputOTPGroup
        className={cn(
          'flex w-full justify-stretch gap-2',
          // The settings flow input fields are supposed to be dense, so we don't need the extra padding we want on the user flows.
          flowType === FlowType.Settings && 'max-w-[488px]',
        )}
      >
        {[...Array(elements)].map((_, index) => (
          <InputOTPSlot index={index} key={index} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
};
