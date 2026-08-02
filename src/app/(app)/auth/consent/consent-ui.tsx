'use client';

import {
  isUiNodeInputAttributes,
  type OAuth2ConsentRequest,
  type Session,
  type UiNode,
  type UiNodeInputAttributes,
} from '@ory/client-fetch';
import {
  Node,
  OryLocales,
  useOryFlow,
  type OryClientConfiguration,
  type OryFlowComponentOverrides,
  type OryFormRootProps,
  type OryNodeButtonProps,
  type OryNodeConsentScopeCheckboxProps,
  type OryNodeInputProps,
} from '@ory/elements-react';
import { Consent } from '@ory/elements-react/theme';
import { ChevronDown, Loader2, Settings } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, type PropsWithChildren } from 'react';
import { useFormContext } from 'react-hook-form';
import { useIntl } from 'react-intl';

type ConsentAction = 'accept' | 'reject';

type IdentityTraits = {
  email?: unknown;
  name?: unknown;
  username?: unknown;
};

type ScopeItem = {
  key: string;
};

type InputUiNode = UiNode & {
  attributes: UiNodeInputAttributes;
};

export const ConsentUi = ({
  acceptIntentToken,
  consentRequest,
  oryConfig,
  rejectIntentToken,
  session,
}: {
  acceptIntentToken: string;
  consentRequest: OAuth2ConsentRequest;
  oryConfig: OryClientConfiguration;
  rejectIntentToken: string;
  session: Session | null;
}) => {
  const clientName = resolveClientName(consentRequest);
  const accountName = useMemo(() => resolveAccountName(session?.identity?.traits), [session]);

  if (!session) {
    return (
      <div className="fixed inset-0 grid min-h-screen place-items-center bg-white text-neutral-500">
        <Loader2
          className="h-6 w-6 animate-spin"
          // aria-label={intl.formatMessage({
          //   defaultMessage: 'Loading consent request',
          //   id: 'consent.loading',
          // })}
        />
      </div>
    );
  }

  return (
    <ConsentContext.Provider
      value={{
        accountName,
        acceptIntentToken,
        clientName,
        policyUri: resolveHttpUrl(consentRequest.client?.policy_uri),
        rejectIntentToken,
      }}
    >
      <Consent
        config={oryConfig}
        session={session}
        consentChallenge={consentRequest}
        formActionUrl="/api/consent/submit"
        csrfToken={acceptIntentToken}
        components={squareConsentComponents}
      />
    </ConsentContext.Provider>
  );
};

type ConsentContextValue = {
  accountName?: string;
  acceptIntentToken: string;
  clientName?: string;
  policyUri?: string;
  rejectIntentToken: string;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

function SquareCardRoot({ children }: PropsWithChildren) {
  const intl = useIntl();
  const { accountName, clientName, policyUri } = useConsentContext();

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
              {intl.formatMessage(
                {
                  defaultMessage: 'Authorize {party}',
                  id: 'consent.title',
                },
                { party: clientName },
              )}
            </h1>
            <p className="mt-7 text-lg font-semibold text-[#777]">
              {intl.formatMessage(
                {
                  defaultMessage:
                    'A third party application wants to access information associated with your account {identifier}.',
                  id: 'consent.subtitle',
                },
                { identifier: accountName ?? '' },
              )}
            </p>
          </div>

          <div className="flex flex-col gap-5 text-base font-semibold text-[#1f5ed8]">
            {policyUri ? (
              <a href={policyUri} rel="noreferrer" target="_blank">
                {intl.formatMessage({
                  defaultMessage: 'Privacy Policy',
                  id: 'consent.privacy_policy',
                })}
              </a>
            ) : null}
            <LanguageSelect locale={intl.locale} />
          </div>
        </aside>

        {children}
      </div>
    </div>
  );
}

function SquareCardHeader() {
  return null;
}

function SquareCardContent({ children }: PropsWithChildren) {
  return (
    <main className="flex items-center justify-center px-8 py-14 sm:px-12 lg:px-20">
      <section className="w-full max-w-[44.5rem]" aria-labelledby="consent-permissions-title">
        {children}
      </section>
    </main>
  );
}

function SquareCardFooter() {
  return null;
}

function SquareDivider() {
  return null;
}

function SquareFormRoot({ className: _className, ...props }: OryFormRootProps) {
  return <form {...props} className="w-full" />;
}

function SquareFormGroup() {
  const flow = useOryFlow();
  const nodes = flow.flow.ui.nodes;
  const actionNodes = useMemo(() => nodes.filter(isActionNode), [nodes]);
  const grantScopeNodes = useMemo(() => nodes.filter(isGrantScopeNode), [nodes]);
  const hiddenNodes = useMemo(() => nodes.filter(isHiddenNode), [nodes]);
  const scopeItems = useMemo(() => nodesToScopeItems(nodes), [nodes]);
  const { clientName } = useConsentContext();
  const intl = useIntl();

  return (
    <>
      <div className="hidden" aria-hidden="true">
        {hiddenNodes.map((node) => (
          <Node key={getNodeKey(node)} node={node} />
        ))}
      </div>

      <h2 id="consent-permissions-title" className="text-lg leading-6 font-bold text-[#242424]">
        {intl.formatMessage(
          {
            defaultMessage: 'This will allow {party} to...',
            id: 'consent.permissions.title',
          },
          {
            party:
              clientName ??
              intl.formatMessage({
                defaultMessage: 'This application',
                id: 'consent.this_application',
              }),
          },
        )}
      </h2>

      <div className="mt-5 border-y border-[#e5e5e5]">
        {grantScopeNodes.length
          ? grantScopeNodes.map((node) => <Node key={getNodeKey(node)} node={node} />)
          : scopeItems.map((scope) => <ScopeItemRow key={scope.key} scope={scope.key} />)}
      </div>

      <div className="mt-5 space-y-1 text-sm leading-5 text-[#737373]">
        <p>
          {intl.formatMessage({
            defaultMessage: 'Approving grants all permissions listed above.',
            id: 'consent.scope.allOrNothing',
          })}
        </p>
        <p>
          {intl.formatMessage({
            defaultMessage: 'Your decision will be remembered for 30 days.',
            id: 'consent.remember.notice',
          })}
        </p>
      </div>

      <div className="mt-12 flex items-center justify-between gap-4">
        {sortActionNodes(actionNodes).map((node) => (
          <ConsentActionButton key={getNodeKey(node)} node={node} />
        ))}
      </div>
    </>
  );
}

function ConsentActionButton({ node }: { node: InputUiNode }) {
  const { formState, setValue } = useFormContext();
  const { formState: oryFormState } = useOryFlow();
  const { acceptIntentToken, rejectIntentToken } = useConsentContext();
  const action = getConsentAction(node);

  const handleClick = useCallback(() => {
    setValue(node.attributes.name, node.attributes.value);
    setValue('csrf_token', action === 'accept' ? acceptIntentToken : rejectIntentToken);
  }, [acceptIntentToken, action, node, rejectIntentToken, setValue]);

  const buttonProps = {
    disabled:
      node.attributes.disabled ||
      !formState.isReady ||
      !oryFormState.isReady ||
      oryFormState.isSubmitting,
    name: node.attributes.name,
    onClick: handleClick,
    type: node.attributes.type === 'submit' ? 'submit' : 'button',
    value: node.attributes.value,
  } satisfies OryNodeButtonProps['buttonProps'];

  return (
    <SquareButton
      attributes={node.attributes}
      buttonProps={buttonProps}
      isSubmitting={oryFormState.isSubmitting}
      node={node as OryNodeButtonProps['node']}
    />
  );
}

function SquareConsentScopeCheckbox({ inputProps }: OryNodeConsentScopeCheckboxProps) {
  return <ScopeItemRow scope={inputProps.value} />;
}

function ScopeItemRow({ scope }: { scope: string }) {
  const intl = useIntl();

  return (
    <div className="border-b border-[#e5e5e5] py-5 last:border-b-0">
      <p className="text-xl leading-7 text-[#2a2a2a]">
        {intl.formatMessage({
          defaultMessage: humanizeScope(scope),
          id: `consent.scope.${scope}.title`,
        })}
      </p>
      <p className="mt-1 max-w-[36rem] text-sm leading-5 text-[#737373]">
        {intl.formatMessage({
          defaultMessage: scope,
          id: `consent.scope.${scope}.description`,
        })}
      </p>
    </div>
  );
}

function SquareButton({ buttonProps, isSubmitting, node }: OryNodeButtonProps) {
  const intl = useIntl();
  const action = getConsentAction(node);
  const isAccept = action === 'accept';
  const label = intl.formatMessage({
    defaultMessage: isAccept ? 'Allow' : 'Deny',
    id: isAccept ? 'consent.action.accept' : 'consent.action.reject',
  });
  const loadingLabel = intl.formatMessage({
    defaultMessage: isAccept ? 'Allowing' : 'Denying',
    id: isAccept ? 'consent.action.accepting' : 'consent.action.rejecting',
  });

  return (
    <button
      {...buttonProps}
      className={
        isAccept
          ? 'inline-flex h-12 min-w-24 items-center justify-center rounded-md bg-[#2157c8] px-7 text-base font-semibold text-white transition hover:bg-[#1b49aa] disabled:cursor-not-allowed disabled:opacity-70'
          : 'inline-flex h-12 min-w-24 items-center justify-center rounded-md bg-[#f0f1f2] px-7 text-base font-semibold text-[#1f5ed8] transition hover:bg-[#e6e8eb] disabled:cursor-not-allowed disabled:opacity-70'
      }
      data-loading={isSubmitting}
    >
      {isSubmitting ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-label={loadingLabel} />
      ) : (
        <span>{label}</span>
      )}
    </button>
  );
}

function SquareInput({ inputProps }: OryNodeInputProps) {
  if (inputProps.type === 'hidden') {
    return <input data-testid={`ory/form/node/input/${inputProps.name}`} {...inputProps} />;
  }

  return null;
}

function LanguageSelect({ locale }: { locale: string }) {
  const intl = useIntl();
  const languageOptions = getLanguageOptions(locale);
  const languageLabel = intl.formatMessage({
    defaultMessage: 'Language',
    id: 'language.label',
  });

  return (
    <label className="relative w-fit">
      <span className="sr-only">{languageLabel}</span>
      <select
        aria-label={languageLabel}
        className="max-w-52 appearance-none bg-transparent py-1 pr-6 text-base font-semibold text-[#1f5ed8] transition hover:text-[#1749aa] focus:ring-0 focus:outline-none"
        onChange={(event) => changeLocale(event.currentTarget.value)}
        value={locale}
      >
        {languageOptions.map((option) => (
          <option key={option.code} value={option.code}>
            {option.name}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-0 h-4 w-4 -translate-y-1/2 text-[#1f5ed8]"
      />
    </label>
  );
}

const squareConsentComponents: OryFlowComponentOverrides = {
  Card: {
    Content: SquareCardContent,
    Divider: SquareDivider,
    Footer: SquareCardFooter,
    Header: SquareCardHeader,
    Root: SquareCardRoot,
  },
  Form: {
    Group: SquareFormGroup,
    Root: SquareFormRoot,
  },
  Node: {
    Button: SquareButton,
    ConsentScopeCheckbox: SquareConsentScopeCheckbox,
    Input: SquareInput,
  },
};

function resolveClientName(consentRequest: OAuth2ConsentRequest) {
  return (
    consentRequest.client?.client_name?.trim() ||
    consentRequest.client?.client_id?.trim() ||
    undefined
  );
}

function resolveHttpUrl(value: string | null | undefined) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function resolveAccountName(traits: unknown) {
  if (!isIdentityTraits(traits)) {
    return undefined;
  }

  const name = resolveName(traits.name);
  const username = resolveString(traits.username);
  const email = resolveString(traits.email);

  return name ?? username ?? email ?? undefined;
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

function getConsentAction(node: UiNode): ConsentAction {
  if (!isUiNodeInputAttributes(node.attributes)) {
    return 'reject';
  }

  return node.attributes.value === 'accept' ? 'accept' : 'reject';
}

function sortActionNodes(nodes: InputUiNode[]) {
  return [...nodes].sort((left, right) => {
    const order = { accept: 1, reject: 0 };

    return order[getConsentAction(left)] - order[getConsentAction(right)];
  });
}

function isGrantScopeNode(node: UiNode) {
  return (
    isUiNodeInputAttributes(node.attributes) &&
    node.attributes.name === 'grant_scope' &&
    typeof node.attributes.value === 'string'
  );
}

function isActionNode(node: UiNode): node is InputUiNode {
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

function useConsentContext() {
  const context = useContext(ConsentContext);

  if (!context) {
    throw new Error('Consent context is missing');
  }

  return context;
}

function changeLocale(locale: string) {
  const url = new URL(window.location.href);
  url.searchParams.set('locale', locale);
  window.location.assign(url.toString());
}

function getLanguageOptions(locale: string) {
  return Object.keys(OryLocales)
    .map((code) => ({
      code,
      name: getCurrentLanguageName(code, locale),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

function getCurrentLanguageName(locale: string, displayLocale = locale) {
  try {
    const language = locale.split('-')[0] || locale;
    return new Intl.DisplayNames([displayLocale], { type: 'language' }).of(language) ?? locale;
  } catch {
    return locale;
  }
}
