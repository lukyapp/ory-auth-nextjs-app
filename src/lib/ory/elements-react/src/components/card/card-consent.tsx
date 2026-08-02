/* eslint-disable */
// Copyright © 2025 Ory Corp
// SPDX-License-Identifier: Apache-2.0

import { useComponents, useOryFlow } from '../../context';
import { getNodeId } from '../../util/sdk-helpers/ui';
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
              // OVERRIDE START
              let nodeId = getNodeId(node);
              // @ts-expect-error override
              if (['grant_scope', 'action'].includes(nodeId) && node.attributes.value) {
                // @ts-expect-error override
                nodeId += `-${node.attributes.value}`;
              }
              return <Node key={nodeId} node={node} />;
              // OVERRIDE END
            })}
          </Form.Group>
          <Card.Divider />
          <OryCardFooter />
        </OryForm>
      </OryCardContent>
    </OryCard>
  );
}
