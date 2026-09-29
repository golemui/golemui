import { mount } from 'cypress-ct-lit';
// Components on their own: the elements and their stylesheet, without GolemUI Forms.
import '../../src/index';
import '../../src/styles/index.scss';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Chainable<Subject> {
      mount: typeof mount;
    }
  }
}

Cypress.Commands.add('mount', mount);
