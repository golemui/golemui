import { StartClient } from '@tanstack/react-start/client';
import { StrictMode, startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { golemuiReady } from './golemui';

// Same promise the server awaited: without it the first client render resolves no widgets
// and hydrates an empty tree over the server markup.
golemuiReady.then(() => {
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <StartClient />
      </StrictMode>,
      {
        // React 19 recovers from a mismatch silently; log it so it cannot pass unnoticed.
        onRecoverableError: (error) => console.error('[hydration]', error),
      },
    );
  });
});
