'use client';

import {
  getNodeLabel,
  type LoginFlow,
  type UiNodeInputAttributes,
  type UiText,
} from '@ory/client-fetch';
import {
  OryLocales,
  uiTextToFormattedMessage,
  useComponents,
  useOryConfiguration,
  useOryFlow,
  type OryClientConfiguration,
  type OryFlowComponentOverrides,
  type OryFormRootProps,
  type OryNodeButtonProps,
  type OryNodeInputProps,
  type OryNodeLabelProps,
  type OryNodeSsoButtonProps,
} from '@ory/elements-react';
import { DefaultCardFooter, Login } from '@ory/elements-react/theme';
import { ChevronDown, KeyRound, Loader2, PlusCircle } from 'lucide-react';
import { createContext, useContext, type PropsWithChildren } from 'react';
import { useIntl } from 'react-intl';

type LoginUiProps = {
  accountChoice?: {
    accounts: {
      action: AccountAction;
      id: string;
      identifier: string | null;
      isConnected: boolean;
      label: string;
    }[];
    useAnotherAction: AccountAction;
  };
  clientName?: string | null;
  config: OryClientConfiguration;
  flow: LoginFlow;
};

type AccountAction = {
  accountId: string | null;
  intentToken: string;
  loginChallenge: string;
  selection: 'current' | 'remembered' | 'another';
  url: string;
};

export function LoginUi({ accountChoice, clientName, config, flow }: LoginUiProps) {
  if (accountChoice) {
    return (
      <LoginClientNameContext.Provider value={clientName?.trim() || null}>
        <Login flow={flow} config={config} components={squareLoginComponents}>
          <AccountChoiceScreen accountChoice={accountChoice} />
        </Login>
      </LoginClientNameContext.Provider>
    );
  }

  return (
    <LoginClientNameContext.Provider value={clientName?.trim() || null}>
      <Login flow={flow} config={config} components={squareLoginComponents} />
    </LoginClientNameContext.Provider>
  );
}

const LoginClientNameContext = createContext<string | null>(null);

function SquareCardRoot({ children }: PropsWithChildren) {
  return <SquareAuthShell>{children}</SquareAuthShell>;
}

function SquareAuthShell({ children }: PropsWithChildren) {
  const intl = useIntl();
  const clientName =
    useLoginClientName() ??
    intl.formatMessage({
      defaultMessage: 'Account access',
      id: 'login.clientFallback',
    });

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
              <KeyRound className="h-12 w-12 stroke-[2.5]" aria-hidden="true" />
            </div>
            <h1 className="max-w-[24rem] text-[1.75rem] leading-[1.22] font-bold tracking-normal text-balance sm:text-[2rem]">
              {intl.formatMessage(
                {
                  defaultMessage: 'Sign in to {clientName}',
                  id: 'login.hero.title',
                },
                { clientName },
              )}
            </h1>
            <p className="mt-7 max-w-[24rem] text-lg leading-7 font-semibold text-[#777]">
              {intl.formatMessage({
                defaultMessage: 'Use your account to continue securely.',
                id: 'login.hero.description',
              })}
            </p>
          </div>

          <div className="flex flex-col gap-5 text-base font-semibold text-[#1f5ed8]">
            <LanguageSelect locale={intl.locale} />
          </div>
        </aside>

        <main className="flex items-center justify-center px-8 py-14 sm:px-12 lg:px-20">
          <section className="w-full max-w-[30rem]" aria-labelledby="login-form-title">
            {children}
          </section>
        </main>
      </div>
    </div>
  );
}

function AccountChoiceScreen({
  accountChoice,
}: {
  accountChoice: NonNullable<LoginUiProps['accountChoice']>;
}) {
  const intl = useIntl();
  const clientName =
    useLoginClientName() ??
    intl.formatMessage({
      defaultMessage: 'this application',
      id: 'login.clientFallback.lowercase',
    });

  return (
    <SquareAuthShell>
      <div className="w-full" aria-labelledby="account-choice-title">
        <header className="mb-8">
          <p className="text-sm leading-5 font-semibold text-[#777]">
            {intl.formatMessage({
              defaultMessage: 'Sign in',
              id: 'login.accountChoice.header',
            })}
          </p>
          <h2
            id="account-choice-title"
            className="mt-2 text-2xl leading-8 font-bold tracking-normal text-[#242424]"
          >
            {intl.formatMessage({
              defaultMessage: 'Select an account',
              id: 'login.accountChoice.title',
            })}
          </h2>
          <p className="mt-3 text-base leading-6 font-semibold text-[#777]">
            {intl.formatMessage(
              {
                defaultMessage: 'Continue to {clientName}',
                id: 'login.accountChoice.subtitle',
              },
              { clientName },
            )}
          </p>
        </header>

        <div className="overflow-hidden rounded-md border border-[#d8d8d8] bg-white">
          {accountChoice.accounts.map((account) => (
            <AccountChoiceRow key={account.id} account={account} />
          ))}
          <AccountActionForm
            action={accountChoice.useAnotherAction}
            className="flex min-h-16 w-full items-center gap-4 border-t border-[#e5e5e5] px-4 py-3 text-left text-[#242424] transition hover:bg-[#f7f7f7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#1f5ed8]"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center text-[#777]">
              <PlusCircle className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="text-base font-semibold">
              {intl.formatMessage({
                defaultMessage: 'Use another account',
                id: 'login.accountChoice.useAnother',
              })}
            </span>
          </AccountActionForm>
        </div>
      </div>
    </SquareAuthShell>
  );
}

function AccountChoiceRow({
  account,
}: {
  account: NonNullable<LoginUiProps['accountChoice']>['accounts'][number];
}) {
  const intl = useIntl();

  return (
    <AccountActionForm
      action={account.action}
      className="flex min-h-16 w-full items-center gap-4 border-t border-[#e5e5e5] px-4 py-3 text-left text-[#242424] transition first:border-t-0 hover:bg-[#f7f7f7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#1f5ed8]"
    >
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-base font-semibold text-white"
        style={{ backgroundColor: getAccountColor(account.id) }}
      >
        {getAccountInitial(account.label)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-semibold">{account.label}</span>
        {account.identifier ? (
          <span className="block truncate text-sm font-medium text-[#777]">
            {account.identifier}
          </span>
        ) : null}
      </span>
      {!account.isConnected ? (
        <span className="shrink-0 text-sm font-semibold text-[#777]">
          {intl.formatMessage({
            defaultMessage: 'Signed out',
            id: 'login.accountChoice.signedOut',
          })}
        </span>
      ) : null}
    </AccountActionForm>
  );
}

function AccountActionForm({
  action,
  children,
  className,
}: {
  action: AccountAction;
  children: React.ReactNode;
  className: string;
}) {
  return (
    <form action={action.url} method="post">
      <input type="hidden" name="login_challenge" value={action.loginChallenge} />
      <input type="hidden" name="intent_token" value={action.intentToken} />
      <input type="hidden" name="selection" value={action.selection} />
      {action.accountId ? <input type="hidden" name="account_id" value={action.accountId} /> : null}
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
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

function SquareCardHeader() {
  const intl = useIntl();

  return (
    <header className="mb-8">
      <p className="text-sm leading-5 font-semibold text-[#777]">
        {intl.formatMessage({
          defaultMessage: 'Welcome back',
          id: 'login.form.eyebrow',
        })}
      </p>
      <h2
        id="login-form-title"
        className="mt-2 text-2xl leading-8 font-bold tracking-normal text-[#242424]"
      >
        {intl.formatMessage({
          defaultMessage: 'Sign in',
          id: 'login.form.title',
        })}
      </h2>
    </header>
  );
}

function SquareCardContent({ children }: PropsWithChildren) {
  return <div className="w-full">{children}</div>;
}

function SquareCardFooter() {
  return (
    <footer className="mt-8 text-base font-semibold text-[#1f5ed8]">
      <DefaultCardFooter />
    </footer>
  );
}

function SquareFormRoot({ className: _className, ...props }: OryFormRootProps) {
  return <form {...props} className="w-full" />;
}

function SquareFormGroup({ children }: PropsWithChildren) {
  return <div className="grid grid-cols-1 gap-5">{children}</div>;
}

function SquareSsoRoot({ children }: PropsWithChildren) {
  if (!children) {
    return null;
  }

  return <div className="mb-5 grid grid-cols-1 gap-3">{children}</div>;
}

function SquareLabel({ attributes, children, fieldError, node }: OryNodeLabelProps) {
  const intl = useIntl();
  const { Message } = useComponents();
  const label = getNodeLabel(node);

  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <label
          className="text-sm leading-5 font-semibold text-[#242424]"
          htmlFor={attributes.name}
          data-testid={`ory/form/node/input/label/${attributes.name}`}
        >
          {uiTextToFormattedMessage(label, intl)}
        </label>
      ) : null}
      {children}
      {node.messages.map((message) => (
        <Message.Content key={message.id} message={message} />
      ))}
      {isUiText(fieldError) ? <Message.Content message={fieldError} /> : null}
      <LabelAction attributes={attributes} />
    </div>
  );
}

function LabelAction({ attributes }: { attributes: UiNodeInputAttributes }) {
  const intl = useIntl();
  const { flow } = useOryFlow();
  const config = useOryConfiguration();

  const isRefreshFlow = 'refresh' in flow && Boolean(flow.refresh);

  if (attributes.type !== 'password' || !config.project.recovery_enabled || isRefreshFlow) {
    return null;
  }

  return (
    <a
      href={`${config.sdk.url}/self-service/recovery/browser?return_to=${encodeURIComponent(
        flow.return_to ?? config.project.default_redirect_url ?? '',
      )}`}
      className="w-fit text-sm font-semibold text-[#1f5ed8] underline transition hover:text-[#1749aa]"
      data-testid="ory/screen/login/action/forgot-password"
    >
      {intl.formatMessage({
        defaultMessage: 'Forgot password?',
        id: 'forms.label.forgot-password',
      })}
    </a>
  );
}

function SquareInput({ inputProps }: OryNodeInputProps) {
  if (inputProps.type === 'hidden') {
    return <input data-testid={`ory/form/node/input/${inputProps.name}`} {...inputProps} />;
  }

  return (
    <input
      data-testid={`ory/form/node/input/${inputProps.name}`}
      {...inputProps}
      className="h-12 w-full rounded-md border border-[#d8d8d8] bg-white px-4 text-base text-[#242424] transition placeholder:text-[#8a8a8a] hover:border-[#bdbdbd] focus:border-[#1f5ed8] focus:ring-0 focus:outline-none disabled:cursor-not-allowed disabled:bg-[#f3f3f3] disabled:text-[#777]"
    />
  );
}

function SquareButton({ buttonProps, isSubmitting, node }: OryNodeButtonProps) {
  const intl = useIntl();
  const label = getNodeLabel(node);
  const isPrimary = node.attributes.name === 'method' || node.attributes.name.includes('passkey');

  return (
    <button
      {...buttonProps}
      data-testid={`ory/form/node/button/${node.attributes.name}`}
      data-loading={isSubmitting}
      className={
        isPrimary
          ? 'inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#2157c8] px-7 text-base font-semibold text-white transition hover:bg-[#1b49aa] disabled:cursor-not-allowed disabled:opacity-70'
          : 'inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#f0f1f2] px-7 text-base font-semibold text-[#1f5ed8] transition hover:bg-[#e6e8eb] disabled:cursor-not-allowed disabled:opacity-70'
      }
    >
      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {label ? <span>{uiTextToFormattedMessage(label, intl)}</span> : null}
    </button>
  );
}

function SquareSsoButton({ buttonProps, isSubmitting, node }: OryNodeSsoButtonProps) {
  const intl = useIntl();
  const label = node.meta.label ? uiTextToFormattedMessage(node.meta.label, intl) : '';

  return (
    <button
      {...buttonProps}
      data-testid={`ory/form/node/input/${node.attributes.name}`}
      data-loading={isSubmitting}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-[#d8d8d8] bg-white px-7 text-base font-semibold text-[#242424] transition hover:border-[#bdbdbd] hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-70"
      aria-label={typeof label === 'string' ? label : undefined}
    >
      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {label ? <span>{label}</span> : null}
    </button>
  );
}

function SquareMessageRoot({ children }: PropsWithChildren) {
  if (!children) {
    return null;
  }

  return <div className="mb-5 grid gap-2">{children}</div>;
}

function SquareMessageContent({ message }: { message: UiText }) {
  const intl = useIntl();
  const isError = message.type === 'error';

  return (
    <p
      className={
        isError
          ? 'rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700'
          : 'rounded-md border border-[#d8d8d8] bg-[#f7f7f7] px-4 py-3 text-sm leading-5 text-[#575757]'
      }
    >
      {uiTextToFormattedMessage(message, intl)}
    </p>
  );
}

function SquareDivider() {
  return <div className="h-px w-full bg-[#e5e5e5]" />;
}

const squareLoginComponents: OryFlowComponentOverrides = {
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
    SsoRoot: SquareSsoRoot,
  },
  Message: {
    Content: SquareMessageContent,
    Root: SquareMessageRoot,
  },
  Node: {
    Button: SquareButton,
    Input: SquareInput,
    Label: SquareLabel,
    SsoButton: SquareSsoButton,
  },
};

function useLoginClientName() {
  return useContext(LoginClientNameContext);
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

function getAccountInitial(label: string) {
  return label.trim().charAt(0).toUpperCase() || '?';
}

function getAccountColor(seed: string) {
  const colors = [
    '#0097a7',
    '#546e7a',
    '#00796b',
    '#0288d1',
    '#8d6e63',
    '#ef6c00',
    '#558b2f',
    '#ab47bc',
  ];
  let hash = 0;

  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return colors[hash % colors.length];
}

function isUiText(value: unknown): value is UiText {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'text' in value &&
    'type' in value
  );
}
