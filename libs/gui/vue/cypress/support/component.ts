import { mount } from 'cypress/vue';
import { memoryCleaner } from '@golemui/ui-testing';
import './commands';

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

afterEach(() => {
  memoryCleaner();
});
