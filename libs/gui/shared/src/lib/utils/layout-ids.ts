/**
 * @internal Used by framework layout components, not part of the end-user public API.
 *
 * DOM ids for the tabs and accordion layouts. They are built from the layout widget's own uid
 * plus the tab or section uid, never from a position, so two repeater rows of the same layout
 * produce different ids: the layout uid already carries the row index suffix.
 */

/**
 * The id of a tab button, also its `data-cy`.
 *
 * @param layoutUid - The tabs layout widget's uid, row index suffix included.
 * @param tabUid - The tab uid from the layout props.
 * @example
 * tabButtonId('rowTabs[1]', 'secondPanel'); // 'tab_rowTabs[1]_secondPanel'
 */
export function tabButtonId(layoutUid: string, tabUid: string): string {
  return `tab_${layoutUid}_${tabUid}`;
}

/**
 * The id of a tab panel, also its `data-cy`. The tab button's `aria-controls` and the panel's
 * `aria-labelledby` are the other side of the same pair.
 *
 * @param layoutUid - The tabs layout widget's uid, row index suffix included.
 * @param tabUid - The tab uid from the layout props.
 * @example
 * tabPanelId('rowTabs[1]', 'secondPanel'); // 'tabpanel_rowTabs[1]_secondPanel'
 */
export function tabPanelId(layoutUid: string, tabUid: string): string {
  return `tabpanel_${layoutUid}_${tabUid}`;
}

/**
 * The id of an accordion header button.
 *
 * @param layoutUid - The accordion layout widget's uid, row index suffix included.
 * @param sectionUid - The section uid from the layout props.
 * @example
 * accordionButtonId('rowAccordion[1]', 'secondSection'); // 'accordion_button_rowAccordion[1]_secondSection'
 */
export function accordionButtonId(layoutUid: string, sectionUid: string): string {
  return `accordion_button_${layoutUid}_${sectionUid}`;
}

/**
 * The id of an accordion section region.
 *
 * @param layoutUid - The accordion layout widget's uid, row index suffix included.
 * @param sectionUid - The section uid from the layout props.
 * @example
 * accordionSectionId('rowAccordion[1]', 'secondSection'); // 'accordion_section_rowAccordion[1]_secondSection'
 */
export function accordionSectionId(layoutUid: string, sectionUid: string): string {
  return `accordion_section_${layoutUid}_${sectionUid}`;
}
