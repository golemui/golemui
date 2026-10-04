// ─── Internal building blocks ───
//
// Shared by @golemui/lit and @golemui/gui-components, which do not depend on each other. End
// users import safeDefine from @golemui/lit instead.

export { cspStyleMap, type CspStyleInfo } from './lib/csp-style-map';
export { onElementRegistered, safeDefine, tagNameOf } from './lib/define';
export { resumeServerRendered } from './lib/resume';
