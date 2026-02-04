/* eslint-disable */
'use client';

// Copyright © 2025 Ory Corp
// SPDX-License-Identifier: Apache-2.0

import { OryNodeConsentScopeCheckboxProps } from '@ory/elements-react';
import * as Switch from '@radix-ui/react-switch';
import { useIntl } from 'react-intl';
import IconMessage from '../../assets/icons/message.svg';
import IconPersonal from '../../assets/icons/personal.svg';
import Phone from '../../assets/icons/phone.svg';
import { ListItem } from '../card/list-item';

const ScopeIcons: Record<string, typeof IconPersonal> = {
  openid: IconPersonal,
  offline_access: IconPersonal,
  profile: IconPersonal,
  email: IconMessage,
  phone: Phone,
};

export function DefaultConsentScopeCheckbox({
  attributes,
  onCheckedChange,
  inputProps,
}: OryNodeConsentScopeCheckboxProps) {
  const intl = useIntl();
  const Icon = ScopeIcons[attributes.value as string] ?? IconPersonal;
  return (
    <ListItem
      as="label"
      icon={Icon}
      title={intl.formatMessage({
        id: `consent.scope.${attributes.value}.title`,
        defaultMessage: attributes.value,
      })}
      description={intl.formatMessage({
        id: `consent.scope.${attributes.value}.description`,
        defaultMessage: [],
      })}
      className="col-span-2"
      data-testid="ory/screen/consent/scope-checkbox-label"
    >
      <Switch.Root
        className="rounded-identifier border-toggle-border-default bg-toggle-background-default data-[state=checked]:border-toggle-border-checked data-[state=checked]:bg-toggle-background-checked relative h-4 w-7 border p-[3px] transition-all"
        data-testid={`ory/screen/consent/scope-checkbox`}
        {...inputProps}
        onCheckedChange={onCheckedChange}
        defaultChecked={true}
      >
        <Switch.Thumb className="rounded-identifier bg-toggle-foreground-default data-[state=checked]:bg-toggle-foreground-checked block size-2 transition-all data-[state=checked]:translate-x-3" />
      </Switch.Root>
    </ListItem>
  );
}
