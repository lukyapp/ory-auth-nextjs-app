import { type OAuth2ConsentRequest } from '@ory/client-fetch';
import React from 'react';

type ConsentV2UiProps = {
  consentRequest: OAuth2ConsentRequest;
  csrfToken: string;
};

export function ConsentV2Ui({ consentRequest, csrfToken }: ConsentV2UiProps) {
  const client = consentRequest.client;
  const scopes = consentRequest.requested_scope ?? [];
  const user = consentRequest.subject ?? 'User';

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: '0 20px' }}>
      <h1>An application requests access to your data!</h1>
      <form action="/api/consent/submit" method="POST">
        <input type="hidden" name="consent_challenge" value={consentRequest.challenge} />
        <input type="hidden" name="csrf_token" value={csrfToken} />

        {client?.logo_uri ? (
          <img
            src={client.logo_uri}
            alt={`${client.client_name || client.client_id || 'Application'} logo`}
            style={{ maxWidth: 160, maxHeight: 80, margin: '16px 0' }}
          />
        ) : null}

        <p>
          Hi {user}, application{' '}
          <strong>{client?.client_name || client?.client_id || 'Unknown application'}</strong> wants
          access resources on your behalf and to:
        </p>

        <div style={{ margin: '12px 0' }}>
          {scopes.map((scope) => (
            <div key={scope} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                className="grant_scope"
                id={scope}
                value={scope}
                name="grant_scope"
              />
              <label htmlFor={scope}>{scope}</label>
            </div>
          ))}
        </div>

        <p>
          Do you want to be asked next time when this application wants to access your data? The
          application will not be able to ask for more permissions without your consent.
        </p>

        <ul>
          {client?.policy_uri ? (
            <li>
              <a href={client.policy_uri}>Policy</a>
            </li>
          ) : null}
          {client?.tos_uri ? (
            <li>
              <a href={client.tos_uri}>Terms of Service</a>
            </li>
          ) : null}
        </ul>

        <p>
          <input type="checkbox" id="remember" name="remember" value="1" />
          <label htmlFor="remember" style={{ marginLeft: 8 }}>
            Do not ask me again
          </label>
        </p>

        <p style={{ display: 'flex', gap: 12 }}>
          <input type="submit" id="accept" name="action" value="accept" />
          <input type="submit" id="reject" name="action" value="reject" />
        </p>
      </form>
    </main>
  );
}
