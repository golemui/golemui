import { describe, expect, it } from 'vitest';
import '../registerAll';
import {
  getItemTypeKind,
  getRegisteredItemTypes,
  type ShortcutItemKind,
} from '../core/itemTypeRegistry';

// Umbrella selectors (INPUTS, ACTIONS, DISPLAYS, LAYOUTS) match item types by
// kind. Every registration declares its kind, and this snapshot pins the full
// mapping so the declared kinds and the umbrella table in
// selectorResolver.service.ts cannot drift apart.
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
  INPUTS: 'input',
  LAYOUTS: 'layout',
  LIST: 'input',
  MARKDOWN: 'input',
  MARKDOWN_TEXTS: 'display',
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
    const registered = [...getRegisteredItemTypes()].sort();
    expect(registered).toEqual(Object.keys(expectedKindByItemType).sort());
  });

  it('declares a kind for every registered item type', () => {
    for (const itemType of getRegisteredItemTypes()) {
      expect(getItemTypeKind(itemType), `item type ${itemType}`).toBeDefined();
    }
  });

  it('declares the kind that matches the umbrella table for every item type', () => {
    for (const [itemType, expectedKind] of Object.entries(expectedKindByItemType)) {
      expect(getItemTypeKind(itemType), `item type ${itemType}`).toBe(expectedKind);
    }
  });
});
