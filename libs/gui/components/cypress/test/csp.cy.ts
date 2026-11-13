import { html } from 'lit';
import { toast } from '../../src/lib/components/toast';
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

  it('allows a gui-toaster to show, move into a modal and close its toasts', () => {
    cy.mount(
      html`<gui-dialog>
          <dialog id="csp-dialog" aria-label="Edit"><p>Edit</p></dialog>
        </gui-dialog>
        <gui-toaster></gui-toaster>`,
    );
    cy.then(() => toast({ message: 'Saved', variant: 'success' }));
    cy.get('.gui-toast').should('exist');
    cy.get('gui-dialog').invoke('prop', 'open', true);
    cy.get('#csp-dialog > .gui-toaster__region').should('exist');
    cy.get('.gui-toast__close').click();
    cy.get('.gui-toast').should('not.exist');
    expectNoViolations();
  });

  it('allows a gui-slider and a gui-range-slider to render, move and show their bubbles', () => {
    cy.mount(
      html`<gui-slider label="Volume" marks value-placement="both"></gui-slider>
        <gui-range-slider
          label="Price"
          .value=${{ start: 20, end: 60 }}
          .marks=${[{ value: 0, label: 'Free' }, 100]}
          value-placement="both"
        ></gui-range-slider>`,
    );
    cy.get('gui-slider input').then(([input]) => {
      (input as HTMLInputElement).value = '40';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    cy.get('gui-slider .gui-slider__value').should('have.text', '40');
    cy.get('gui-range-slider input').first().focus();
    expectNoViolations();
  });

  it('allows a gui-otp to render, take a code and show its caret', () => {
    cy.mount(html`<gui-otp label="Code" groups="3,3"></gui-otp>`);
    cy.get('gui-otp input').type('123');
    cy.get('gui-otp .gui-otp__box--filled').should('have.length', 3);
    expectNoViolations();
  });

  it('allows a gui-checkbox-group and a gui-rating to render, take a value and preview', () => {
    cy.mount(
      html`<gui-checkbox-group label="Colors" .options=${options}></gui-checkbox-group>
        <gui-rating label="Service"></gui-rating>`,
    );
    cy.get('gui-checkbox-group input').first().check();
    cy.get('gui-rating label').eq(3).click();
    cy.get('gui-rating .gui-rating__star--filled').should('have.length', 4);
    expectNoViolations();
  });

  it('allows a gui-badge, a gui-progress and a gui-spinner to render and update', () => {
    cy.mount(
      html`<gui-badge variant="success">Paid</gui-badge>
        <gui-progress label="Uploading" value="40" show-value></gui-progress>
        <gui-progress label="Waiting"></gui-progress>
        <gui-spinner label="Loading results"></gui-spinner>`,
    );
    cy.get('gui-progress').first().invoke('prop', 'value', 80);
    cy.get('gui-progress .gui-progress__value').should('have.text', '80%');
    cy.get('gui-spinner').invoke('prop', 'label', 'Still loading');
    cy.get('gui-spinner [role="status"]').should('have.text', 'Still loading');
    expectNoViolations();
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

    it(`allows a gui-tooltip to describe, open and close${fallback ? ', measuring' : ''}`, () => {
      GUIAnchorController.forceFallback = fallback;
      cy.mount(
        html`<button type="button" id="save">Save</button>
          <gui-tooltip for="save">Saves without publishing</gui-tooltip>`,
      );

      cy.get('gui-tooltip').invoke('prop', 'open', true);
      cy.get('gui-tooltip').should('match', ':popover-open');
      cy.get('gui-tooltip').invoke('prop', 'open', false);
      cy.get('gui-tooltip').should('not.match', ':popover-open');
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
