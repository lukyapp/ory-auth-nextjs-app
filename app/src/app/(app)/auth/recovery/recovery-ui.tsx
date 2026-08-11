'use client';

import { getNodeLabel, type RecoveryFlow, type UiText } from '@ory/client-fetch';
import {
  OryLocales,
  uiTextToFormattedMessage,
  useComponents,
  type OryClientConfiguration,
  type OryFlowComponentOverrides,
  type OryFormRootProps,
  type OryNodeAnchorProps,
  type OryNodeButtonProps,
  type OryNodeInputProps,
  type OryNodeLabelProps,
} from '@ory/elements-react';
import { DefaultCardFooter, Recovery } from '@ory/elements-react/theme';
import { AlertCircle, CheckCircle2, ChevronDown, KeyRound, Loader2 } from 'lucide-react';
import {
  createContext,
  useContext,
  useEffect,
  type ChangeEvent,
  type ClipboardEvent,
  type PropsWithChildren,
} from 'react';
import { useIntl } from 'react-intl';

type RecoveryUiProps = {
  clientName?: string | null;
  config: OryClientConfiguration;
  flow: RecoveryFlow;
};

export function RecoveryUi({ clientName, config, flow }: RecoveryUiProps) {
  return (
    <RecoveryClientNameContext.Provider value={clientName?.trim() || null}>
      <Recovery flow={flow} config={config} components={squareRecoveryComponents} />
    </RecoveryClientNameContext.Provider>
  );
}

const RecoveryClientNameContext = createContext<string | null>(null);

function SquareCardRoot({ children }: PropsWithChildren) {
  const intl = useIntl();
  const clientName =
    useRecoveryClientName() ??
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
              {intl.formatMessage({
                defaultMessage: 'Recover your account',
                id: 'recovery.hero.title',
              })}
            </h1>
            <p className="mt-7 max-w-[24rem] text-lg leading-7 font-semibold text-[#777]">
              {intl.formatMessage({
                defaultMessage: 'Get a secure code and regain access to your account.',
                id: 'recovery.hero.description',
              })}
            </p>
          </div>

          <div className="flex flex-col gap-5 text-base font-semibold text-[#1f5ed8]">
            <LanguageSelect locale={intl.locale} />
          </div>
        </aside>

        <main className="flex items-center justify-center px-8 py-14 sm:px-12 lg:px-20">
          <section className="w-full max-w-[30rem]" aria-labelledby="recovery-form-title">
            {children}
          </section>
        </main>
      </div>
    </div>
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
          defaultMessage: 'Account recovery',
          id: 'recovery.form.eyebrow',
        })}
      </p>
      <h2
        id="recovery-form-title"
        className="mt-2 text-2xl leading-8 font-bold tracking-normal text-[#242424]"
      >
        {intl.formatMessage({
          defaultMessage: 'Recover account',
          id: 'recovery.form.title',
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
    </div>
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

function SquareCodeInput({ inputProps }: OryNodeInputProps) {
  const maxLength = inputProps.maxLength ?? 6;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = normalizeRecoveryCode(event.currentTarget.value, maxLength);

    inputProps.onChange({
      currentTarget: {
        name: inputProps.name,
        value,
      },
      target: {
        name: inputProps.name,
        value,
      },
    });
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const value = normalizeRecoveryCode(event.clipboardData.getData('text/plain'), maxLength);

    if (!value) {
      return;
    }

    event.preventDefault();
    inputProps.onChange({
      currentTarget: {
        name: inputProps.name,
        value,
      },
      target: {
        name: inputProps.name,
        value,
      },
    });
  };

  return (
    <input
      data-testid={`ory/form/node/input/${inputProps.name}`}
      {...inputProps}
      autoComplete={inputProps.autoComplete || 'one-time-code'}
      inputMode="numeric"
      maxLength={maxLength}
      onChange={handleChange}
      onPaste={handlePaste}
      pattern="[0-9]*"
      value={normalizeRecoveryCode(String(inputProps.value ?? ''), maxLength)}
      className="h-12 w-full rounded-md border border-[#d8d8d8] bg-white px-4 text-base text-[#242424] transition placeholder:text-[#8a8a8a] hover:border-[#bdbdbd] focus:border-[#1f5ed8] focus:ring-0 focus:outline-none disabled:cursor-not-allowed disabled:bg-[#f3f3f3] disabled:text-[#777]"
    />
  );
}

function SquareButton({ buttonProps, isSubmitting, node }: OryNodeButtonProps) {
  const intl = useIntl();
  const label = getNodeLabel(node);
  const isPrimary = node.attributes.name === 'method' || node.attributes.name.includes('code');

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

function SquareAnchor({ attributes, node }: OryNodeAnchorProps) {
  const intl = useIntl();
  const label = getNodeLabel(node);
  const href = attributes.href;
  const isContinue = attributes.id === 'continue';

  useEffect(() => {
    if (!isContinue || !href) {
      return;
    }

    const timeout = window.setTimeout(() => {
      window.location.assign(href);
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [href, isContinue]);

  return (
    <a
      data-testid={`ory/form/node/link/${attributes.id}`}
      href={href}
      id={attributes.id}
      title={label ? String(uiTextToFormattedMessage(label, intl)) : undefined}
      className={
        isContinue
          ? 'inline-flex h-12 w-full animate-pulse items-center justify-center gap-2 rounded-md border border-emerald-600 bg-emerald-600 px-7 text-base font-semibold text-white transition hover:bg-emerald-700'
          : 'inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#f0f1f2] px-7 text-base font-semibold text-[#1f5ed8] transition hover:bg-[#e6e8eb]'
      }
    >
      {isContinue ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : null}
      <span>
        {isContinue
          ? intl.formatMessage({
              defaultMessage: 'Redirecting...',
              id: 'verification.success.redirecting',
            })
          : label
            ? uiTextToFormattedMessage(label, intl)
            : null}
      </span>
    </a>
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
  const isSuccess = message.type === 'success';

  return (
    <div
      className={
        isError
          ? 'flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700'
          : isSuccess
            ? 'flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-5 text-emerald-800'
            : 'rounded-md border border-[#d8d8d8] bg-[#f7f7f7] px-4 py-3 text-sm leading-5 text-[#575757]'
      }
    >
      {isError ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : null}
      {isSuccess ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : null}
      {uiTextToFormattedMessage(message, intl)}
    </div>
  );
}

function SquareDivider() {
  return <div className="h-px w-full bg-[#e5e5e5]" />;
}

const squareRecoveryComponents: OryFlowComponentOverrides = {
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
  Message: {
    Content: SquareMessageContent,
    Root: SquareMessageRoot,
  },
  Node: {
    Anchor: SquareAnchor,
    Button: SquareButton,
    CodeInput: SquareCodeInput,
    Input: SquareInput,
    Label: SquareLabel,
  },
};

function useRecoveryClientName() {
  return useContext(RecoveryClientNameContext);
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

function isUiText(value: unknown): value is UiText {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'text' in value &&
    'type' in value
  );
}

function normalizeRecoveryCode(value: string, maxLength: number) {
  return value.replace(/\D/g, '').slice(0, maxLength);
}
