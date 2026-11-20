import { mockMarkdownParser, mockUploadService, signup } from '@golemui/apps-shared';
import type { Dependencies, GuiFormInitConfig } from '@golemui/gui-shared';

const dependencies: Dependencies = {
  markdown: mockMarkdownParser,
  uploadService: mockUploadService,
};

// Shared by the server render (page frontmatter) and the client resume (page script).
export const config: GuiFormInitConfig = {
  // Stable id: the server and the client must agree on the form id.
  formName: 'astro-json-signup',
  formDef: signup.form,
  data: signup.data,
  dependencies,
};
