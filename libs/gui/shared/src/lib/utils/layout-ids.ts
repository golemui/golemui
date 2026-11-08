/**
 * @internal Used by framework layout components, not part of the end-user public API.
 *
 * DOM ids and `data-cy` values for the tabs and accordion layouts. They are built from the layout
 * widget plus the tab or section uid, never from a position, so two repeater rows of the same
 * layout produce different ids: the layout uid already carries the row index suffix.
 *
 * The DOM ids extend the layout's own DOM id (its uid behind the form's name, see `toDomId` in
 * `@golemui/core`), like every other part of a widget: a tab of the `37fb1161-dx_72` tabs is
 * `37fb1161-dx_72_tab_billing`. The `data-cy` values keep the bare layout uid.
 */

/**
 * The DOM id of a tab button.
 *
 * @param layoutDomId - The tabs layout's DOM id: its uid, row index suffix included, behind the
 *   form's name.
 * @param tabUid - The tab uid from the layout props.
 * @example
 * tabButtonId('signup-rowTabs[1]', 'secondPanel'); // 'signup-rowTabs[1]_tab_secondPanel'
 */
export function tabButtonId(layoutDomId: string, tabUid: string): string {
  return `${layoutDomId}_tab_${tabUid}`;
}

/**
 * The DOM id of a tab panel. The tab button's `aria-controls` and the panel's `aria-labelledby`
 * are the other side of the same pair.
 *
 * @param layoutDomId - The tabs layout's DOM id: its uid, row index suffix included, behind the
 *   form's name.
 * @param tabUid - The tab uid from the layout props.
 * @example
 * tabPanelId('signup-rowTabs[1]', 'secondPanel'); // 'signup-rowTabs[1]_tabpanel_secondPanel'
 */
export function tabPanelId(layoutDomId: string, tabUid: string): string {
  return `${layoutDomId}_tabpanel_${tabUid}`;
}

/**
 * The `data-cy` of a tab button, which does not change with the form's name.
 *
 * @param layoutUid - The tabs layout widget's uid, row index suffix included.
 * @param tabUid - The tab uid from the layout props.
 * @example
 * tabButtonCy('rowTabs[1]', 'secondPanel'); // 'tab_rowTabs[1]_secondPanel'
 */
export function tabButtonCy(layoutUid: string, tabUid: string): string {
  return `tab_${layoutUid}_${tabUid}`;
}

/**
 * The `data-cy` of a tab panel, which does not change with the form's name.
 *
 * @param layoutUid - The tabs layout widget's uid, row index suffix included.
 * @param tabUid - The tab uid from the layout props.
 * @example
 * tabPanelCy('rowTabs[1]', 'secondPanel'); // 'tabpanel_rowTabs[1]_secondPanel'
 */
export function tabPanelCy(layoutUid: string, tabUid: string): string {
  return `tabpanel_${layoutUid}_${tabUid}`;
}

/**
 * The DOM id of an accordion header button.
 *
 * @param layoutDomId - The accordion layout's DOM id: its uid, row index suffix included, behind
 *   the form's name.
 * @param sectionUid - The section uid from the layout props.
 * @example
 * accordionButtonId('signup-rowAccordion[1]', 'secondSection'); // 'signup-rowAccordion[1]_accordion_button_secondSection'
 */
export function accordionButtonId(layoutDomId: string, sectionUid: string): string {
  return `${layoutDomId}_accordion_button_${sectionUid}`;
}

/**
 * The DOM id of an accordion section region.
 *
 * @param layoutDomId - The accordion layout's DOM id: its uid, row index suffix included, behind
 *   the form's name.
 * @param sectionUid - The section uid from the layout props.
 * @example
 * accordionSectionId('signup-rowAccordion[1]', 'secondSection'); // 'signup-rowAccordion[1]_accordion_section_secondSection'
 */
export function accordionSectionId(layoutDomId: string, sectionUid: string): string {
  return `${layoutDomId}_accordion_section_${sectionUid}`;
}
