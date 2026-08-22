import { describe, expect, it } from 'vitest';
import { accordionButtonId, accordionSectionId, tabButtonId, tabPanelId } from './layout-ids';

describe('layout ids', () => {
  it('builds a tab button id from the layout uid and the tab uid', () => {
    expect(tabButtonId('settingsTabs', 'firstPanel')).toBe('tab_settingsTabs_firstPanel');
  });

  it('builds a tab panel id from the layout uid and the tab uid', () => {
    expect(tabPanelId('settingsTabs', 'firstPanel')).toBe('tabpanel_settingsTabs_firstPanel');
  });

  it('builds an accordion button id from the layout uid and the section uid', () => {
    expect(accordionButtonId('settings', 'firstSection')).toBe(
      'accordion_button_settings_firstSection',
    );
  });

  it('builds an accordion section id from the layout uid and the section uid', () => {
    expect(accordionSectionId('settings', 'firstSection')).toBe(
      'accordion_section_settings_firstSection',
    );
  });

  it('keeps the row index of a layout inside a repeater, so two rows differ', () => {
    expect(tabPanelId('rowTabs[0]', 'firstPanel')).not.toBe(tabPanelId('rowTabs[1]', 'firstPanel'));
    expect(accordionButtonId('rowAccordion[1]', 'secondSection')).toBe(
      'accordion_button_rowAccordion[1]_secondSection',
    );
  });
});
