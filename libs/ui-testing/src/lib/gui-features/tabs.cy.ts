import { defineForm } from '@golemui/core';
import { dictionaryTranslator, expectNoDuplicateIds, type MountComponentFn } from '../utils';

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
      cy.get('[role="tabpanel"]').should('have.length', 1);
      cy.get(`[data-cy="tab_${TABS_UID}_secondPanel"]`)
        .should('have.attr', 'aria-selected', 'true')
        .and('have.attr', 'aria-controls', `tabpanel_${TABS_UID}_secondPanel`);
      cy.get('[role="tabpanel"]')
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

      cy.get('[role="tab"]').should('have.length', 3);
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
      cy.get('[role="tab"]').should('have.length', 0);
      cy.get('[role="tabpanel"]').should('not.exist');
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

    it('translates a tab label given as a translation config, again when the language changes', () => {
      const tabLabel = (tabUid: string) =>
        cy.get(`[data-cy="tab_${TABS_UID}_${tabUid}"]`).invoke('text').invoke('trim');
      const translator = dictionaryTranslator('en', {
        en: { 'tabs.billing': 'Billing' },
        es: { 'tabs.billing': 'Facturación' },
      });
      mountFn({
        localization: translator,
        formDef: getFormDefinition({
          tabs: [
            { uid: 'firstPanel', label: { key: 'tabs.billing' } },
            { uid: 'secondPanel', label: { key: 'tabs.missing', default: 'Shipping' } },
            { uid: 'thirdPanel', label: 'Third' },
          ],
        }),
      });

      tabLabel('firstPanel').should('equal', 'Billing');
      tabLabel('secondPanel').should('equal', 'Shipping');
      tabLabel('thirdPanel').should('equal', 'Third');
      // The tab names its panel, so the panel's name is the translated label too.
      cy.get(`[data-cy="tabpanel_${TABS_UID}_firstPanel"]`).should(
        'have.attr',
        'aria-labelledby',
        `tab_${TABS_UID}_firstPanel`,
      );

      cy.then(() => translator.setLang('es'));
      tabLabel('firstPanel').should('equal', 'Facturación');
      tabLabel('thirdPanel').should('equal', 'Third');
    });
  });

  describe('Tabs Component panels at runtime', () => {
    const TABS_UID = 'runtimeTabs';
    const tab = (tabUid: string) => cy.get(`[data-cy="tab_${TABS_UID}_${tabUid}"]`);
    const panel = (tabUid: string) => cy.get(`[data-cy="tabpanel_${TABS_UID}_${tabUid}"]`);
    const input = (uid: string) => cy.get(`[data-cy="${uid}_textinput"]`);

    // The `show` input outside the tabs controls the `include.when` of the tabs or of a child.
    const getFormDefinition = ({
      renderMode,
      tabsInclude,
      thirdPanelInclude,
    }: {
      renderMode?: 'all' | 'activeOnly';
      tabsInclude?: { when: string };
      thirdPanelInclude?: { when: string };
    } = {}) =>
      defineForm({
        form: [
          { uid: 'show', kind: 'input', type: 'textinput', path: 'show', label: 'Show' },
          {
            uid: TABS_UID,
            kind: 'layout',
            type: 'tabs',
            ...(tabsInclude ? { include: tabsInclude } : {}),
            props: {
              ...(renderMode ? { renderMode } : {}),
              tabs: [
                { uid: 'firstPanel', label: 'First' },
                { uid: 'secondPanel', label: 'Second' },
                { uid: 'thirdPanel', label: 'Third' },
              ],
            },
            children: [
              {
                uid: 'firstPanel',
                kind: 'input',
                type: 'textinput',
                path: 'first',
                label: 'First',
              },
              {
                uid: 'secondPanel',
                kind: 'input',
                type: 'textinput',
                path: 'second',
                label: 'Second',
              },
              {
                uid: 'thirdPanel',
                kind: 'input',
                type: 'textinput',
                path: 'third',
                label: 'Third',
                ...(thirdPanelInclude ? { include: thirdPanelInclude } : {}),
              },
            ],
          },
        ],
      });

    it('keeps the input node of an inactive panel in all mode and hides the panel', () => {
      mountFn({ formDef: getFormDefinition({ renderMode: 'all' }) });

      let firstInput!: HTMLElement;
      input('firstPanel').type('Ann');
      input('firstPanel').then(($input) => {
        firstInput = $input[0];
      });

      tab('secondPanel').click();
      tab('secondPanel').should('have.attr', 'aria-selected', 'true');
      panel('firstPanel').should('have.attr', 'hidden');
      input('firstPanel')
        .should('not.be.visible')
        .and(($input) => {
          expect($input[0], 'first input node').to.equal(firstInput);
        });

      tab('firstPanel').click();
      panel('firstPanel').should('not.have.attr', 'hidden');
      input('firstPanel')
        .should('be.visible')
        .and('have.value', 'Ann')
        .and(($input) => {
          expect($input[0], 'first input node').to.equal(firstInput);
        });
    });

    it('removes the inactive panel in activeOnly mode and shows the stored value again', () => {
      mountFn({ formDef: getFormDefinition({ renderMode: 'activeOnly' }) });

      input('firstPanel').type('Ann');

      tab('secondPanel').click();
      input('secondPanel').should('be.visible');
      input('firstPanel').should('not.exist');
      panel('firstPanel').should('not.exist');

      tab('firstPanel').click();
      input('firstPanel').should('be.visible').and('have.value', 'Ann');
      input('secondPanel').should('not.exist');
    });

    it('adds and removes the panel of a child that is shown and hidden at runtime', () => {
      mountFn({
        formDef: getFormDefinition({ thirdPanelInclude: { when: '$form.show === "yes"' } }),
      });

      tab('thirdPanel').should('exist');
      panel('thirdPanel').should('not.exist');

      input('show').type('yes');
      panel('thirdPanel').should('have.attr', 'aria-labelledby', `tab_${TABS_UID}_thirdPanel`);
      tab('thirdPanel').should('have.attr', 'aria-controls', `tabpanel_${TABS_UID}_thirdPanel`);
      tab('thirdPanel').click();
      input('thirdPanel').should('be.visible');
      tab('firstPanel').click();
      input('firstPanel').should('be.visible');

      input('show').clear();
      panel('thirdPanel').should('not.exist');
      tab('thirdPanel').should('exist').and('not.have.attr', 'aria-controls');
      input('firstPanel').should('be.visible');
      panel('firstPanel').should('have.attr', 'aria-labelledby', `tab_${TABS_UID}_firstPanel`);
    });

    it('keeps the active tab selected with no panel while its child is hidden', () => {
      mountFn({
        data: { show: 'yes' },
        formDef: getFormDefinition({ thirdPanelInclude: { when: '$form.show === "yes"' } }),
      });

      tab('thirdPanel').click();
      input('thirdPanel').should('be.visible');

      input('show').clear();
      panel('thirdPanel').should('not.exist');
      tab('thirdPanel').should('have.attr', 'aria-selected', 'true');
      panel('firstPanel').should('have.attr', 'hidden');
      panel('secondPanel').should('have.attr', 'hidden');

      // The tab is still the active one, so its panel shows as soon as the child is shown again.
      input('show').type('yes');
      input('thirdPanel').should('be.visible');
      tab('thirdPanel').should('have.attr', 'aria-selected', 'true');
    });

    it('opens the first tab again when the hidden tabs layout is shown again', () => {
      mountFn({
        data: { show: 'yes' },
        formDef: getFormDefinition({ tabsInclude: { when: '$form.show === "yes"' } }),
      });

      tab('secondPanel').click();
      input('secondPanel').type('Bob');
      tab('secondPanel').should('have.attr', 'aria-selected', 'true');

      input('show').clear();
      tab('firstPanel').should('not.exist');

      input('show').type('yes');
      // The layout mounts again, so it starts from its first tab. The store keeps the value.
      tab('firstPanel').should('have.attr', 'aria-selected', 'true');
      tab('secondPanel').should('have.attr', 'aria-selected', 'false');
      panel('firstPanel').should('not.have.attr', 'hidden');
      panel('secondPanel').should('have.attr', 'hidden');
      input('secondPanel').should('have.value', 'Bob');
    });
  });
};
