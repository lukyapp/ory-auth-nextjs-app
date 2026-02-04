/* eslint-disable */
// Copyright © 2024 Ory Corp
// SPDX-License-Identifier: Apache-2.0

import { ComponentPropsWithoutRef, forwardRef } from 'react';
import IconUser from '../../assets/icons/user.svg';
import { UserInitials } from '../../utils/user';

type UserAvatarProps = {
  initials: UserInitials;
} & ComponentPropsWithoutRef<'button'>;

export const UserAvatar = forwardRef<HTMLButtonElement, UserAvatarProps>(
  ({ initials, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className="bg-button-primary-background-default hover:bg-button-primary-background-hover relative flex size-10 items-center justify-center overflow-hidden rounded-[999px]"
        {...rest}
      >
        <div className="relative flex size-full items-center justify-center">
          {initials.avatar ? (
            <img src={initials.avatar} alt={initials.primary} className="w-full object-contain" />
          ) : (
            <IconUser size={24} className="text-button-primary-foreground-default" />
          )}
        </div>
      </button>
    );
  },
);
UserAvatar.displayName = 'UserAvatar';
