import { describe, expect, it } from 'vitest';
import { type ShortcutItemKind } from '@golemui/dx';
import { guiRegistry } from '../registry';

// Umbrella selectors (INPUTS, ACTIONS, DISPLAYS, LAYOUTS) match item types by
// the kind declared at registration. This snapshot pins the full mapping, so a
// changed or forgotten kind declaration fails here instead of silently changing
// which widgets an umbrella selector reaches.
const expectedKindByItemType: Record<string, ShortcutItemKind> = {
  ACCORDION: 'layout',
  ACTIONS: 'action',
  ALERTS: 'display',
  CALENDAR: 'input',
  CHECKBOX: 'input',
  CURRENCY: 'input',
  CUSTOM_ACTION: 'action',
  CUSTOM_DISPLAY: 'display',
  CUSTOM_INPUT: 'input',
  CUSTOM_LAYOUT: 'layout',
  DATE_INPUT: 'input',
  DATE_PICKER: 'input',
  DATE_TIME_CALENDAR: 'input',
  DATE_TIME_INPUT: 'input',
  DATE_TIME_PICKER: 'input',
  DISPLAYS: 'display',
  DROPDOWN: 'input',
  FILE_UPLOAD: 'input',
  INPUTS: 'input',
  LAYOUTS: 'layout',
  LIST: 'input',
  MARKDOWN: 'input',
  MARKDOWN_TEXTS: 'display',
  MULTI_DROPDOWN: 'input',
  MULTI_FILE_UPLOAD: 'input',
  MULTI_LIST: 'input',
  PASSWORD: 'input',
  RADIOGROUP: 'input',
  RANGE_CALENDAR: 'input',
  RANGE_DATE_INPUT: 'input',
  RANGE_DATE_PICKER: 'input',
  RANGE_DATE_TIME_CALENDAR: 'input',
  RANGE_DATE_TIME_INPUT: 'input',
  RANGE_DATE_TIME_PICKER: 'input',
  RANGE_TIME_INPUT: 'input',
  RANGE_TIME_PICKER: 'input',
  REPEATER: 'input',
  SELECT: 'input',
  TABS: 'layout',
  TAGS: 'input',
  TEXTAREA: 'input',
  TIME_INPUT: 'input',
  TIME_PICKER: 'input',
};

describe('item type kind registration', () => {
  it('registers exactly the snapshotted item types', () => {
    const registered = [...guiRegistry.getRegisteredItemTypes()].sort();
    expect(registered).toEqual(Object.keys(expectedKindByItemType).sort());
  });

  it('declares a kind for every registered item type', () => {
    for (const itemType of guiRegistry.getRegisteredItemTypes()) {
      expect(guiRegistry.getItemTypeKind(itemType), `item type ${itemType}`).toBeDefined();
    }
  });

  it('declares the snapshotted kind for every item type', () => {
    for (const [itemType, expectedKind] of Object.entries(expectedKindByItemType)) {
      expect(guiRegistry.getItemTypeKind(itemType), `item type ${itemType}`).toBe(expectedKind);
    }
  });
});
