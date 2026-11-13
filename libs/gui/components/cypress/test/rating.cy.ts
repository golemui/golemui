import { html } from 'lit';
import type { GuiRating } from '../../src/lib/components/rating';
import { configureMessages } from '../../src/lib/utils/messages';
import { checkA11y } from '../support/a11y';
import { realHover, realPress, takesRealInput } from '../support/real-input';

const element = () => cy.get<GuiRating>('gui-rating');
const star = (count: number) =>
  cy.get<HTMLInputElement>(`gui-rating [data-cy$="_rating_${count}"]`);
const filled = () => cy.get('gui-rating .gui-rating__star--filled');
const valueOf = (expected: number | undefined) =>
  element().should(([host]) => expect(host.value).to.equal(expected));

/** Clicks a star as the pointer does: on the star the user sees, which is its radio's label. */
const clickStar = (count: number) => star(count).then(([input]) => input.labels?.[0]?.click());

const service = () =>
  html`<gui-rating uid="service" label="Service" locale-id="en-US"></gui-rating>`;

describe('gui-rating', () => {
  afterEach(() => configureMessages(null));

  describe('rendering', () => {
    it('renders a radio group of stars named by its label, each named by its number', () => {
      cy.mount(service());

      cy.get('gui-rating [role="radiogroup"]').should(
        'have.attr',
        'aria-labelledby',
        'service_label',
      );
      cy.get('gui-rating input[type="radio"]').should('have.length', 5);
      star(1).should('have.attr', 'aria-label', '1 star');
      star(4).should('have.attr', 'aria-label', '4 stars');
      cy.get('gui-rating svg').should('have.length', 5).and('have.attr', 'aria-hidden', 'true');
    });

    it('has no value until one is picked: no star is checked, and the first takes Tab', () => {
      cy.mount(service());

      valueOf(undefined);
      cy.get('gui-rating input:checked').should('not.exist');
      star(1).should('have.attr', 'tabindex', '0');
      star(2).should('have.attr', 'tabindex', '-1');
      filled().should('not.exist');
    });

    it('shows its value: the stars up to it are filled, and the picked one takes Tab', () => {
      cy.mount(html`<gui-rating label="Service" .value=${3}></gui-rating>`);

      star(3).should('be.checked').and('have.attr', 'tabindex', '0');
      star(1).should('have.attr', 'tabindex', '-1');
      filled().should('have.length', 3);
    });

    it('draws max stars, and 5 for a max that is not a whole number above 0', () => {
      cy.mount(html`<gui-rating label="Service" max="10"></gui-rating>`);

      cy.get('gui-rating input').should('have.length', 10);
      element().invoke('prop', 'max', 0);
      cy.get('gui-rating input').should('have.length', 5);
      element().invoke('prop', 'max', 2.5);
      cy.get('gui-rating input').should('have.length', 5);
    });

    it('runs from right to left in a right-to-left page', () => {
      cy.mount(html`<div dir="rtl">${service()}</div>`);

      star(1).then(([first]) =>
        star(2).should(([second]) =>
          expect(second.closest('label')!.getBoundingClientRect().left).to.be.lessThan(
            first.closest('label')!.getBoundingClientRect().left,
          ),
        ),
      );
    });

    it('translates the names of its stars', () => {
      configureMessages((key, defaultText, params) =>
        key === 'ratingStars' ? `${params?.['count']} estrellas` : defaultText,
      );
      cy.mount(service());

      star(2).should('have.attr', 'aria-label', '2 estrellas');
    });
  });

  describe('picking', () => {
    it('picks the clicked star, and fires gui-input and gui-change', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(html`<div @gui-input=${onInput} @gui-change=${onChange}>${service()}</div>`);

      clickStar(4);
      valueOf(4);
      filled().should('have.length', 4);
      cy.get('@input').its('lastCall.args.0.detail.value').should('equal', 4);
      cy.get('@change').its('lastCall.args.0.detail.value').should('equal', 4);
    });

    it('clears with a click on the picked star', () => {
      const onChange = cy.spy().as('change');
      cy.mount(html`<div @gui-change=${onChange}>${service()}</div>`);

      clickStar(2);
      clickStar(2);
      valueOf(undefined);
      star(2).should('not.be.checked');
      filled().should('not.exist');
      // its() can't read a property that is undefined: read the call itself.
      cy.get<sinon.SinonSpy>('@change').should((spy) =>
        expect(spy.lastCall.args[0].detail.value).to.equal(undefined),
      );
    });

    it('clears with Delete and Backspace', () => {
      cy.mount(html`<gui-rating label="Service" .value=${3}></gui-rating>`);

      star(3).focus().trigger('keydown', { key: 'Delete', force: true });
      valueOf(undefined);
      element().invoke('prop', 'value', 2);
      star(2).focus().trigger('keydown', { key: 'Backspace', force: true });
      valueOf(undefined);
    });

    it('clears when required too, and then reports the missing value', () => {
      cy.mount(
        html`<form>
          <gui-rating name="service" label="Service" required .value=${3}></gui-rating>
        </form>`,
      );

      element().should(([host]) => expect(host.checkValidity()).to.equal(true));
      clickStar(3);
      valueOf(undefined);
      element().should(([host]) => expect(host.validity?.valueMissing).to.equal(true));
      clickStar(2);
      star(2).focus().trigger('keydown', { key: 'Delete', force: true });
      valueOf(undefined);
    });

    it('keeps the picked star on Space, as a radio does', () => {
      cy.mount(html`<gui-rating label="Service" .value=${3}></gui-rating>`);

      // Space checks the focused radio through a click.
      star(3).focus().trigger('keydown', { key: ' ', force: true });
      star(3).then(([input]) => input.click());
      valueOf(3);
    });

    if (takesRealInput()) {
      it('picks with the arrow keys, and clears with Delete', () => {
        cy.mount(html`<gui-rating label="Service" .value=${2}></gui-rating>`);

        star(2).focus();
        realPress('ArrowRight');
        valueOf(3);
        realPress('ArrowLeft');
        realPress('ArrowLeft');
        valueOf(1);
        realPress('Space');
        valueOf(1);
        realPress('Delete');
        valueOf(undefined);
      });

      it('previews the rating under the pointer, and shows its value once it leaves', () => {
        cy.mount(html`<gui-rating label="Service" .value=${1}></gui-rating>`);

        star(4).then(([input]) => {
          const box = input.closest('label')!.getBoundingClientRect();
          realHover(box.left + box.width / 2, box.top + box.height / 2);
        });
        cy.get('gui-rating .gui-rating__star').should((stars) => {
          const fills = [...stars].map(
            (label) => getComputedStyle(label.querySelector('polygon')!).fill,
          );
          expect(fills[3], 'the hovered star').to.equal(fills[0]);
          expect(fills[4], 'the star after it').to.not.equal(fills[0]);
        });
        realHover(0, 0);
        cy.get('gui-rating .gui-rating__star').should((stars) => {
          const fills = [...stars].map(
            (label) => getComputedStyle(label.querySelector('polygon')!).fill,
          );
          expect(fills[1], 'past the value').to.not.equal(fills[0]);
        });
      });
    }
  });

  describe('states', () => {
    it('stays as it is when read-only, and says so on the group', () => {
      cy.mount(html`<gui-rating label="Service" readonly .value=${2}></gui-rating>`);

      cy.get('gui-rating [role="radiogroup"]').should('have.attr', 'aria-readonly', 'true');
      clickStar(4);
      clickStar(2);
      star(2).focus().trigger('keydown', { key: 'Delete', force: true });
      valueOf(2);
      star(2).should('be.checked');
    });

    it('disables every star', () => {
      cy.mount(html`<gui-rating label="Service" disabled></gui-rating>`);

      cy.get('gui-rating input').should('have.length', 5).and('be.disabled');
    });

    it('reports a value set from code off the scale, and fills what it can', () => {
      cy.mount(
        html`<form><gui-rating name="service" label="Service" .value=${7}></gui-rating></form>`,
      );

      element().should(([host]) => expect(host.validity?.rangeOverflow).to.equal(true));
      filled().should('have.length', 5);
      cy.get('gui-rating input:checked').should('not.exist');
      star(1).should('have.attr', 'tabindex', '0');

      element().invoke('prop', 'value', 0);
      element().should(([host]) => expect(host.validity?.rangeUnderflow).to.equal(true));
      element().invoke('prop', 'value', 3.5);
      element().should(([host]) => {
        expect(host.validity?.stepMismatch).to.equal(true);
        expect(host.validationMessage).to.equal('Choose a valid value. The nearest is 4.');
      });
      filled().should('have.length', 3);
    });
  });

  describe('form', () => {
    it('submits its value under its name, and blocks an empty required rating', () => {
      cy.mount(
        html`<form>
          <gui-rating name="service" label="Service" required></gui-rating>
        </form>`,
      );

      element().should(([host]) => expect(host.validity?.valueMissing).to.equal(true));
      clickStar(4);
      cy.get('form').should(([form]) => {
        const data = new FormData(form as HTMLFormElement);
        expect([...data.entries()]).to.deep.equal([['service', '4']]);
        expect((form as HTMLFormElement).checkValidity()).to.equal(true);
      });
    });
  });

  it('has no accessibility violations, empty or picked', () => {
    cy.mount(
      html`<div>
        <gui-rating label="Service" hint="How was it?" required></gui-rating>
        <gui-rating label="Food" .value=${4}></gui-rating>
      </div>`,
    );

    checkA11y('div');
  });
});
