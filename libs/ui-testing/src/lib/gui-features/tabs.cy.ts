import { defineForm } from '@golemui/core';
import { expectNoDuplicateIds, type MountComponentFn } from '../utils';

export const runTabsComponentTests = (mountFn: MountComponentFn) => {
  describe('Tabs Component', () => {
    const TABS_UID = 'settingsTabs';

    const getFormDefinition = (
      props: Record<string, unknown> = {},
      thirdPanelInclude?: { when: string },
    ) =>
      defineForm({
        form: [
          {
            uid: TABS_UID,
            kind: 'layout',
            type: 'tabs',
            props: {
              tabs: [
                { uid: 'firstPanel', label: 'First' },
                { uid: 'secondPanel', label: 'Second' },
                { uid: 'thirdPanel', label: 'Third' },
              ],
              ...props,
            },
            children: [
              {
                uid: 'firstPanel',
                kind: 'input',
                type: 'textinput',
                path: 'tabs.first',
                label: 'First',
              },
              {
                uid: 'secondPanel',
                kind: 'input',
                type: 'textinput',
                path: 'tabs.second',
                label: 'Second',
              },
              {
                uid: 'thirdPanel',
                kind: 'input',
                type: 'textinput',
                path: 'tabs.third',
                label: 'Third',
                ...(thirdPanelInclude ? { include: thirdPanelInclude } : {}),
              },
            ],
          },
        ],
      });

    it('gives every tab and panel an id built from the tab uid', () => {
      mountFn({ formDef: getFormDefinition() });

      ['firstPanel', 'secondPanel', 'thirdPanel'].forEach((tabUid) => {
        cy.get(`[data-cy="tab_${TABS_UID}_${tabUid}"]`).should(
          'have.attr',
          'aria-controls',
          `tabpanel_${TABS_UID}_${tabUid}`,
        );
        cy.get(`[data-cy="tabpanel_${TABS_UID}_${tabUid}"]`)
          .should('have.attr', 'id', `tabpanel_${TABS_UID}_${tabUid}`)
          .and('have.attr', 'aria-labelledby', `tab_${TABS_UID}_${tabUid}`);
      });

      expectNoDuplicateIds();
    });

    it('points the active tab at the only panel rendered in activeOnly mode', () => {
      mountFn({
        formDef: getFormDefinition({ renderMode: 'activeOnly', defaultOpen: 'secondPanel' }),
      });

      // The single rendered panel is the second one, so both sides of the pair carry its tab uid
      cy.get('section[role="tabpanel"]').should('have.length', 1);
      cy.get(`[data-cy="tab_${TABS_UID}_secondPanel"]`)
        .should('have.attr', 'aria-selected', 'true')
        .and('have.attr', 'aria-controls', `tabpanel_${TABS_UID}_secondPanel`);
      cy.get('section[role="tabpanel"]')
        .should('have.attr', 'id', `tabpanel_${TABS_UID}_secondPanel`)
        .and('have.attr', 'aria-labelledby', `tab_${TABS_UID}_secondPanel`);
    });

    it('keeps the remaining panels wired to their own tab when a child is hidden', () => {
      mountFn({
        data: { tabs: { first: 'Alice' } },
        formDef: getFormDefinition({}, { when: '$form.tabs.first === "Bob"' }),
      });

      // The third tab's child is hidden, so its header stays and its panel is gone
      cy.get(`[data-cy="tab_${TABS_UID}_thirdPanel"]`).should('exist');
      cy.get(`[data-cy="tabpanel_${TABS_UID}_thirdPanel"]`).should('not.exist');

      // The tabs that are left still address their own panel and not a neighbour's
      cy.get(`[data-cy="tabpanel_${TABS_UID}_secondPanel"]`).should(
        'have.attr',
        'aria-labelledby',
        `tab_${TABS_UID}_secondPanel`,
      );
      cy.get(`[data-cy="tabpanel_${TABS_UID}_firstPanel"]`).should(
        'have.attr',
        'aria-labelledby',
        `tab_${TABS_UID}_firstPanel`,
      );
    });
  });
};
