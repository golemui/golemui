/**
 * @internal Used by the framework sidebar layouts, not part of the end-user public API.
 *
 * The parts of the sidebar layout the four adapters must render the same way.
 */
import { message } from '@golemui/gui-components/internals';
import { repeaterIndexSuffix } from './repeater';

/** A widget as the adapters receive it: its uid is all the sidebar needs here. */
type WithUid = { uid: string };

/**
 * The side child and the main child of a sidebar. They are matched by uid against the order of
 * the definition, not by their place among the rendered children: a side child hidden by a state
 * leaves the main one as the main one.
 *
 * @param layoutUid - The sidebar's uid, row index suffix included.
 * @param definition - The sidebar's children as defined: the side one first, the main one second.
 * @param rendered - The children the form renders now.
 */
export function sidebarRegions<Child extends WithUid>(
  layoutUid: string,
  definition: readonly WithUid[] | undefined,
  rendered: readonly Child[],
): { side?: Child; main?: Child } {
  const suffix = repeaterIndexSuffix(layoutUid);
  const find = (uid: string | undefined) =>
    uid === undefined
      ? undefined
      : rendered.find((child) => child.uid === uid || child.uid === `${uid}${suffix}`);
  return { side: find(definition?.[0]?.uid), main: find(definition?.[1]?.uid) };
}

/**
 * The DOM id of the side region, which the toggle names in `popovertarget`: the side region is
 * also the drawer.
 *
 * @param layoutDomId - The sidebar's DOM id.
 * @example
 * sidebarSideId('checkout-shell'); // 'checkout-shell_side'
 */
export function sidebarSideId(layoutDomId: string): string {
  return `${layoutDomId}_side`;
}

/** The name of the side region and the drawer: the `sideLabel` prop, or "Menu". */
export function sidebarSideLabel(label: unknown): string {
  return typeof label === 'string' && label !== '' ? label : message('sidebarSide');
}

/** The name of the toggle: the `toggleLabel` prop, or "Open menu". */
export function sidebarToggleLabel(label: unknown): string {
  return typeof label === 'string' && label !== '' ? label : message('openSidebar');
}
