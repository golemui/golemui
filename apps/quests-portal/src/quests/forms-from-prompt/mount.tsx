/**
 * Lazy React entry for the FORMS FROM A PROMPT quest. The portal's vanilla
 * launcher dynamically imports this and mounts it into the forms-from-prompt
 * pane, so React stays out of the landing bundle. `onComplete` hands control
 * back to the launcher (it returns to the /demos page) when the walk finishes
 * or is skipped.
 */
import { enableDevMode } from '@golemui/core';
import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FormsFromPromptQuest } from './FormsFromPromptQuest';
import type { Framework } from '@golemui/demo-engine';
import './forms-from-prompt.scss';

let root: Root | null = null;

export interface MountOptions {
  framework: Framework;
  onComplete: () => void;
}

export function mountFormsFromPrompt(el: HTMLElement, { framework, onComplete }: MountOptions) {
  if (import.meta.env.DEV) enableDevMode();
  if (!root) root = createRoot(el);
  root.render(
    <StrictMode>
      <FormsFromPromptQuest framework={framework} onComplete={onComplete} />
    </StrictMode>,
  );
}

export function unmountFormsFromPrompt() {
  root?.unmount();
  root = null;
}
