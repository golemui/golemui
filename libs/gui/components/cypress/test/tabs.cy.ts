import { html } from 'lit';
import { checkA11y } from '../support/a11y';

const tab = (panel: string) => cy.get(`gui-tab[panel="${panel}"]`);
const panel = (name: string) => cy.get(`gui-tab-panel[name="${name}"]`);

const profile = (active?: string) =>
  html`<gui-tabs .active=${active}>
    <gui-tab-list aria-label="Profile">
      <gui-tab panel="personal">Personal</gui-tab>
      <gui-tab panel="address">Address</gui-tab>
      <gui-tab panel="billing">Billing</gui-tab>
    </gui-tab-list>
    <gui-tab-panel name="personal">Personal details</gui-tab-panel>
    <gui-tab-panel name="address">Address details</gui-tab-panel>
    <gui-tab-panel name="billing">Billing details</gui-tab-panel>
  </gui-tabs>`;

describe('gui-tabs', () => {
  describe('rendering', () => {
    it('links each tab to its panel, and selects the first tab by default', () => {
      cy.mount(profile());

      cy.get('gui-tab-list').should('have.attr', 'role', 'tablist');
      tab('personal')
        .should('have.attr', 'role', 'tab')
        .and('have.attr', 'aria-selected', 'true')
        .and('have.attr', 'tabindex', '0');
      tab('address').should('have.attr', 'aria-selected', 'false');
      tab('address').should('have.attr', 'tabindex', '-1');
      tab('address')
        .invoke('attr', 'aria-controls')
        .then((id) => cy.get(`#${id}`).should('have.attr', 'name', 'address'));
      panel('address')
        .should('have.attr', 'role', 'tabpanel')
        .and('have.attr', 'tabindex', '0')
        .and('have.attr', 'hidden');
      panel('address')
        .invoke('attr', 'aria-labelledby')
        .then((id) => cy.get(`#${id}`).should('have.attr', 'panel', 'address'));
      panel('personal').should('not.have.attr', 'hidden');
    });

    it('keeps the ids the app gives its parts', () => {
      cy.mount(
        html`<gui-tabs>
          <gui-tab-list><gui-tab panel="a" id="tab-a">A</gui-tab></gui-tab-list>
          <gui-tab-panel name="a" id="panel-a">Panel A</gui-tab-panel>
        </gui-tabs>`,
      );

      cy.get('#tab-a').should('have.attr', 'aria-controls', 'panel-a');
      cy.get('#panel-a').should('have.attr', 'aria-labelledby', 'tab-a');
    });

    it('selects the tab named by active, or the first one when no tab has it', () => {
      cy.mount(profile('address'));

      tab('address').should('have.attr', 'aria-selected', 'true');
      panel('address').should('not.have.attr', 'hidden');
      panel('personal').should('have.attr', 'hidden');

      cy.get('gui-tabs').invoke('prop', 'active', 'unknown');
      tab('personal').should('have.attr', 'aria-selected', 'true');
    });

    it('links a panel the app renders later, such as one rendered only while active', () => {
      cy.mount(
        html`<gui-tabs>
          <gui-tab-list>
            <gui-tab panel="a">A</gui-tab>
            <gui-tab panel="b">B</gui-tab>
          </gui-tab-list>
          <gui-tab-panel name="a">Panel A</gui-tab-panel>
        </gui-tabs>`,
      );

      tab('b').should('not.have.attr', 'aria-controls');
      cy.get('gui-tabs').then(([tabs]) => {
        const late = document.createElement('gui-tab-panel');
        late.setAttribute('name', 'b');
        tabs.append(late);
      });

      panel('b').should('have.attr', 'hidden');
      panel('b')
        .invoke('attr', 'id')
        .then((id) => tab('b').should('have.attr', 'aria-controls', id));
    });

    it('has no accessibility violations', () => {
      cy.mount(profile());

      checkA11y('gui-tabs');
    });
  });

  describe('selection', () => {
    it('selects a tab on click and fires gui-tab-change', () => {
      const onChange = cy.spy().as('change');
      cy.mount(html`<div @gui-tab-change=${onChange}>${profile()}</div>`);

      tab('billing').click();

      tab('billing').should('have.attr', 'aria-selected', 'true');
      panel('billing').should('not.have.attr', 'hidden');
      cy.get('@change').its('lastCall.args.0.detail').should('deep.equal', { value: 'billing' });
    });

    it('keeps the current tab when gui-tab-change is cancelled', () => {
      cy.mount(profile());
      cy.get('gui-tabs').then(([tabs]) =>
        tabs.addEventListener('gui-tab-change', (event) => event.preventDefault()),
      );

      tab('address').click();

      tab('personal').should('have.attr', 'aria-selected', 'true');
      panel('address').should('have.attr', 'hidden');
    });

    it('moves and selects with the arrow keys, Home and End', () => {
      const onChange = cy.spy().as('change');
      cy.mount(html`<div @gui-tab-change=${onChange}>${profile()}</div>`);

      tab('personal').focus().trigger('keydown', { key: 'ArrowRight' });
      cy.focused().should('have.attr', 'panel', 'address');
      tab('address').should('have.attr', 'aria-selected', 'true');
      cy.get('@change').its('lastCall.args.0.detail.value').should('equal', 'address');

      cy.focused().trigger('keydown', { key: 'End' });
      cy.focused().should('have.attr', 'panel', 'billing');
      cy.focused().trigger('keydown', { key: 'ArrowRight' });
      cy.focused().should('have.attr', 'panel', 'billing');

      cy.focused().trigger('keydown', { key: 'Home' });
      cy.focused().should('have.attr', 'panel', 'personal');
      cy.focused().trigger('keydown', { key: 'ArrowLeft' });
      cy.focused().should('have.attr', 'panel', 'personal');
      tab('personal').should('have.attr', 'aria-selected', 'true');
    });

    it('reverses the arrow keys right to left', () => {
      cy.mount(html`<div dir="rtl">${profile()}</div>`);

      tab('personal').focus().trigger('keydown', { key: 'ArrowLeft' });

      cy.focused().should('have.attr', 'panel', 'address');
    });

    it('leaves the tabs nested in a panel to their own tab set', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-tabs id="outer" @gui-tab-change=${onChange}>
          <gui-tab-list><gui-tab panel="a">A</gui-tab></gui-tab-list>
          <gui-tab-panel name="a">
            <gui-tabs id="inner">
              <gui-tab-list>
                <gui-tab panel="x">X</gui-tab>
                <gui-tab panel="y">Y</gui-tab>
              </gui-tab-list>
              <gui-tab-panel name="x">Panel X</gui-tab-panel>
              <gui-tab-panel name="y">Panel Y</gui-tab-panel>
            </gui-tabs>
          </gui-tab-panel>
        </gui-tabs>`,
      );

      tab('y').click();

      tab('y').should('have.attr', 'aria-selected', 'true');
      tab('a').should('have.attr', 'aria-selected', 'true');
      panel('a').should('not.have.attr', 'hidden');
      cy.get('#outer').should('not.have.prop', 'active', 'y');
      cy.get('@change').its('lastCall.args.0.target').should('have.attr', 'id', 'inner');
    });
  });

  describe('scrolling', () => {
    it('marks the sides of the strip with tabs out of view', () => {
      cy.mount(html`<div style="width: 200px">${profile()}</div>`);

      cy.get('gui-tabs').should('have.attr', 'overflow-end');
      cy.get('gui-tabs').should('not.have.attr', 'overflow-start');

      cy.get('gui-tab-list').scrollTo('right');

      cy.get('gui-tabs').should('have.attr', 'overflow-start');
      cy.get('gui-tabs').should('not.have.attr', 'overflow-end');
    });

    it('scrolls the strip to the selected tab', () => {
      cy.mount(html`<div style="width: 200px">${profile('billing')}</div>`);

      cy.get('gui-tab-list').invoke('scrollLeft').should('be.greaterThan', 0);
    });
  });
});
