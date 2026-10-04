// Server-only entry point: renders the elements to HTML in Node. It needs @lit-labs/ssr, an
// optional peer dependency. The browser side is resumeServerRendered, from the main entry.

export { GuiSsrElementRenderer, installLitSsrSupport, renderGuiHtml } from '@golemui/lit-utils/ssr';
