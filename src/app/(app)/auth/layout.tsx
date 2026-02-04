import '@ory/elements-react/theme/styles.css';
import { PropsWithChildren } from 'react';

export default function DefaultCardLayout({ children }: PropsWithChildren) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-4 pb-8">
      {children}
    </main>
  );
}
