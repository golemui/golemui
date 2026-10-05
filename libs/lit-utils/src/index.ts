// ─── Internal building blocks ───
//
// Shared by @golemui/lit and @golemui/gui-components, which do not depend on each other. End
// users import safeDefine from @golemui/lit instead.

export { cspStyleMap, type CspStyleInfo } from './lib/csp-style-map';
export {
  onElementRegistered,
  rendersIntoLightDom,
  safeDefine,
  SERVER_RENDERED_ATTRIBUTE,
  serverRenderedClass,
  tagNameOf,
} from './lib/define';
export { resumeServerRendered } from './lib/resume';
export {
  serverElementRenderer,
  type ElementRenderValues,
  type RenderedElement,
  type ServerElementRenderer,
} from './lib/server-renderer';
