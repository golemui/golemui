import { html } from 'lit';
import type { GuiRadiogroup } from '../../src/lib/components/radiogroup';
import { realPress, takesRealInput } from '../support/real-input';

const options = [
  { label: 'Red', value: 'red' },
  { label: 'Green', value: 'green' },
  { label: 'Blue', value: 'blue' },
];

const radios = () => cy.get('gui-radiogroup input[type="radio"]');
const group = () => cy.get('gui-radiogroup [role="radiogroup"]');
const element = () => cy.get<GuiRadiogroup>('gui-radiogroup');

describe('gui-radiogroup', () => {
  describe('rendering', () => {
    it('renders one radio per option from its attributes', () => {
      cy.mount(
        html`<gui-radiogroup
          label="Color"
          options='[{"name":"Red","id":"red"},{"name":"Green","id":"green"}]'
          label-field="name"
          value-field="id"
          value="green"
        ></gui-radiogroup>`,
      );

      radios().should('have.length', 2);
      cy.get('gui-radiogroup label').eq(0).should('contain.text', 'Red');
      radios().eq(0).should('have.value', 'red').and('not.be.checked');
      radios().eq(1).should('have.value', 'green').and('be.checked');
    });

    it('renders plain values as options', () => {
      cy.mount(html`<gui-radiogroup label="Size" options='["S","M"]'></gui-radiogroup>`);

      radios().eq(0).should('have.value', 'S');
      cy.get('gui-radiogroup label').eq(1).should('contain.text', 'M');
    });

    it('keeps options as they were given', () => {
      const given = ['S', 'M'];
      cy.mount(html`<gui-radiogroup label="Size" .options=${given}></gui-radiogroup>`);

      radios().should('have.length', 2);
      // The element normalizes a copy: the property still holds what the host set.
      element().should(($el) => expect($el[0].options).to.equal(given));
      element().should(($el) => expect($el[0].options).to.deep.equal(['S', 'M']));
    });

    it('names the group with its label and describes it with its hint', () => {
      cy.mount(
        html`<gui-radiogroup label="Color" hint="Pick one" .options=${options}></gui-radiogroup>`,
      );

      group()
        .invoke('attr', 'aria-labelledby')
        .then((id) => cy.get(`#${id}`).should('contain.text', 'Color'));
      group()
        .invoke('attr', 'aria-describedby')
        .then((id) => cy.get(`#${id}`).should('have.text', 'Pick one'));
    });

    it('lays the options out in a row with direction', () => {
      cy.mount(
        html`<gui-radiogroup label="Color" direction="row" .options=${options}></gui-radiogroup>`,
      );

      group().should('have.class', 'gui-widget--horizontal');
    });

    it('marks the group as required and shows its errors', () => {
      cy.mount(
        html`<gui-radiogroup
          label="Color"
          required
          .options=${options}
          .errors=${['Pick a color']}
        ></gui-radiogroup>`,
      );

      group().should('have.attr', 'aria-required', 'true');
      group().should('have.attr', 'aria-invalid', 'true');
      group()
        .invoke('attr', 'aria-errormessage')
        .then((id) => cy.get(`#${id}`).should('contain.text', 'Pick a color'));
    });
  });

  describe('value', () => {
    it('fires gui-input and gui-change when an option is picked', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-radiogroup
          label="Color"
          .options=${options}
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-radiogroup>`,
      );

      radios().eq(1).check();

      cy.get('@input').its('firstCall.args.0.detail').should('deep.equal', { value: 'green' });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: 'green' });
      element().should('have.prop', 'value', 'green');
    });

    it('keeps number option values as numbers', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-radiogroup
          label="Rating"
          .options=${[1, 2, 3]}
          @gui-change=${onChange}
        ></gui-radiogroup>`,
      );

      radios().eq(2).check();

      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: 3 });
    });

    it('fires gui-blur when focus leaves', () => {
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-radiogroup
          label="Color"
          .options=${options}
          @gui-blur=${onBlur}
        ></gui-radiogroup>`,
      );

      radios().eq(0).focus().blur();

      cy.get('@blur').should('have.been.calledOnce');
    });

    it('checks the option of a value set from outside', () => {
      cy.mount(
        html`<gui-radiogroup label="Color" value="red" .options=${options}></gui-radiogroup>`,
      );

      element().invoke('prop', 'value', 'blue');

      radios().eq(2).should('be.checked');
      radios().eq(0).should('not.be.checked');
    });
  });

  describe('keyboard', () => {
    it('keeps a single tab stop on the checked option, or the first one', () => {
      cy.mount(html`<gui-radiogroup label="Color" .options=${options}></gui-radiogroup>`);

      radios().eq(0).should('have.attr', 'tabindex', '0');
      radios().eq(1).should('have.attr', 'tabindex', '-1');

      element().invoke('prop', 'value', 'green');

      radios().eq(0).should('have.attr', 'tabindex', '-1');
      radios().eq(1).should('have.attr', 'tabindex', '0');
      radios().eq(2).should('have.attr', 'tabindex', '-1');
    });
  });

  describe('states', () => {
    it('stays focusable and marks the group read-only when read-only', () => {
      cy.mount(
        html`<gui-radiogroup
          label="Color"
          value="red"
          readonly
          .options=${options}
        ></gui-radiogroup>`,
      );

      group().should('have.attr', 'aria-readonly', 'true');
      radios().should('not.be.disabled');
      radios().eq(0).should('have.attr', 'tabindex', '0').focus().should('be.focused');
    });

    it('keeps its value on clicks and keys when read-only, firing nothing', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-radiogroup
          label="Color"
          value="red"
          readonly
          .options=${options}
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-radiogroup>`,
      );

      cy.get('gui-radiogroup label').contains('Green').click();
      radios().eq(2).click();
      radios()
        .eq(0)
        .then(([radio]) => {
          // Cancelled keys are what keep the browser from checking the next radio.
          const press = (key: string) =>
            radio.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true }));
          expect(press('ArrowDown')).to.equal(false);
          expect(press('ArrowRight')).to.equal(false);
          expect(press(' ')).to.equal(false);
          expect(press('Tab')).to.equal(true);
        });

      radios().eq(0).should('be.checked');
      radios().eq(1).should('not.be.checked');
      radios().eq(2).should('not.be.checked');
      element().should('have.prop', 'value', 'red');
      cy.get('@input').should('not.have.been.called');
      cy.get('@change').should('not.have.been.called');
    });

    it('disables every radio', () => {
      cy.mount(html`<gui-radiogroup label="Color" disabled .options=${options}></gui-radiogroup>`);

      radios().should('have.length', 3).and('be.disabled');
    });
  });

  describe('segmented appearance', () => {
    const ranges = [
      { label: 'Day', value: 'day' },
      { label: 'Week', value: 'week' },
      { label: 'Month', value: 'month' },
    ];
    const segments = () => cy.get('gui-radiogroup .gui-widget--segmented > label');
    const segment = (text: string) =>
      cy.contains('gui-radiogroup .gui-widget--segmented > label', text);
    const tops = (labels: JQuery<HTMLElement>) =>
      [...labels].map((label) => Math.round(label.getBoundingClientRect().top));
    const mountSegmented = (attributes: Record<string, unknown> = {}) =>
      cy.mount(
        html`<gui-radiogroup
          label="Range"
          appearance="segmented"
          .options=${ranges}
          .value=${attributes['value']}
          ?disabled=${attributes['disabled'] === true}
          direction=${(attributes['direction'] as string) ?? 'column'}
        ></gui-radiogroup>`,
      );

    it('shows the options as joined segments in a row, still a radio group', () => {
      mountSegmented({ direction: 'column' });

      group().should('have.class', 'gui-widget--segmented');
      radios().should('have.length', 3).and('have.css', 'opacity', '0');
      // A row, whatever `direction` says.
      segments().should((labels) => expect(new Set(tops(labels)).size).to.equal(1));
    });

    it('is as tall as a text field', () => {
      cy.mount(
        html`<gui-textinput label="Name"></gui-textinput>
          <gui-radiogroup
            label="Range"
            appearance="segmented"
            .options=${ranges}
          ></gui-radiogroup>`,
      );

      cy.get('gui-textinput input').then(([input]) => {
        const field = input.getBoundingClientRect().height;
        group().should(([segmented]) =>
          expect(segmented.getBoundingClientRect().height).to.be.closeTo(field, 0.5),
        );
      });
    });

    it('picks an option with a click on its segment, and fills the selected one', () => {
      const onInput = cy.spy().as('input');
      mountSegmented({ value: 'day' });
      element().then(([host]) => host.addEventListener('gui-input', onInput));

      segment('Week').click();

      cy.get('@input').its('lastCall.args.0.detail.value').should('equal', 'week');
      segment('Week').should(([label]) => {
        const fill = getComputedStyle(label).backgroundColor;
        const other = getComputedStyle(label.parentElement!.firstElementChild!).backgroundColor;
        expect(fill).not.to.equal(other);
      });
    });

    it('ignores clicks when disabled', () => {
      const onInput = cy.spy().as('input');
      mountSegmented({ value: 'day', disabled: true });
      element().then(([host]) => host.addEventListener('gui-input', onInput));

      segment('Month').click({ force: true });

      cy.get('@input').should('not.have.been.called');
      radios().should('be.disabled');
    });

    if (takesRealInput()) {
      it('moves the selection with the arrow keys, and shows the focus on the segment', () => {
        mountSegmented({ value: 'day' });

        radios().first().focus();
        realPress('ArrowRight');

        cy.focused().should('have.value', 'week').and('be.checked');
        segment('Week').should('not.have.css', 'box-shadow', 'none');
        realPress('ArrowLeft');
        cy.focused().should('have.value', 'day');
      });
    }

    it('mirrors in right to left', () => {
      cy.mount(
        html`<div dir="rtl">
          <gui-radiogroup appearance="segmented" .options=${ranges}></gui-radiogroup>
        </div>`,
      );

      segments().should(([first, second]) =>
        expect(first.getBoundingClientRect().left).to.be.greaterThan(
          second.getBoundingClientRect().left,
        ),
      );
    });

    it('stacks its segments in a narrow form', () => {
      cy.mount(
        html`<div class="narrow">
          <gui-radiogroup appearance="segmented" .options=${ranges}></gui-radiogroup>
        </div>`,
      );
      // A narrow GolemUI form: the container the components' narrow layouts query.
      cy.get('.narrow').then(([narrow]) => {
        narrow.style.setProperty('container', 'gui-container / inline-size');
        narrow.style.setProperty('inline-size', '320px');
      });

      segments().should((labels) => expect(new Set(tops(labels)).size).to.equal(3));
    });
  });
});
