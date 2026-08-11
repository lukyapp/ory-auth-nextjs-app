'use client';

import { getNodeLabel, type SettingsFlow, type UiText } from '@ory/client-fetch';
import {
  OrySettingsCard,
  uiTextToFormattedMessage,
  useComponents,
  type OryCardSettingsSectionProps,
  type OryClientConfiguration,
  type OryFlowComponentOverrides,
  type OryFormSectionContentProps,
  type OryFormSectionFooterProps,
  type OryNodeButtonProps,
  type OryNodeCheckboxProps,
  type OryNodeInputProps,
  type OryNodeLabelProps,
} from '@ory/elements-react';
import { SessionProvider } from '@ory/elements-react/client';
import { Settings } from '@ory/elements-react/theme';
import { CheckCircle2, KeyRound, Loader2, ShieldCheck, UserRound } from 'lucide-react';
import { type PropsWithChildren } from 'react';
import { useIntl } from 'react-intl';

type SettingsAccountSummary = {
  displayName: string;
  email: string;
  picture: string | null;
  recoveryStatus: string;
  verificationStatus: string;
};

type SettingsUiProps = {
  account: SettingsAccountSummary;
  config: OryClientConfiguration;
  flow: SettingsFlow;
  session: React.ComponentProps<typeof SessionProvider>['session'];
};

export function SettingsUi({ account, config, flow, session }: SettingsUiProps) {
  return (
    <SessionProvider session={session}>
      <Settings flow={flow} config={config} components={squareSettingsComponents}>
        <SettingsShell account={account}>
          <OrySettingsCard />
        </SettingsShell>
      </Settings>
    </SessionProvider>
  );
}

function SettingsShell({
  account,
  children,
}: PropsWithChildren<{ account: SettingsAccountSummary }>) {
  const intl = useIntl();

  return (
    <div className="min-h-screen bg-white text-[#1f1f1f]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[33rem_1fr]">
        <aside className="flex min-h-[32rem] flex-col bg-[#f3f3f3] px-8 py-8 sm:px-12 lg:sticky lg:top-0 lg:min-h-screen lg:px-20 lg:py-20">
          <div className="flex items-center gap-2 text-[1.05rem] font-semibold">
            <span className="grid h-6 w-6 place-items-center rounded-[4px] bg-[#1f1f1f]">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-white" />
            </span>
            {intl.formatMessage({
              defaultMessage: 'Account settings',
              id: 'settings.brand',
            })}
          </div>

          <div className="flex flex-1 flex-col justify-center py-12 lg:py-0">
            <ProfileAvatar displayName={account.displayName} picture={account.picture} />
            <h1 className="mt-7 max-w-[24rem] text-[1.75rem] leading-[1.22] font-bold tracking-normal text-balance sm:text-[2rem]">
              {account.displayName}
            </h1>
            <p className="mt-7 max-w-[24rem] text-lg leading-7 font-semibold text-[#777]">
              {intl.formatMessage({
                defaultMessage:
                  'Review your profile details, sign-in methods, verification status, and recovery access.',
                id: 'settings.hero.description',
              })}
            </p>
          </div>

          <div className="grid gap-3 text-sm">
            <SummaryRow
              icon={<UserRound className="h-4 w-4" aria-hidden="true" />}
              label={intl.formatMessage({
                defaultMessage: 'Email',
                id: 'settings.summary.email',
              })}
              value={account.email}
            />
            <SummaryRow
              icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
              label={intl.formatMessage({
                defaultMessage: 'Verification',
                id: 'settings.summary.verification',
              })}
              value={account.verificationStatus}
            />
            <SummaryRow
              icon={<KeyRound className="h-4 w-4" aria-hidden="true" />}
              label={intl.formatMessage({
                defaultMessage: 'Recovery',
                id: 'settings.summary.recovery',
              })}
              value={account.recoveryStatus}
            />
          </div>
        </aside>

        <main className="px-8 py-14 sm:px-12 lg:px-20">
          <section className="mx-auto w-full max-w-[44.5rem]" aria-labelledby="settings-title">
            <header className="mb-8">
              <p className="text-sm leading-5 font-semibold text-[#777]">
                {intl.formatMessage({
                  defaultMessage: 'Account settings',
                  id: 'settings.form.eyebrow',
                })}
              </p>
              <h2
                id="settings-title"
                className="mt-2 text-2xl leading-8 font-bold tracking-normal text-[#242424]"
              >
                {intl.formatMessage({
                  defaultMessage: 'Manage account',
                  id: 'settings.form.title',
                })}
              </h2>
            </header>
            <div className="grid gap-5">{children}</div>
          </section>
        </main>
      </div>
    </div>
  );
}

function ProfileAvatar({ displayName, picture }: { displayName: string; picture: string | null }) {
  if (picture) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={displayName}
        className="h-24 w-24 rounded-[1.25rem] bg-[#dddddd] object-cover shadow-[0_2px_8px_rgba(0,0,0,0.10)]"
        src={picture}
      />
    );
  }

  return (
    <div className="grid h-24 w-24 place-items-center rounded-[1.25rem] bg-[#dddddd] text-3xl font-bold text-[#242424] uppercase shadow-[0_2px_8px_rgba(0,0,0,0.10)]">
      {displayName.charAt(0)}
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-12 items-center gap-3 border-t border-[#dedede] py-3 first:border-t-0">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white text-[#777]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-[#777]">{label}</span>
        <span className="block truncate text-sm font-semibold text-[#242424]">{value}</span>
      </span>
    </div>
  );
}

function SquareSettingsSection({ children, ...props }: OryCardSettingsSectionProps) {
  return (
    <form {...props} className="rounded-md border border-[#d8d8d8] bg-white p-5 sm:p-6">
      {children}
    </form>
  );
}

function SquareSettingsSectionContent({
  children,
  description,
  title,
}: OryFormSectionContentProps) {
  return (
    <div>
      {title ? <h3 className="text-lg leading-6 font-bold text-[#242424]">{title}</h3> : null}
      {description ? (
        <p className="mt-2 max-w-[36rem] text-sm leading-5 text-[#737373]">{description}</p>
      ) : null}
      <div className="mt-5 grid grid-cols-1 gap-5">{children}</div>
    </div>
  );
}

function SquareSettingsSectionFooter({ children, text }: OryFormSectionFooterProps) {
  if (!children && !text) {
    return null;
  }

  return (
    <footer className="mt-6 flex flex-col gap-3 border-t border-[#e5e5e5] pt-5">
      {text ? <p className="text-sm leading-5 text-[#737373]">{text}</p> : null}
      {children}
    </footer>
  );
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

function SquareCheckbox({ inputProps, node }: OryNodeCheckboxProps) {
  const intl = useIntl();
  const label = getNodeLabel(node);

  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-[#242424]">
      <input
        {...inputProps}
        className="mt-0.5 h-4 w-4 rounded border-[#d8d8d8] text-[#2157c8] focus:ring-[#1f5ed8]"
        data-testid={`ory/form/node/input/${node.attributes.name}`}
      />
      <span>
        {label ? uiTextToFormattedMessage(label, intl) : null}
        {node.messages.map((message) => (
          <span
            key={message.id}
            className={
              message.type === 'error'
                ? 'mt-1 block text-sm text-red-700'
                : 'mt-1 block text-sm text-[#737373]'
            }
          >
            {uiTextToFormattedMessage(message, intl)}
          </span>
        ))}
      </span>
    </label>
  );
}

function SquareButton({ buttonProps, isSubmitting, node }: OryNodeButtonProps) {
  const intl = useIntl();
  const label = getNodeLabel(node);
  const isPrimary = node.attributes.type === 'submit' || node.attributes.name === 'method';

  return (
    <button
      {...buttonProps}
      data-testid={`ory/form/node/button/${node.attributes.name}`}
      data-loading={isSubmitting}
      className={
        isPrimary
          ? 'inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#2157c8] px-7 text-base font-semibold text-white transition hover:bg-[#1b49aa] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto'
          : 'inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#f0f1f2] px-7 text-base font-semibold text-[#1f5ed8] transition hover:bg-[#e6e8eb] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto'
      }
    >
      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {label ? <span>{uiTextToFormattedMessage(label, intl)}</span> : null}
    </button>
  );
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
      {isSuccess ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : null}
      {uiTextToFormattedMessage(message, intl)}
    </div>
  );
}

const squareSettingsComponents: OryFlowComponentOverrides = {
  Card: {
    SettingsSection: SquareSettingsSection,
    SettingsSectionContent: SquareSettingsSectionContent,
    SettingsSectionFooter: SquareSettingsSectionFooter,
  },
  Message: {
    Content: SquareMessageContent,
  },
  Node: {
    Button: SquareButton,
    Checkbox: SquareCheckbox,
    Input: SquareInput,
    Label: SquareLabel,
  },
};

function isUiText(value: unknown): value is UiText {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'text' in value &&
    'type' in value
  );
}
