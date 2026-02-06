/* eslint-disable */
// Copyright © 2025 Ory Corp
// SPDX-License-Identifier: Apache-2.0

import { getNodeId } from '@ory/client-fetch';
import { useComponents, useOryFlow } from '../../context';
import { OryForm } from '../form';
import { Node } from '../form/nodes/node';
import { OryCard } from './card';
import { OryCardContent } from './content';
import { OryCardFooter } from './footer';
import { OryCardHeader } from './header';

/**
 * The `OryConsentCard` component renders a card for displaying the OAuth2 consent flow.
 *
 * @returns The consent card component.
 * @group Components
 */
export function OryConsentCard() {
  const { Form, Card } = useComponents();
  const flow = useOryFlow();
  return (
    <OryCard>
      <OryCardHeader />
      <OryCardContent>
        <OryForm>
          <Card.Divider />
          <Form.Group>
            {flow.flow.ui.nodes.map((node) => {
              let nodeId = getNodeId(node);
              if (['grant_scope', 'action'].includes(nodeId) && node.attributes.value) {
                nodeId += `-${node.attributes.value}`;
              }
              return <Node key={nodeId} node={node} />;
            })}
          </Form.Group>
          <Card.Divider />
          <OryCardFooter />
        </OryForm>
      </OryCardContent>
    </OryCard>
  );
}
