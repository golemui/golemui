import { html } from 'lit';
import type { GuiProgress } from '../../src/lib/components/progress';
import { checkA11y } from '../support/a11y';

const element = () => cy.get<GuiProgress>('gui-progress');
const bar = () => cy.get<HTMLProgressElement>('gui-progress progress');
const shownValue = () => cy.get('gui-progress .gui-progress__value');

describe('gui-progress', () => {
  it('renders a native progress bar named by its label', () => {
    cy.mount(html`<gui-progress uid="upload" label="Uploading" value="40"></gui-progress>`);

    bar()
      .should('have.attr', 'id', 'upload')
      .and('have.attr', 'value', '40')
      .and('have.attr', 'max', '100');
    bar().should(([progress]) => {
      expect(progress.labels?.[0]?.textContent).to.contain('Uploading');
      expect(progress.position).to.equal(0.4);
    });
    shownValue().should('not.exist');
  });

  it('is indeterminate without a value, and determinate once it has one', () => {
    cy.mount(html`<gui-progress label="Waiting"></gui-progress>`);

    bar().should('match', ':indeterminate').and('not.have.attr', 'value');
    bar().should(([progress]) =>
      expect(getComputedStyle(progress).animationName).to.equal('gui-progress-indeterminate'),
    );
    element().invoke('prop', 'value', 25);
    bar().should('not.match', ':indeterminate').and('have.attr', 'value', '25');
    // jQuery's prop() reads with an undefined value: set it directly.
    element().then(([progress]) => {
      progress.value = undefined;
    });
    bar().should('match', ':indeterminate');
  });

  it('keeps its value within 0 and max', () => {
    cy.mount(
      html`<gui-progress label="Uploading" max="50" .value=${80} show-value></gui-progress>`,
    );

    bar().should('have.attr', 'value', '50').and('have.attr', 'max', '50');
    shownValue().should('have.text', '100%');
    element().invoke('prop', 'value', -5);
    bar().should('have.attr', 'value', '0');
    shownValue().should('have.text', '0%');
  });

  it('takes 100 for a max that is not a positive number', () => {
    cy.mount(html`<gui-progress label="Uploading" value="30" .max=${0}></gui-progress>`);

    bar().should('have.attr', 'max', '100');
  });

  it('shows the percentage with show-value, hidden from assistive technology', () => {
    cy.mount(
      html`<gui-progress
        label="Uploading"
        value="1"
        max="3"
        show-value
        locale-id="en-US"
      ></gui-progress>`,
    );

    shownValue().should('have.text', '33%').and('have.attr', 'aria-hidden', 'true');
  });

  it('formats the percentage for its locale', () => {
    cy.mount(
      html`<gui-progress label="Subiendo" value="40" show-value locale-id="es"></gui-progress>`,
    );

    shownValue().should(([value]) =>
      expect(value.textContent?.replace(/\s/g, ' ')).to.equal('40 %'),
    );
  });

  it('keeps a left-to-right percentage in order in a right-to-left page', () => {
    cy.mount(
      html`<div dir="rtl">
        <gui-progress label="Subiendo" value="65" show-value locale-id="es"></gui-progress>
      </div>`,
    );

    shownValue().should(([value]) => {
      const text = [...value.childNodes].find((node) => node.textContent?.includes('%'))!;
      const left = (index: number) => {
        const range = document.createRange();
        range.setStart(text, index);
        range.setEnd(text, index + 1);
        return range.getBoundingClientRect().left;
      };
      const content = text.textContent ?? '';
      expect(left(content.indexOf('6')), 'digits before the sign').to.be.lessThan(
        left(content.indexOf('%')),
      );
    });
  });

  it('runs its indeterminate band the other way in right to left', () => {
    cy.mount(html`<div dir="rtl"><gui-progress label="Waiting"></gui-progress></div>`);

    bar().should(([progress]) =>
      expect(getComputedStyle(progress).animationDirection).to.equal('reverse'),
    );
  });

  it('has no accessibility violations, determinate or not', () => {
    cy.mount(
      html`<div>
        <gui-progress label="Uploading" value="40" show-value></gui-progress>
        <gui-progress label="Waiting"></gui-progress>
      </div>`,
    );

    checkA11y('div');
  });
});
