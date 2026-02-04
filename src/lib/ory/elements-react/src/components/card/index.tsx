/* eslint-disable */
// Copyright © 2024 Ory Corp
// SPDX-License-Identifier: Apache-2.0

import { OryCard, OryCardRootProps } from './card';
import { OryConsentCard } from './card-consent';
import { OrySelfServiceFlowCard } from './card-two-step';
import { OryCardContent, OryCardContentProps } from './content';
import { OryCardFooter, OryCardFooterProps } from './footer';
import { OryCardHeader, OryCardHeaderProps } from './header';

export {
  OryCardHeader,
  OryCard,
  OryCardFooter,
  OryCardContent,
  OrySelfServiceFlowCard,
  OryConsentCard,
};

export type {
  OryCardHeaderProps,
  OryCardRootProps as OryCardProps,
  OryCardFooterProps,
  OryCardContentProps,
};
