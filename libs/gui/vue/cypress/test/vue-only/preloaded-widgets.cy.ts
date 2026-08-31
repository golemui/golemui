import { defineForm, preloadFormWidgets } from '@golemui/core';
import type { GuiFormInitConfig } from '@golemui/gui-shared';
import { defineComponent, h, Suspense, type Component } from 'vue';
import GuiForm from '../../../src/lib/components/Form';
import { widgetLoaders } from '../../../src/lib/widget.loaders';

/**
 * Vue only: Nuxt renders every page inside `<Suspense>`, and with the widgets preloaded (the
 * server rendering setup) the form is part of the suspended subtree. Suspense mounts that subtree
 * off document and moves it in once it resolves, so a `gui-*` element connects — and runs the
 * first update that reports its items and range — before the post-render effects that set
 * template refs. A listener attached from a ref watcher misses those reports; the list widgets
 * bind them in their templates. Not in the shared suite because the shared mount contract has no
 * Suspense boundary.
 */
const ITEMS = ['React', 'Angular', 'Vue', 'Lit'];

type ListWidgetType = 'dropdown' | 'multiDropdown' | 'list' | 'multiList';

const mountSuspendedForm = (type: ListWidgetType) => {
  const config: GuiFormInitConfig = {
    // Eager validation re-emits the view model right after mount, which hands the element its
    // items a second time and would hide a missed first report.
    validateOn: 'submit',
    formDef: defineForm({
      form: [{ uid: 'testSubject', kind: 'input', type, path: 'myField', props: { items: ITEMS } }],
    }),
  };
  const Page = defineComponent({
    name: 'SuspendedPage',
    async setup() {
      // A pending branch, resolved and moved into the document the way a Nuxt page is.
      await Promise.resolve();
      return () => h(GuiForm as Component, { config });
    },
  });

  cy.mount(() => h(Suspense, null, { default: () => h(Page) }));
  // A preloaded widget is rendered by the time the page resolves. A lazily loaded one would only
  // appear after its dynamic import, and would not exercise the timing this file is about.
  cy.then(() => {
    expect(Cypress.$('gui-list, gui-multi-list').length, 'widget rendered on resolve').to.eq(1);
  });
};

const rows = (listTag: 'gui-list' | 'gui-multi-list') =>
  cy.get(`${listTag}:not([hidden]) .gui-list__item-wrapper`).filter(':visible');

describe('widgets preloaded before a suspended first render', () => {
  before(async () => {
    await preloadFormWidgets({ widgetLoaders });
  });

  it('dropdown lists its items when opened', () => {
    mountSuspendedForm('dropdown');
    cy.get('[data-cy="testSubject_textinput"]').click();
    rows('gui-list').should('have.length', ITEMS.length);
  });

  it('multiDropdown lists its items when opened', () => {
    mountSuspendedForm('multiDropdown');
    cy.get('[data-cy="testSubject_textinput"]').click();
    rows('gui-multi-list').should('have.length', ITEMS.length);
  });

  it('list renders its items', () => {
    mountSuspendedForm('list');
    rows('gui-list').should('have.length', ITEMS.length);
  });

  it('multiList renders its items', () => {
    mountSuspendedForm('multiList');
    rows('gui-multi-list').should('have.length', ITEMS.length);
  });
});
