type AuthDebugValue = string | number | boolean | null | string[];

export function AuthDebugPanel({
  title,
  description,
  values,
}: {
  title: string;
  description: string;
  values: Record<string, AuthDebugValue>;
}) {
  return (
    <section className="w-full max-w-5xl rounded-3xl border border-amber-300 bg-amber-50 px-6 py-5 text-slate-900 shadow-sm">
      <p className="text-xs font-medium tracking-[0.2em] text-amber-700 uppercase">
        Developer Diagnostics
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">{description}</p>
      <dl className="mt-5 grid gap-3 md:grid-cols-2">
        {Object.entries(values).map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-amber-200 bg-white px-4 py-3">
            <dt className="text-xs font-medium tracking-[0.16em] text-slate-500 uppercase">
              {label}
            </dt>
            <dd className="mt-2 text-sm font-medium text-slate-900">{formatValue(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function shouldShowAuthDiagnostics(
  searchParams: Record<string, string | string[] | undefined>,
) {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  const rawValue = searchParams.debug;
  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;

  return value === '1' || value === 'true';
}

function formatValue(value: AuthDebugValue) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'None';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (value === null || value === '') {
    return 'None';
  }

  return String(value);
}
