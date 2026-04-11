/* eslint-disable */
'use client';

// Copyright © 2025 Ory Corp
// SPDX-License-Identifier: Apache-2.0
import { UiNode, UiNodeInputAttributes, UiText } from '@ory/client-fetch';
import { useIntl } from 'react-intl';
import { uiTextToFormattedMessage } from './i18n';

export function findScreenSelectionButton(
  nodes: UiNode[],
): { attributes: UiNodeInputAttributes } | undefined {
  return nodes.find(
    (node) =>
      node.attributes.node_type === 'input' &&
      node.attributes.type === 'submit' &&
      node.attributes.name === 'screen',
  ) as { attributes: UiNodeInputAttributes };
}

export function isDynamicText(text: UiText): text is UiText & { context: { name: string } } {
  return (
    text.id === 1070002 &&
    !!text.context &&
    'name' in text.context &&
    typeof text.context['name'] === 'string'
  );
}

export function resolveLabel(text: UiText, intl: ReturnType<typeof useIntl>) {
  if (isDynamicText(text)) {
    const field = text.context.name;
    const id = `forms.label.${field}`;
    const msg = {
      id,
      defaultMessage: text.text,
    };
    return intl.formatMessage(msg);
  }
  return uiTextToFormattedMessage(text, intl);
}
