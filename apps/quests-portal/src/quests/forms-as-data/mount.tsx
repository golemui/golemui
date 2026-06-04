/**
 * Lazy React entry for the FORMS AS DATA quest. The portal's vanilla launcher
 * dynamically imports this and mounts it into the forms-as-data pane, so React
 * stays out of the landing bundle. `onComplete` hands control back to the
 * launcher (it returns to the /demos page) when the walk finishes or is skipped.
 */
import { enableDevMode } from '@golemui/core';
import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FormsAsDataQuest } from './FormsAsDataQuest';
import type { Framework } from '@golemui/demo-engine';
import './forms-as-data.scss';

let root: Root | null = null;

export interface MountOptions {
  framework: Framework;
  onComplete: () => void;
}

export function mountFormsAsData(el: HTMLElement, { framework, onComplete }: MountOptions) {
  if (import.meta.env.DEV) enableDevMode();
  if (!root) root = createRoot(el);
  root.render(
    <StrictMode>
      <FormsAsDataQuest framework={framework} onComplete={onComplete} />
    </StrictMode>,
  );
}

export function unmountFormsAsData() {
  root?.unmount();
  root = null;
}
