type HydraFlowErrorOptions = {
  cause?: unknown;
  code: string;
  description?: string;
  status?: number;
};

export class HydraFlowError extends Error {
  readonly cause?: unknown;
  readonly code: string;
  readonly description: string;
  readonly status: number;

  constructor(message: string, options: HydraFlowErrorOptions) {
    super(message);
    this.name = 'HydraFlowError';
    this.code = options.code;
    this.description = options.description ?? message;
    this.status = options.status ?? 500;
    this.cause = options.cause;
  }
}

export function createHydraFlowError(
  context: string,
  error: unknown,
  options: Omit<HydraFlowErrorOptions, 'cause'>,
) {
  const hydraError = new HydraFlowError(options.description ?? context, {
    ...options,
    cause: error,
  });

  console.error(`[hydra] ${context}`, {
    code: hydraError.code,
    description: hydraError.description,
    error,
  });

  return hydraError;
}

export function toErrorPageHref(error: unknown) {
  const searchParams = new URLSearchParams();

  if (error instanceof HydraFlowError) {
    searchParams.set('error', error.code);
    searchParams.set('error_description', error.description);
    return `/error?${searchParams.toString()}`;
  }

  searchParams.set('error', 'auth_flow_error');
  searchParams.set(
    'error_description',
    error instanceof Error ? error.message : 'Authentication flow failed.',
  );
  return `/error?${searchParams.toString()}`;
}

export function toErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof HydraFlowError) {
    return {
      body: {
        code: error.code,
        error: error.description,
      },
      status: error.status,
    };
  }

  return {
    body: {
      code: 'auth_flow_error',
      error: error instanceof Error ? error.message : fallbackMessage,
    },
    status: 500,
  };
}
