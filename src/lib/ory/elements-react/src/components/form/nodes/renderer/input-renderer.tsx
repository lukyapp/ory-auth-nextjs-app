/* eslint-disable */
'use client';

// Copyright © 2026 Ory Corp
// SPDX-License-Identifier: Apache-2.0
import { getNodeLabel } from '@ory/client-fetch';
import { useFormState } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { useComponents } from '../../../../context';
import { resolvePlaceholder } from '../../../../util';
import { UiNodeInput } from '../../../../util/utilFixSDKTypesHelper';
import { useInputProps } from '../hooks/useInputProps';

type TextBasedInputProps = {
  node: UiNodeInput;
};

export function InputRenderer({ node }: TextBasedInputProps) {
  const { Node } = useComponents();
  const label = getNodeLabel(node);
  const intl = useIntl();
  const formState = useFormState();

  const attributes = node.attributes;
  const placeholder = label ? resolvePlaceholder(label, intl) : '';
  const inputProps = useInputProps(attributes, placeholder);
  const isPinCodeInput =
    (attributes.name === 'code' && node.group === 'code') ||
    (attributes.name === 'totp_code' && node.group === 'totp');

  const InputComponent = isPinCodeInput ? Node.CodeInput : Node.Input;

  return (
    <Node.Label attributes={attributes} node={node} fieldError={formState.errors[attributes.name]}>
      <InputComponent
        attributes={attributes}
        node={node}
        onClick={inputProps.onClick}
        inputProps={inputProps}
      />
    </Node.Label>
  );
}
