import { defineForm } from '@golemui/core';
import { afterTwoFrames, eventsNamed } from '@golemui/ui-testing';
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
});
