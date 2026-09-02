import { mockUploadService, modularDx } from '@golemui/apps-shared';
import type { Dependencies, GuiFormInitConfig } from '@golemui/gui-shared';
import snarkdown from 'snarkdown';

const md = modularDx;

const dependencies: Dependencies = {
  markdown: { parse: (markdown: string) => snarkdown(markdown) },
  uploadService: mockUploadService,
};

// Shared by the server render (page frontmatter) and the client resume (page script).
export const config: GuiFormInitConfig = {
  // Stable id: the server and the client must agree on the form id.
  formName: 'astro-dx-modular',
  formDef: md.formDef,
  data: md.data,
  formSelectors: md.formSelectors,
  formConfig: md.formConfig,
  dependencies,
};
