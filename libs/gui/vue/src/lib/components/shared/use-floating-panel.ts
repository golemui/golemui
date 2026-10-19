import { GUIFloatingPanel } from '@golemui/gui-components/internals';
import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue';

/**
 * Shows a field's panel (rendered with `popover="manual"`) in the top layer while `open`, placed
 * under the field, so no container clips it. The component keeps deciding when it opens.
 */
export function useFloatingPanel(
  panel: Ref<HTMLElement | null>,
  field: Ref<Element | null>,
  open: Ref<boolean>,
): void {
  let floating: GUIFloatingPanel | null = null;

  onMounted(() => {
    floating = new GUIFloatingPanel({ panel: () => panel.value, anchor: () => field.value });
    floating.sync(open.value);
  });
  // After the DOM update, so the panel is no longer hidden when it shows.
  watch(open, (value) => floating?.sync(value), { flush: 'post' });
  onBeforeUnmount(() => {
    floating?.dispose();
    floating = null;
  });
}
