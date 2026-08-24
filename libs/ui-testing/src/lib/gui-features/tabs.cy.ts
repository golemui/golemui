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

    it('reads the tabs from the calculated props when a property function produces them', () => {
      // The raw prop value is the function itself, only the calculated props hold the array
      mountFn({
        formDef: getFormDefinition({
          tabs: () => [
            { uid: 'firstPanel', label: 'First' },
            { uid: 'secondPanel', label: 'Second' },
            { uid: 'thirdPanel', label: 'Third' },
          ],
        }),
      });

      cy.get('button[role="tab"]').should('have.length', 3);
      cy.get(`[data-cy="tab_${TABS_UID}_firstPanel"]`).should('have.attr', 'aria-selected', 'true');
      cy.get(`[data-cy="tabpanel_${TABS_UID}_firstPanel"]`).should('not.have.attr', 'hidden');
    });

    it('renders no tab headers and does not throw when the tabs array is empty', () => {
      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: TABS_UID,
              kind: 'layout',
              type: 'tabs',
              props: { tabs: [] },
              children: [],
            },
            {
              uid: 'outsideTabs',
              kind: 'input',
              type: 'textinput',
              path: 'outside',
              label: 'Outside',
            },
          ],
        }),
      });

      cy.get('[data-cy="outsideTabs_textinput"]').should('be.visible');
      cy.get('button[role="tab"]').should('have.length', 0);
      cy.get('section[role="tabpanel"]').should('not.exist');
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
