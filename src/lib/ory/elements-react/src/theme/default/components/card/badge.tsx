/* eslint-disable */
// Copyright © 2024 Ory Corp
// SPDX-License-Identifier: Apache-2.0

import OryLogoHorizontal from '../../assets/ory-badge-horizontal.svg';
import OryLogoVertical from '../../assets/ory-badge-vertical.svg';

export function Badge() {
  return (
    <div className="border-ory-border-default bg-ory-background-default text-ory-foreground-default max-sm:rounded-b-branding sm:rounded-r-branding absolute border p-2 font-bold max-sm:bottom-0 max-sm:left-8 max-sm:translate-y-full max-sm:py-[7px] sm:top-8 sm:right-0 sm:translate-x-full sm:pl-[7px]">
      <OryLogoHorizontal width={22} height={8} className="sm:hidden" />
      <OryLogoVertical width={8} height={22} className="max-sm:hidden" />
    </div>
  );
}
