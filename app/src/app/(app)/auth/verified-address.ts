export type VerifiableIdentity = {
  traits?: unknown;
  verifiable_addresses?: Array<{
    value?: string;
    verified?: boolean;
    via?: string;
  }>;
};

export type VerifiedEmailStatus =
  { email: null; verified: false } | { email: string; verified: boolean };

export function getVerifiedEmailStatus(identity: VerifiableIdentity): VerifiedEmailStatus {
  const traits = isRecord(identity.traits) ? identity.traits : {};
  const email = normalizeEmail(traits.email);

  if (!email) {
    return { email: null, verified: false };
  }

  const verified = Boolean(
    identity.verifiable_addresses?.some(
      (address) =>
        address.via === 'email' &&
        normalizeEmail(address.value) === email &&
        address.verified === true,
    ),
  );

  return { email, verified };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeEmail(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : null;
}
