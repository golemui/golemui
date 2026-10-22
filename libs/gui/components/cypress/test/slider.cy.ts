import { html } from 'lit';
import type { GuiSlider } from '../../src/lib/components/slider';
import { realMouseDown, realMouseUp, realPress, takesRealInput } from '../support/real-input';

const element = () => cy.get<GuiSlider>('gui-slider');
const input = () => cy.get<HTMLInputElement>('gui-slider input[type="range"]');
const labelValue = () => cy.get('gui-slider .gui-slider__value');
const bubble = () => cy.get('gui-slider .gui-slider__bubble');

/** Moves the thumb the way the browser reports a drag: the input's value, then `input`. */
const drag = (value: number) =>
  input().then(([range]) => {
    range.value = String(value);
    range.dispatchEvent(new Event('input', { bubbles: true }));
  });
const release = () =>
  input().then(([range]) => range.dispatchEvent(new Event('change', { bubbles: true })));

describe('gui-slider', () => {
  describe('rendering', () => {
    it('has no value until it is moved: the thumb rests at the minimum', () => {
      cy.mount(html`<gui-slider label="Volume" minimum="10" maximum="50"></gui-slider>`);

      input()
        .should('have.value', '10')
        .and('have.attr', 'aria-valuetext', 'Not set')
        .and('have.attr', 'min', '10')
        .and('have.attr', 'max', '50');
      labelValue().should('have.text', '–');
      element().should(([host]) => expect(host.value).to.equal(undefined));
      cy.get('gui-slider .gui-slider__control').should('have.class', 'gui-slider__control--empty');
    });

    it('is named by its label, and reads its value formatted', () => {
      cy.mount(
        html`<gui-slider
          label="Opacity"
          .value=${0.6}
          maximum="1"
          step="0.05"
          .format=${{ style: 'percent' }}
        ></gui-slider>`,
      );

      input().then(([range]) => {
        expect(range.labels?.[0]?.textContent).to.contain('Opacity');
      });
      input().should('have.attr', 'aria-valuetext', '60%');
      labelValue().should('have.text', '60%').and('have.attr', 'aria-hidden', 'true');
    });

    it('formats for its locale', () => {
      cy.mount(
        html`<gui-slider
          label="Price"
          locale-id="es"
          maximum="50000"
          .value=${15000}
          .format=${{ style: 'currency', currency: 'EUR' }}
        ></gui-slider>`,
      );

      labelValue()
        .invoke('text')
        .should('match', /^15\.000,00\s€$/);
    });

    it('fills the rail up to the thumb, and mirrors in right to left', () => {
      const fill = (dir: string) => {
        cy.mount(html`<div dir=${dir}><gui-slider label="Level" .value=${25}></gui-slider></div>`);
        return cy.get('gui-slider').then(([host]) => {
          const rail = host.querySelector('.gui-slider__rail')!.getBoundingClientRect();
          const filled = host.querySelector('.gui-slider__fill')!.getBoundingClientRect();
          return { rail, filled };
        });
      };

      fill('ltr').then(({ rail, filled }) => {
        expect(filled.left).to.be.closeTo(rail.left, 1);
        expect(filled.width).to.be.closeTo(rail.width / 4, 1);
      });
      fill('rtl').then(({ rail, filled }) => {
        expect(filled.right).to.be.closeTo(rail.right, 1);
        expect(filled.width).to.be.closeTo(rail.width / 4, 1);
      });
    });

    it('is as tall as a text field', () => {
      cy.mount(
        html`<gui-textinput label="Name"></gui-textinput><gui-slider label="Volume"></gui-slider>`,
      );

      cy.get('gui-textinput input').then(([field]) => {
        cy.get('gui-slider .gui-slider__control').should(([control]) =>
          expect(control.getBoundingClientRect().height).to.be.closeTo(
            field.getBoundingClientRect().height,
            0.5,
          ),
        );
      });
    });
  });

  describe('in a grid row', () => {
    it('lines its control up with the fields beside it, with labelled marks and errors', () => {
      cy.mount(
        html`<div class="gui-grid gui-grid--row">
          <div class="gui-grid__cell">
            <gui-textinput label="Name" hint="As on your passport"></gui-textinput>
          </div>
          <div class="gui-grid__cell">
            <gui-slider
              label="Rating"
              minimum="1"
              maximum="5"
              .marks=${[
                { value: 1, label: 'Poor' },
                { value: 5, label: 'Great' },
              ]}
              .errors=${['Pick a rating']}
            ></gui-slider>
          </div>
        </div>`,
      );

      const middle = (element: Element) => {
        const { top, height } = element.getBoundingClientRect();
        return top + height / 2;
      };
      cy.get('gui-textinput input').then(([field]) =>
        cy.get('gui-slider .gui-slider__control').should(([control]) => {
          expect(middle(control)).to.be.closeTo(middle(field), 0.5);
        }),
      );
      // The marks' labels, then the errors, under the control.
      cy.get('gui-slider').should(([host]) => {
        const control = host.querySelector('.gui-slider__control')!.getBoundingClientRect();
        const labels = host.querySelector('.gui-slider__tick-labels')!.getBoundingClientRect();
        const errors = host.querySelector('.gui-validator')!.getBoundingClientRect();
        expect(labels.top).to.be.at.least(control.bottom);
        expect(errors.top).to.be.at.least(labels.bottom);
      });
    });
  });

  describe('marks', () => {
    it('draws a tick at every step, filled up to the value', () => {
      cy.mount(html`<gui-slider label="Level" step="25" .value=${50} marks></gui-slider>`);

      cy.get('gui-slider .gui-slider__tick').should('have.length', 5);
      cy.get('gui-slider .gui-slider__tick--filled').should('have.length', 3);
    });

    it('draws ticks at given values, with their labels under the control', () => {
      cy.mount(
        html`<gui-slider
          label="Rating"
          minimum="1"
          maximum="5"
          .marks=${[{ value: 1, label: 'Poor' }, 3, { value: 5, label: 'Great' }, 9]}
        ></gui-slider>`,
      );

      cy.get('gui-slider .gui-slider__tick').should('have.length', 3);
      cy.get('gui-slider .gui-slider__tick-label').should(($labels) =>
        expect([...$labels].map((label) => label.textContent)).to.deep.equal(['Poor', 'Great']),
      );
      cy.get('gui-slider .gui-slider__tick-labels').should('have.attr', 'aria-hidden', 'true');
    });

    it('reads marks from a JSON attribute', () => {
      cy.mount(html`<gui-slider label="Level" marks="[0, 50, 100]"></gui-slider>`);

      cy.get('gui-slider .gui-slider__tick').should('have.length', 3);
    });
  });

  describe('value', () => {
    it('fires gui-input while the thumb moves and gui-change when it is let go', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-slider
          label="Volume"
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-slider>`,
      );

      drag(30);
      cy.get('@input').its('lastCall.args.0.detail.value').should('equal', 30);
      cy.get('@change').should('not.have.been.called');
      release();
      cy.get('@change').its('lastCall.args.0.detail.value').should('equal', 30);
      labelValue().should('have.text', '30');
      input().should('have.attr', 'aria-valuetext', '30');
    });

    it('reports a value outside its bounds, set from outside', () => {
      cy.mount(html`<form><gui-slider name="level" .value=${150}></gui-slider></form>`);

      element().should(([host]) => expect(host.validity?.rangeOverflow).to.equal(true));
    });

    if (takesRealInput()) {
      it('steps with the arrow keys', () => {
        cy.mount(html`<gui-slider label="Volume" step="5" .value=${50}></gui-slider>`);

        input().focus();
        realPress('ArrowRight');
        element().should(([host]) => expect(host.value).to.equal(55));
        realPress('ArrowLeft');
        realPress('ArrowLeft');
        element().should(([host]) => expect(host.value).to.equal(45));
      });

      // The ring is drawn on the thumb for `:focus-visible` and `:active`, and the thumb's
      // pseudo-element can't be measured: the input is active while its thumb is held.
      it('is active while the thumb is pressed, so it shows the focus ring as for the keyboard', () => {
        cy.mount(html`<gui-slider label="Volume" .value=${40}></gui-slider>`);

        input().then(([range]) => {
          const box = range.getBoundingClientRect();
          // The thumb's centre: 40% of the way along the track, which is the input less a thumb.
          const x = box.left + 10 + (box.width - 20) * 0.4;
          const y = box.top + box.height / 2;
          realMouseDown(x, y);
          input().should('match', ':active');
          realMouseUp(x, y);
          input().should('not.match', ':active');
        });
      });

      it('stays put on the arrow keys when read-only', () => {
        cy.mount(html`<gui-slider label="Volume" .value=${50} readonly></gui-slider>`);

        input().should('have.attr', 'aria-readonly', 'true').focus();
        realPress('ArrowRight');
        element().should(([host]) => expect(host.value).to.equal(50));
        input().should('have.value', '50');
      });
    }

    it('is disabled with its input, and turns grey', () => {
      cy.mount(html`<gui-slider label="Volume" .value=${40} disabled></gui-slider>`);

      input().should('be.disabled');
      // The fill takes the disabled text colour, as a disabled field's text does.
      cy.get('gui-slider').should(([host]) => {
        const probe = host.ownerDocument.createElement('span');
        probe.style.color = 'var(--gui-text-disabled)';
        host.append(probe);
        const disabled = getComputedStyle(probe).color;
        probe.remove();
        const fill = host.querySelector('.gui-slider__fill')!;
        expect(getComputedStyle(fill).backgroundColor).to.equal(disabled);
      });
    });
  });

  describe('value placement', () => {
    it('shows the value only in a bubble with bubble, while the thumb has focus', () => {
      cy.mount(
        html`<gui-slider label="Volume" .value=${40} value-placement="bubble"></gui-slider>`,
      );

      labelValue().should('not.exist');
      bubble().should('have.text', '40').and('have.css', 'visibility', 'hidden');
      input().focus();
      bubble().should('have.css', 'visibility', 'visible');
      // Its arrow points down at the thumb, over the gap between them.
      bubble().should(([element]) => {
        const arrow = getComputedStyle(element, '::before');
        expect(arrow.content).not.to.equal('none');
        expect(parseFloat(arrow.top)).to.be.closeTo(element.clientHeight, 1);
        expect(parseFloat(arrow.left)).to.be.closeTo(element.clientWidth / 2, 1);
      });
    });

    it('hides the bubble on Escape until the focus leaves', () => {
      cy.mount(
        html`<button type="button" id="before">Before</button>
          <gui-slider label="Volume" .value=${40} value-placement="both"></gui-slider>`,
      );

      labelValue().should('have.text', '40');
      input().focus().trigger('keydown', { key: 'Escape' });
      bubble().should('have.css', 'visibility', 'hidden');
      cy.get('#before').focus();
      input().focus();
      bubble().should('have.css', 'visibility', 'visible');
    });

    it('shows the value nowhere with hidden, and still reads it', () => {
      cy.mount(
        html`<gui-slider label="Volume" .value=${40} value-placement="hidden"></gui-slider>`,
      );

      labelValue().should('not.exist');
      bubble().should('not.exist');
      input().should('have.attr', 'aria-valuetext', '40');
    });

    if (takesRealInput()) {
      it('closes the bubble on Escape, not the dialog the slider is in', () => {
        cy.mount(
          html`<gui-dialog open>
            <dialog aria-label="Settings">
              <gui-slider label="Volume" .value=${40} value-placement="bubble"></gui-slider>
            </dialog>
          </gui-dialog>`,
        );
        cy.get('dialog').should('match', ':modal');

        input().focus();
        realPress('Escape');
        bubble().should('have.css', 'visibility', 'hidden');
        cy.get('dialog').should('match', ':modal');
        realPress('Escape');
        cy.get('dialog').should('not.match', ':modal');
      });
    }
  });
});
