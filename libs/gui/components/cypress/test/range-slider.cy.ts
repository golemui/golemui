import { html } from 'lit';
import type { GuiRangeSlider } from '../../src/lib/components/range-slider';
import { configureMessages } from '../../src/lib/utils/messages';
import { realMouseDown, realMouseUp, realPress, takesRealInput } from '../support/real-input';

const element = () => cy.get<GuiRangeSlider>('gui-range-slider');
const thumb = (which: 'start' | 'end') =>
  cy.get<HTMLInputElement>(`gui-range-slider [data-cy$="_slider_${which}"]`);
const labelValue = () => cy.get('gui-range-slider .gui-slider__value');
const valueOf = (expected: unknown) =>
  element().should(([host]) => expect(host.value).to.deep.equal(expected));

/** Moves a thumb the way the browser reports a drag. */
const drag = (which: 'start' | 'end', value: number) =>
  thumb(which).then(([range]) => {
    range.value = String(value);
    range.dispatchEvent(new Event('input', { bubbles: true }));
  });

/** Presses the track at a fraction of the rail's width, from its left edge. */
const pressTrack = (fraction: number) =>
  cy.get('gui-range-slider .gui-slider__control').then(([control]) => {
    const rail = control.querySelector('.gui-slider__rail')!.getBoundingClientRect();
    const clientX = rail.left + rail.width * fraction;
    const clientY = rail.top + rail.height / 2;
    control.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, button: 0, clientX, clientY }),
    );
  });

const price = () =>
  html`<gui-range-slider
    label="Price"
    maximum="500"
    step="10"
    .format=${{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }}
  ></gui-range-slider>`;

describe('gui-range-slider', () => {
  afterEach(() => configureMessages(null));

  describe('rendering', () => {
    it('has no value until a thumb moves: the thumbs rest at the ends', () => {
      cy.mount(price());

      thumb('start').should('have.value', '0').and('have.attr', 'aria-valuetext', 'Not set');
      thumb('end').should('have.value', '500').and('have.attr', 'aria-valuetext', 'Not set');
      labelValue().should('have.text', '–');
      valueOf(undefined);
    });

    it('names each thumb after the label, as the minimum and the maximum', () => {
      cy.mount(price());

      for (const [which, name] of [
        ['start', 'Minimum'],
        ['end', 'Maximum'],
      ] as const) {
        thumb(which).then(([input]) => {
          const ids = input.getAttribute('aria-labelledby')!.split(' ');
          const text = ids.map((id) => document.getElementById(id)?.textContent?.trim());
          expect(text[0]).to.contain('Price');
          expect(text[1]).to.equal(name);
        });
      }
    });

    it('translates the thumb names, under its own props', () => {
      configureMessages(
        (key) => ({ minimum: 'Mínimo', maximum: 'Máximo' })[key as 'minimum' | 'maximum'],
      );
      cy.mount(html`<gui-range-slider label="Precio" start-label="Desde"></gui-range-slider>`);

      cy.get('gui-range-slider .gui-visually-hidden').should(($names) =>
        expect([...$names].map((name) => name.textContent?.trim())).to.deep.equal([
          'Desde',
          'Máximo',
        ]),
      );
    });

    it('shows its range formatted, and fills the rail between the thumbs', () => {
      cy.mount(price());
      element().invoke('prop', 'value', { start: 100, end: 350 });

      labelValue().should('have.text', '€100 – €350');
      thumb('start').should('have.attr', 'aria-valuetext', '€100');
      thumb('end').should('have.attr', 'aria-valuetext', '€350');
      cy.get('gui-range-slider').should(([host]) => {
        const rail = host.querySelector('.gui-slider__rail')!.getBoundingClientRect();
        const fill = host.querySelector('.gui-slider__fill')!.getBoundingClientRect();
        expect(fill.left - rail.left).to.be.closeTo(rail.width * 0.2, 1);
        expect(fill.width).to.be.closeTo(rail.width * 0.5, 1);
      });
    });
  });

  describe('moving', () => {
    it('fires gui-input with the range, and gui-change when a thumb is let go', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(html`<div @gui-input=${onInput} @gui-change=${onChange}>${price()}</div>`);

      drag('start', 120);
      cy.get('@input').its('lastCall.args.0.detail.value').should('deep.equal', {
        start: 120,
        end: 500,
      });
      cy.get('@change').should('not.have.been.called');
      thumb('start').then(([input]) => input.dispatchEvent(new Event('change', { bubbles: true })));
      cy.get('@change').its('lastCall.args.0.detail.value').should('deep.equal', {
        start: 120,
        end: 500,
      });
    });

    it('stops a thumb at the other rather than cross it', () => {
      cy.mount(price());
      element().invoke('prop', 'value', { start: 100, end: 200 });

      drag('start', 300);
      thumb('start').should('have.value', '200');
      valueOf({ start: 200, end: 200 });
      drag('end', 50);
      valueOf({ start: 200, end: 200 });
    });

    it('moves the nearer thumb to a press on the track, and focuses it', () => {
      const onChange = cy.spy().as('change');
      cy.mount(html`<div @gui-change=${onChange}>${price()}</div>`);
      element().invoke('prop', 'value', { start: 100, end: 300 });

      pressTrack(0.7);
      valueOf({ start: 100, end: 350 });
      cy.focused()
        .should('have.attr', 'data-cy')
        .and('match', /_slider_end$/);
      pressTrack(0.1);
      valueOf({ start: 50, end: 350 });
      cy.get('@change').should('have.been.calledTwice');
    });

    it('measures a press on the track from the right in right to left', () => {
      cy.mount(html`<div dir="rtl">${price()}</div>`);
      element().invoke('prop', 'value', { start: 100, end: 300 });

      // 90% from the left is 10% from the start, on the right.
      pressTrack(0.9);
      valueOf({ start: 50, end: 300 });
    });

    it('ignores presses on the track when read-only or disabled', () => {
      cy.mount(price());
      element().invoke('prop', 'value', { start: 100, end: 300 });
      element().invoke('prop', 'readOnly', true);
      thumb('start').should('have.attr', 'aria-readonly', 'true');

      pressTrack(0.9);
      valueOf({ start: 100, end: 300 });
      element().invoke('prop', 'readOnly', false);
      element().invoke('prop', 'disabled', true);
      pressTrack(0.9);
      valueOf({ start: 100, end: 300 });
      thumb('end').should('be.disabled');
    });

    it('fires gui-blur when focus leaves it, not when it moves between the thumbs', () => {
      const onBlur = cy.spy().as('blur');
      cy.mount(html`<div @gui-blur=${onBlur}>${price()}<button type="button">Next</button></div>`);

      thumb('start').focus();
      thumb('end').focus();
      cy.get('@blur').should('not.have.been.called');
      cy.get('button').focus();
      cy.get('@blur').should('have.been.calledOnce');
    });

    if (takesRealInput()) {
      it('activates the thumb that is pressed, which only takes the pointer on its thumb', () => {
        cy.mount(price());
        element().invoke('prop', 'value', { start: 100, end: 300 });

        thumb('end').then(([range]) => {
          const box = range.getBoundingClientRect();
          // The end thumb sits 60% of the way along the track, the input less a thumb.
          const x = box.left + 10 + (box.width - 20) * 0.6;
          const y = box.top + box.height / 2;
          realMouseDown(x, y);
          thumb('end').should('match', ':active');
          thumb('start').should('not.match', ':active');
          realMouseUp(x, y);
          thumb('end').should('not.match', ':active');
        });
      });

      it('moves each thumb with the arrow keys', () => {
        cy.mount(price());
        element().invoke('prop', 'value', { start: 100, end: 300 });

        thumb('end').focus();
        realPress('ArrowLeft');
        valueOf({ start: 100, end: 290 });
        thumb('start').focus();
        realPress('ArrowRight');
        valueOf({ start: 110, end: 290 });
      });
    }
  });

  describe('form', () => {
    it('submits its range as JSON', () => {
      cy.mount(
        html`<form>
          <gui-range-slider name="price" .value=${{ start: 20, end: 80 }}></gui-range-slider>
        </form>`,
      );

      cy.get('form').should(([form]) =>
        expect(new FormData(form as HTMLFormElement).get('price')).to.equal(
          '{"start":20,"end":80}',
        ),
      );
    });
  });
});
