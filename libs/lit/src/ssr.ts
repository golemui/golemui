// The Forms server API: the element rendering shared with @golemui/gui-components (from
// @golemui/lit-utils/ssr), plus the form.
export {
  cleanServerMarkup,
  installLitSsrSupport,
  RegisteredElementRenderer,
  renderTemplate,
} from '@golemui/lit-utils/ssr';
export type { CleanOptions } from '@golemui/lit-utils/ssr';
export { renderForm } from './lib/ssr/server';
