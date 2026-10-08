// Server-only entry point. It needs @lit-labs/ssr, an optional peer dependency. Importing it also
// registers renderElement as the server renderer that framework components look up.

export { cleanServerMarkup, type CleanOptions } from './lib/ssr/markup';
export { renderElementsInDocument, renderElementsInHtml } from './lib/ssr/page';
export { renderElement, renderTemplate } from './lib/ssr/render';
export { installLitSsrSupport, RegisteredElementRenderer } from './lib/ssr/support';
export type { ElementRenderValues, RenderedElement } from './lib/server-renderer';
