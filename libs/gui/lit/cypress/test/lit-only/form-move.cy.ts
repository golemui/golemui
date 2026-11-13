import { defineForm } from '@golemui/core';
import { afterTwoFrames, eventsNamed, TEST_FORM_NAME, testDomId } from '@golemui/ui-testing';
import { mountFramework } from '../../support/mount';

// Lit-local: a DOM move disconnects and connects every custom element of the form again, and
// only the Lit widgets subscribe and unsubscribe in those callbacks.
const formDef = defineForm({
  form: [
    { uid: 'name', kind: 'input', type: 'textinput', path: 'name', on: { load: 'nameLoaded' } },
    { uid: 'submit', kind: 'action', type: 'button', label: 'Submit', actionType: 'submit' },
  ],
});

/** Moves the form into a new element and back to its first parent. */
const moveFormTwice = () => {
  const form = document.querySelector('gui-form');
  const firstParent = form?.parentElement;
  if (!form || !firstParent) {
    throw new Error('The form is not mounted');
  }
  const otherParent = document.createElement('div');
  document.body.appendChild(otherParent);
  otherParent.appendChild(form);
  firstParent.appendChild(form);
  otherParent.remove();
};

const TABS_UID = 'movedTabs';
const ACCORDION_UID = 'movedAccordion';

// The user changes the selection away from `defaultOpen`, so a reset to `defaultOpen` is visible.
const layoutFormDef = defineForm({
  form: [
    {
      uid: TABS_UID,
      kind: 'layout',
      type: 'tabs',
      on: { change: 'tabChanged' },
      props: {
        defaultOpen: 'firstTab',
        tabs: [
          { uid: 'firstTab', label: 'First tab' },
          { uid: 'secondTab', label: 'Second tab' },
        ],
      },
      children: [
        { uid: 'firstTab', kind: 'input', type: 'textinput', path: 'firstTab', label: 'First' },
        { uid: 'secondTab', kind: 'input', type: 'textinput', path: 'secondTab', label: 'Second' },
      ],
    },
    {
      uid: ACCORDION_UID,
      kind: 'layout',
      type: 'accordion',
      on: { change: 'sectionsChanged' },
      props: {
        defaultOpen: { firstSection: true },
        sections: [
          { uid: 'firstSection', label: 'First section' },
          { uid: 'secondSection', label: 'Second section' },
        ],
      },
      children: [
        {
          uid: 'firstSection',
          kind: 'input',
          type: 'textinput',
          path: 'firstSection',
          label: 'First',
        },
        {
          uid: 'secondSection',
          kind: 'input',
          type: 'textinput',
          path: 'secondSection',
          label: 'Second',
        },
      ],
    },
  ],
});

const tab = (tabUid: string) => cy.get(`[data-cy="tab_${TABS_UID}_${tabUid}"]`);
const tabPanel = (tabUid: string) => cy.get(`[data-cy="tabpanel_${TABS_UID}_${tabUid}"]`);
const sectionHeader = (sectionUid: string) =>
  cy.get(`summary[id="${testDomId(ACCORDION_UID)}_accordion_button_${sectionUid}"]`);
const sectionDetails = (sectionUid: string) => sectionHeader(sectionUid).parent('details');

/** The details of the form events with this name, in order. */
const eventDetails = (formEvent: sinon.SinonStub, name: string) =>
  eventsNamed(formEvent, name).map((event) => event.detail);

const MANY_TABS_UID = 'manyTabs';
const manyTabUids = [
  'personal',
  'address',
  'billing',
  'shipping',
  'payment',
  'contacts',
  'documents',
  'settings',
];
const lastTabUid = manyTabUids[manyTabUids.length - 1];

// In a narrow viewport these tabs are wider than the tab strip.
const manyTabsFormDef = defineForm({
  form: [
    {
      uid: MANY_TABS_UID,
      kind: 'layout',
      type: 'tabs',
      props: { tabs: manyTabUids.map((uid) => ({ uid, label: `Tab ${uid}` })) },
      children: manyTabUids.map((uid) => ({
        uid,
        kind: 'input' as const,
        type: 'textinput',
        path: uid,
        label: uid,
      })),
    },
  ],
});

const manyTabsTab = (tabUid: string) => cy.get(`[data-cy="tab_${MANY_TABS_UID}_${tabUid}"]`);

/** Fails when a part of the tab is outside the visible part of its tab strip. */
const expectInsideTabStrip = ($tab: JQuery<HTMLElement>) => {
  const strip = $tab[0].closest('gui-tab-list');
  if (!strip) {
    throw new Error('The tab is not inside a tab strip');
  }
  const stripBox = strip.getBoundingClientRect();
  const tabBox = $tab[0].getBoundingClientRect();
  // One pixel for the rounding of fractional positions.
  expect(tabBox.left, 'left side of the tab').to.be.at.least(stripBox.left - 1);
  expect(tabBox.right, 'right side of the tab').to.be.at.most(stripBox.right + 1);
};

describe('a gui-form moved twice in the DOM', () => {
  it('keeps one load event, one update per change and the typed data', () => {
    const formEvent = cy.stub().as('formEvent');
    const formSubmit = cy.stub().as('formSubmit');
    mountFramework({ formDef, formEvent, formSubmit });

    let requestUpdate!: sinon.SinonSpy;
    let updatesBeforeTheMove = 0;
    cy.get('[data-cy="name_textinput"]').type('A');
    cy.get('gui-textinput-input').then(([element]) => {
      requestUpdate = cy.spy(
        element as HTMLElement & { requestUpdate: () => void },
        'requestUpdate',
      );
    });

    cy.get('[data-cy="name_textinput"]').type('d');
    cy.then(afterTwoFrames).then(() => {
      updatesBeforeTheMove = requestUpdate.callCount;
      expect(updatesBeforeTheMove, 'updates for one keystroke').to.be.greaterThan(0);
      requestUpdate.resetHistory();
    });

    cy.then(moveFormTwice);
    cy.then(afterTwoFrames).then(() => requestUpdate.resetHistory());

    // A second view model subscription would update the element twice for each change.
    cy.get('[data-cy="name_textinput"]').type('a');
    cy.then(afterTwoFrames).then(() => {
      expect(requestUpdate.callCount, 'updates for one keystroke').to.equal(updatesBeforeTheMove);
      expect(eventsNamed(formEvent, 'nameLoaded'), 'load events').to.have.length(1);
    });

    cy.get('[data-cy="submit_button"]').click();
    cy.get('@formSubmit').should('have.been.calledOnce');
    cy.get('@formSubmit').should(() => {
      expect(formSubmit.getCall(0).args[0].data).to.deep.equal({ name: 'Ada' });
    });
  });

  it('keeps the tab that the user selected and shows its panel', () => {
    mountFramework({ formDef: layoutFormDef, formName: TEST_FORM_NAME });

    tab('secondTab').click();
    tab('secondTab').should('have.attr', 'aria-selected', 'true');

    cy.then(moveFormTwice);
    cy.then(afterTwoFrames);

    tab('secondTab').should('have.attr', 'aria-selected', 'true');
    tab('firstTab').should('have.attr', 'aria-selected', 'false');
    tabPanel('secondTab').should('not.have.attr', 'hidden');
    tabPanel('firstTab').should('have.attr', 'hidden');
    cy.get('[data-cy="secondTab_textinput"]').should('be.visible');
  });

  it('scrolls an overflowing tab strip to the selected tab', () => {
    cy.viewport(320, 640);
    mountFramework({ formDef: manyTabsFormDef });

    manyTabsTab(lastTabUid).click();
    manyTabsTab(lastTabUid).should('have.attr', 'aria-selected', 'true').and(expectInsideTabStrip);
    cy.get('gui-tab-list').should(([strip]) => {
      expect(strip.scrollWidth, 'width of all tabs').to.be.greaterThan(strip.clientWidth);
    });

    cy.then(moveFormTwice);
    cy.then(afterTwoFrames);

    manyTabsTab(lastTabUid).should('have.attr', 'aria-selected', 'true').and(expectInsideTabStrip);
  });

  it('keeps the accordion sections that the user opened and closed', () => {
    const formEvent = cy.stub().as('formEvent');
    mountFramework({ formDef: layoutFormDef, formEvent, formName: TEST_FORM_NAME });

    sectionHeader('secondSection').click();
    sectionHeader('firstSection').click();
    sectionDetails('secondSection').should('have.attr', 'open');
    sectionDetails('firstSection').should('not.have.attr', 'open');
    // The browser sets `open` at the click, but the widget records the click later, in the
    // `toggle` event. A move before that event would lose the click.
    cy.get('@formEvent').should(() => {
      expect(eventDetails(formEvent, 'sectionsChanged'), 'section changes').to.deep.equal([
        { firstSection: true, secondSection: true },
        { firstSection: false, secondSection: true },
      ]);
    });

    cy.then(moveFormTwice);
    cy.then(afterTwoFrames);

    sectionDetails('secondSection').should('have.attr', 'open');
    sectionDetails('firstSection').should('not.have.attr', 'open');
  });

  it('sends one change for one click on a tab or on a section', () => {
    const formEvent = cy.stub().as('formEvent');
    mountFramework({ formDef: layoutFormDef, formEvent, formName: TEST_FORM_NAME });

    tab('secondTab').click();
    sectionHeader('secondSection').click();
    // The events of these clicks must arrive before the move, or the count after the move has
    // them too.
    cy.get('@formEvent').should(() => {
      expect(eventDetails(formEvent, 'tabChanged'), 'tab changes').to.deep.equal(['secondTab']);
      expect(eventDetails(formEvent, 'sectionsChanged'), 'section changes').to.deep.equal([
        { firstSection: true, secondSection: true },
      ]);
    });

    cy.then(moveFormTwice);
    cy.then(afterTwoFrames).then(() => formEvent.resetHistory());

    tab('firstTab').click();
    tab('firstTab').should('have.attr', 'aria-selected', 'true');
    sectionHeader('firstSection').click();
    sectionDetails('firstSection').should('not.have.attr', 'open');

    cy.then(afterTwoFrames).then(() => {
      expect(eventDetails(formEvent, 'tabChanged'), 'tab changes').to.deep.equal(['firstTab']);
      expect(eventDetails(formEvent, 'sectionsChanged'), 'section changes').to.deep.equal([
        { firstSection: false, secondSection: true },
      ]);
    });
  });
});
