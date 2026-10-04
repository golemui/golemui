// Server-only entry point. It needs @lit-labs/ssr, an optional peer dependency.

export {
  GuiSsrElementRenderer,
  installLitSsrSupport,
  renderGuiHtml,
  stripFalseBooleanAttributes,
  stripShadowRootTemplates,
} from './lib/ssr/server';
