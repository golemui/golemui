import { afterRenderEffect, DestroyRef, ElementRef, inject } from '@angular/core';
import { GUIFloatingPanel } from '@golemui/gui-components/internals';

/**
 * Shows the component's field panel (the `.gui-picker__panel` in its `.gui-widget`, rendered
 * with `popover="manual"`) in the top layer while `open()` is true, placed under the field, so no
 * container clips it. The component keeps deciding when it opens. A server render never runs it.
 *
 * Must be called in an injection context, for example a field initializer.
 */
export function injectFloatingPanel(open: () => boolean): GUIFloatingPanel {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const floating = new GUIFloatingPanel({
    panel: () => host.querySelector<HTMLElement>(':scope > .gui-widget > .gui-picker__panel'),
    anchor: () => host.querySelector(':scope > .gui-widget'),
  });
  afterRenderEffect(() => floating.sync(open()));
  inject(DestroyRef).onDestroy(() => floating.dispose());
  return floating;
}
