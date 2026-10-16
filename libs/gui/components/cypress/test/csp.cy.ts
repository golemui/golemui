import { html } from 'lit';
import { GUIAnchorController } from '../../src/lib/controllers/anchor.controller';
import { options } from '../support/elements';

// A strict Content Security Policy blocks `style` attributes (`style-src-attr`), but not styles set
// through the CSSOM. The elements must style themselves through the CSSOM only. This spec turns on
// a policy that blocks every style attribute and fails on any violation. It blocks nothing else:
// the test runner injects stylesheets and scripts of its own.

const violations: SecurityPolicyViolationEvent[] = [];
const record = (event: SecurityPolicyViolationEvent) => violations.push(event);

const expectNoViolations = () =>
  cy.wrap(violations).should((list) => {
    expect(
      list.map((event) => `${event.violatedDirective}: ${event.sample || event.blockedURI}`),
    ).to.deep.equal([]);
  });

describe('a strict style-src-attr policy', () => {
  before(() => {
    cy.document().then((document) => {
      const policy = document.createElement('meta');
      policy.httpEquiv = 'Content-Security-Policy';
      policy.content = "style-src-attr 'none'";
      document.head.append(policy);
      document.addEventListener('securitypolicyviolation', record);
    });
  });

  beforeEach(() => {
    violations.length = 0;
  });

  after(() => {
    cy.document().then((document) => {
      document.removeEventListener('securitypolicyviolation', record);
    });
  });

  it('is enforced: a style attribute is reported', () => {
    cy.mount(html`<p>Styled</p>`);
    cy.get('p').then(([paragraph]) => paragraph.setAttribute('style', 'color: red'));
    cy.wrap(violations).should('have.length.at.least', 1);
  });

  for (const fallback of [false, true]) {
    it(`allows a gui-popover to open, follow its anchor and close${fallback ? ', measuring' : ''}`, () => {
      GUIAnchorController.forceFallback = fallback;
      cy.mount(
        html`<div>
          <button type="button" popovertarget="tips">Tips</button>
          <gui-popover placement="top"><div id="tips" popover>Press / to search</div></gui-popover>
        </div>`,
      );

      cy.get('button[popovertarget="tips"]').click();
      cy.get('#tips').should('match', ':popover-open');
      cy.window().then((win) => win.dispatchEvent(new Event('resize')));
      cy.get('gui-popover').invoke('attr', 'placement', 'bottom-end');
      cy.get('gui-popover').invoke('prop', 'open', false);
      cy.get('#tips').should('not.match', ':popover-open');
      expectNoViolations();
      cy.then(() => {
        GUIAnchorController.forceFallback = false;
      });
    });

    it(`allows a dropdown's panel to float in the top layer${fallback ? ', measuring' : ''}`, () => {
      GUIAnchorController.forceFallback = fallback;
      cy.mount(html`<gui-dropdown label="Plan" .items=${options}></gui-dropdown>`);

      cy.get('gui-dropdown .gui-dropdown__arrow').click();
      cy.get('gui-dropdown .gui-picker__panel').should('match', ':popover-open');
      cy.get('gui-dropdown .gui-dropdown__arrow').click();
      cy.get('gui-dropdown .gui-picker__panel').should('not.match', ':popover-open');
      expectNoViolations();
      cy.then(() => {
        GUIAnchorController.forceFallback = false;
      });
    });
  }
});
