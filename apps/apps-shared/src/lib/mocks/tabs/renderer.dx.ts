import { gui } from '@golemui/gui-shared';

/**
 * Renderer-widget kitchen-sink tab.
 *
 * `gui.displays.display(fn)` emits a `renderer` widget whose `render` prop is
 * the result of calling `fn(formApi)` on every form-data change. Each playground
 * supplies a framework-specific `fn` returning a `TemplateResult` (Lit), JSX
 * (React), `VNode` (Vue), or `{ component, api }` (Angular).
 *
 * Convention: every playground reads `$form.rendererClientName` so the input
 * below drives them all uniformly.
 */
export const buildRendererTab = (render: (api: any) => unknown) =>
  gui.layouts.flex([
    gui.displays.display(render),
    gui.inputs.textInput('rendererClientName', {
      label: 'Client name',
      placeholder: 'Type to see the renderer above react live',
      hint: 'The renderer reads $form.rendererClientName and re-renders on every keystroke.',
    }),
  ]);
