'use client';

import { OryFormProvider } from '@/lib/ory/elements-react/src/components/form/form-provider';
import {
  isUiNodeInputAttributes,
  type OAuth2ConsentRequest,
  type Session,
  type UiNode,
} from '@ory/client-fetch';
import { Node, OryForm, useOryFlow } from '@ory/elements-react';
import type { OryClientConfiguration } from '@ory/elements-react';
import { Consent } from '@ory/elements-react/theme';
import { AlertCircle, Loader2, Settings } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { useCsrfToken } from './useCsrfToken';

type ConsentAction = 'accept' | 'reject';

type IdentityTraits = {
  email?: unknown;
  name?: unknown;
  username?: unknown;
};

type ScopeItem = {
  key: string;
};

type ConsentCopy = {
  allow: string;
  allowing: string;
  currentAccount: string;
  deny: string;
  denying: string;
  languageName: string;
  loadingConsentRequest: string;
  privacyPolicy: string;
  thisApplication: string;
  thisWillAllow: (clientName: string) => string;
  wantsAccess: (clientName: string) => string;
};

const consentCopies: Record<'en' | 'fr', ConsentCopy> = {
  en: {
    allow: 'Allow',
    allowing: 'Allowing',
    currentAccount: 'Current account',
    deny: 'Deny',
    denying: 'Denying',
    languageName: 'English',
    loadingConsentRequest: 'Loading consent request',
    privacyPolicy: 'Privacy Policy',
    thisApplication: 'This application',
    thisWillAllow: (clientName) => `This will allow ${clientName} to...`,
    wantsAccess: (clientName) => `${clientName} wants access to your account`,
  },
  fr: {
    allow: 'Autoriser',
    allowing: 'Autorisation en cours',
    currentAccount: 'Compte actuel',
    deny: 'Refuser',
    denying: 'Refus en cours',
    languageName: 'Français',
    loadingConsentRequest: 'Chargement de la demande de consentement',
    privacyPolicy: 'Politique de confidentialité',
    thisApplication: 'Cette application',
    thisWillAllow: (clientName) => `Cela permettra à ${clientName} de...`,
    wantsAccess: (clientName) => `${clientName} demande l'accès à votre compte`,
  },
};

export const ConsentUi = ({
  consentRequest,
  oryConfig,
  session,
}: {
  consentRequest: OAuth2ConsentRequest;
  oryConfig: OryClientConfiguration;
  session: Session | null;
}) => {
  const csrfToken = useCsrfToken(consentRequest.challenge);
  const copy = getConsentCopy(oryConfig.intl?.locale);

  const clientName = resolveClientName(consentRequest, copy.thisApplication);
  const accountName = useMemo(
    () => resolveAccountName(session?.identity?.traits, copy.currentAccount),
    [copy.currentAccount, session],
  );

  if (!session || !csrfToken) {
    return (
      <div className="fixed inset-0 grid min-h-screen place-items-center bg-white text-neutral-500">
        <Loader2 className="h-6 w-6 animate-spin" aria-label={copy.loadingConsentRequest} />
      </div>
    );
  }

  return (
    <Consent
      config={oryConfig}
      session={session}
      consentChallenge={consentRequest}
      formActionUrl="/api/consent/submit"
      csrfToken={csrfToken}
    >
      <OryFormProvider>
        <SquareConsentCard
          accountName={accountName}
          clientName={clientName}
          policyUri={consentRequest.client?.policy_uri}
        />
      </OryFormProvider>
    </Consent>
  );
};

function SquareConsentCard({
  accountName,
  clientName,
  policyUri,
}: {
  accountName: string;
  clientName: string;
  policyUri?: string;
}) {
  const flow = useOryFlow();
  const nodes = flow.flow.ui.nodes;
  const actionNodes = useMemo(() => nodes.filter(isActionNode), [nodes]);
  const hiddenNodes = useMemo(() => nodes.filter(isHiddenNode), [nodes]);
  const scopeItems = useMemo(() => nodesToScopeItems(nodes), [nodes]);
  const scopeValues = useMemo(() => scopeItems.map((scope) => scope.key), [scopeItems]);

  return (
    <OryForm>
      <SquareConsentFields scopeValues={scopeValues} />
      <div className="hidden" aria-hidden="true">
        {hiddenNodes.map((node) => (
          <Node key={getNodeKey(node)} node={node} />
        ))}
      </div>
      <SquareConsentShell
        acceptValue={resolveActionValue(actionNodes, 'accept')}
        accountName={accountName}
        clientName={clientName}
        policyUri={policyUri}
        rejectValue={resolveActionValue(actionNodes, 'reject')}
        scopeItems={scopeItems}
      />
    </OryForm>
  );
}

function SquareConsentFields({ scopeValues }: { scopeValues: string[] }) {
  const { setValue } = useFormContext();

  useEffect(() => {
    setValue('grant_scope', scopeValues);
    setValue('remember', true);
  }, [scopeValues, setValue]);

  return null;
}

function SquareConsentShell({
  acceptValue,
  accountName,
  clientName,
  policyUri,
  rejectValue,
  scopeItems,
}: {
  acceptValue: string;
  accountName: string;
  clientName: string;
  policyUri?: string;
  rejectValue: string;
  scopeItems: ScopeItem[];
}) {
  const [pendingAction, setPendingAction] = useState<ConsentAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { formState, setValue } = useFormContext();
  const intl = useIntl();
  const copy = getConsentCopy(intl.locale);
  const isSubmitting = formState.isSubmitting;
  const isDisabled = isSubmitting || !formState.isReady;

  const submitWithAction = (action: ConsentAction, value: string) => {
    setError(null);
    setPendingAction(action);
    setValue('action', value);
  };

  return (
    <div className="fixed inset-0 min-h-screen overflow-y-auto overscroll-contain bg-white text-[#1f1f1f]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[33rem_1fr]">
        <aside className="flex min-h-[32rem] flex-col bg-[#f3f3f3] px-8 py-8 sm:px-12 lg:min-h-screen lg:px-20 lg:py-20">
          <div className="flex items-center gap-2 text-[1.05rem] font-semibold">
            <span className="grid h-6 w-6 place-items-center rounded-[4px] bg-[#1f1f1f]">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-white" />
            </span>
            {clientName}
          </div>

          <div className="flex flex-1 flex-col justify-center py-12 lg:py-0">
            <div className="mb-7 grid h-24 w-24 place-items-center rounded-[1.25rem] bg-[#dddddd] shadow-[0_2px_8px_rgba(0,0,0,0.10)]">
              <Settings className="h-12 w-12 stroke-[2.5]" aria-hidden="true" />
            </div>
            <h1 className="max-w-[24rem] text-[1.75rem] leading-[1.22] font-bold tracking-normal text-balance sm:text-[2rem]">
              {copy.wantsAccess(clientName)}
            </h1>
            <p className="mt-7 text-lg font-semibold text-[#777]">{accountName}</p>
          </div>

          <div className="flex flex-col gap-5 text-base font-semibold text-[#1f5ed8]">
            {policyUri ? (
              <a href={policyUri} rel="noreferrer" target="_blank">
                {copy.privacyPolicy}
              </a>
            ) : null}
            <span>{copy.languageName}</span>
          </div>
        </aside>

        <main className="flex items-center justify-center px-8 py-14 sm:px-12 lg:px-20">
          <section className="w-full max-w-[44.5rem]" aria-labelledby="consent-permissions-title">
            <h2
              id="consent-permissions-title"
              className="text-lg leading-6 font-bold text-[#242424]"
            >
              {copy.thisWillAllow(clientName)}
            </h2>

            <div className="mt-5 border-y border-[#e5e5e5]">
              {scopeItems.map((scope) => (
                <div className="border-b border-[#e5e5e5] py-5 last:border-b-0" key={scope.key}>
                  <p className="text-xl leading-7 text-[#2a2a2a]">
                    {intl.formatMessage({
                      defaultMessage: humanizeScope(scope.key),
                      id: `consent.scope.${scope.key}.title`,
                    })}
                  </p>
                  <p className="mt-1 max-w-[36rem] text-sm leading-5 text-[#737373]">
                    {intl.formatMessage({
                      defaultMessage: scope.key,
                      id: `consent.scope.${scope.key}.description`,
                    })}
                  </p>
                </div>
              ))}
            </div>

            {error ? (
              <div className="mt-6 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p>{error}</p>
              </div>
            ) : null}

            <div className="mt-12 flex items-center justify-between gap-4">
              <button
                className="inline-flex h-12 min-w-24 items-center justify-center rounded-md bg-[#f0f1f2] px-7 text-base font-semibold text-[#1f5ed8] transition hover:bg-[#e6e8eb] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isDisabled}
                name="action"
                onClick={() => submitWithAction('reject', rejectValue)}
                type="submit"
                value={rejectValue}
              >
                {pendingAction === 'reject' && isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-label={copy.denying} />
                ) : (
                  copy.deny
                )}
              </button>
              <button
                className="inline-flex h-12 min-w-24 items-center justify-center rounded-md bg-[#2157c8] px-7 text-base font-semibold text-white transition hover:bg-[#1b49aa] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isDisabled}
                name="action"
                onClick={() => submitWithAction('accept', acceptValue)}
                type="submit"
                value={acceptValue}
              >
                {pendingAction === 'accept' && isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-label={copy.allowing} />
                ) : (
                  copy.allow
                )}
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function resolveClientName(consentRequest: OAuth2ConsentRequest, fallback: string) {
  return (
    consentRequest.client?.client_name?.trim() ||
    consentRequest.client?.client_id?.trim() ||
    fallback
  );
}

function resolveAccountName(traits: unknown, fallback: string) {
  if (!isIdentityTraits(traits)) {
    return fallback;
  }

  const name = resolveName(traits.name);
  const username = resolveString(traits.username);
  const email = resolveString(traits.email);

  return name ?? username ?? email ?? fallback;
}

function resolveName(name: unknown) {
  if (typeof name === 'string' && name.trim()) {
    return name.trim();
  }

  if (typeof name === 'object' && name !== null) {
    const record = name as Record<string, unknown>;
    const first = resolveString(record.first);
    const last = resolveString(record.last);

    return [first, last].filter(Boolean).join(' ') || null;
  }

  return null;
}

function resolveString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function isIdentityTraits(traits: unknown): traits is IdentityTraits {
  return typeof traits === 'object' && traits !== null;
}

function nodesToScopeItems(nodes: UiNode[]): ScopeItem[] {
  const scopes = nodes.flatMap((node) => {
    if (!isGrantScopeNode(node)) {
      return [];
    }

    const attributes = node.attributes;
    return isUiNodeInputAttributes(attributes) ? [String(attributes.value)] : [];
  });

  const resolvedScopes = scopes.length ? scopes : ['openid'];

  return resolvedScopes.map((scope) => ({
    key: scope,
  }));
}

function humanizeScope(scope: string) {
  return scope
    .replaceAll('_', ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
    .join(' ');
}

function resolveActionValue(nodes: UiNode[], action: ConsentAction) {
  const node = nodes.find((node) => {
    const attributes = node.attributes;
    return isUiNodeInputAttributes(attributes) && attributes.value === action;
  });

  if (!node || !isUiNodeInputAttributes(node.attributes)) {
    return action;
  }

  return String(node.attributes.value);
}

function isGrantScopeNode(node: UiNode) {
  return (
    isUiNodeInputAttributes(node.attributes) &&
    node.attributes.name === 'grant_scope' &&
    typeof node.attributes.value === 'string'
  );
}

function isActionNode(node: UiNode) {
  return (
    isUiNodeInputAttributes(node.attributes) &&
    node.attributes.name === 'action' &&
    node.attributes.type === 'submit'
  );
}

function isHiddenNode(node: UiNode) {
  return isUiNodeInputAttributes(node.attributes) && node.attributes.type === 'hidden';
}

function getNodeKey(node: UiNode) {
  if (!isUiNodeInputAttributes(node.attributes)) {
    return node.type;
  }

  return `${node.attributes.name}-${String(node.attributes.value ?? '')}`;
}

function getConsentCopy(locale?: string): ConsentCopy {
  return locale?.toLowerCase().startsWith('fr') ? consentCopies.fr : consentCopies.en;
}
