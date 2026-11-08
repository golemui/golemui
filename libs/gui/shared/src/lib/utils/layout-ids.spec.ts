import { describe, expect, it } from 'vitest';
import {
  accordionButtonId,
  accordionSectionId,
  tabButtonCy,
  tabButtonId,
  tabPanelCy,
  tabPanelId,
} from './layout-ids';

describe('layout ids', () => {
  it('extends the layout DOM id with the tab uid for a tab button', () => {
    expect(tabButtonId('signup-settingsTabs', 'firstPanel')).toBe(
      'signup-settingsTabs_tab_firstPanel',
    );
  });

  it('extends the layout DOM id with the tab uid for a tab panel', () => {
    expect(tabPanelId('signup-settingsTabs', 'firstPanel')).toBe(
      'signup-settingsTabs_tabpanel_firstPanel',
    );
  });

  it('builds the data-cy of a tab and its panel from the bare layout uid', () => {
    expect(tabButtonCy('settingsTabs', 'firstPanel')).toBe('tab_settingsTabs_firstPanel');
    expect(tabPanelCy('settingsTabs', 'firstPanel')).toBe('tabpanel_settingsTabs_firstPanel');
  });

  it('extends the layout DOM id with the section uid for an accordion button', () => {
    expect(accordionButtonId('signup-settings', 'firstSection')).toBe(
      'signup-settings_accordion_button_firstSection',
    );
  });

  it('extends the layout DOM id with the section uid for an accordion section', () => {
    expect(accordionSectionId('signup-settings', 'firstSection')).toBe(
      'signup-settings_accordion_section_firstSection',
    );
  });

  it('keeps the row index of a layout inside a repeater, so two rows differ', () => {
    expect(tabPanelId('f-rowTabs[0]', 'firstPanel')).not.toBe(
      tabPanelId('f-rowTabs[1]', 'firstPanel'),
    );
    expect(accordionButtonId('f-rowAccordion[1]', 'secondSection')).toBe(
      'f-rowAccordion[1]_accordion_button_secondSection',
    );
  });
});
