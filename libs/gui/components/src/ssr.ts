// Server-only entry point: renders the elements to HTML in Node. It needs @lit-labs/ssr, an
// optional peer dependency. Importing it also lets the React components render their content on
// the server (see react.ts). It renders every element registered through safeDefine, so a widget
// set of your own renders the same way.

export {
  installLitSsrSupport,
  RegisteredElementRenderer,
  renderElement,
  renderElementsInDocument,
  renderElementsInHtml,
  renderTemplate,
  type ElementRenderValues,
  type RenderedElement,
} from '@golemui/lit-utils/ssr';
