import { html } from 'lit';
import type { GuiPillItem } from '../../src/lib/components/pills';
import type { GuiMultiSelectTrigger } from '../../src/lib/components/multi-select-trigger';

const selected: GuiPillItem[] = [
  { key: 'red', label: 'Red' },
  { key: 'green', label: 'Green' },
];

const input = () => cy.get('gui-multi-select-trigger input');
const pills = () => cy.get('gui-multi-select-trigger .gui-pills__strip .gui-pills__pill');
const element = () => cy.get<GuiMultiSelectTrigger>('gui-multi-select-trigger');

describe('gui-multi-select-trigger', () => {
  // Wide enough for the pills to show in a strip rather than collapse into a count.
  beforeEach(() => cy.viewport(800, 500));

  describe('rendering', () => {
    it('renders a combobox search field from its attributes', () => {
      cy.mount(
        html`<gui-multi-select-trigger
          placeholder="Search colors"
          autocomplete="off"
          panel-id="colors-panel"
          required
        ></gui-multi-select-trigger>`,
      );

      input()
        .should('have.attr', 'role', 'combobox')
        .and('have.attr', 'placeholder', 'Search colors')
        .and('have.attr', 'autocomplete', 'off')
        .and('have.attr', 'aria-controls', 'colors-panel')
        .and('have.attr', 'aria-expanded', 'false')
        .and('have.attr', 'aria-autocomplete', 'list');
      // The element validates itself: only the ARIA state is on the native control.
      input().should('have.attr', 'aria-required', 'true').and('not.have.attr', 'required');
      input().should('have.attr', 'aria-required', 'true');

      element().invoke('attr', 'panel-open', '');
      input().should('have.attr', 'aria-expanded', 'true');
    });

    it('renders the selected options as pills to remove', () => {
      cy.mount(html`<gui-multi-select-trigger .pills=${selected}></gui-multi-select-trigger>`);

      cy.get('gui-multi-select-trigger [role="toolbar"]').should(
        'have.attr',
        'aria-label',
        'Selected options',
      );
      pills().should('have.length', 2);
      pills()
        .eq(0)
        .should('contain.text', 'Red')
        .and('have.attr', 'aria-description', 'Remove option');
    });

    it('names the pills and their removal with its aria-label attributes', () => {
      cy.mount(
        html`<gui-multi-select-trigger
          toolbar-aria-label="Colors"
          remove-aria-label="Drop"
          .pills=${selected}
        ></gui-multi-select-trigger>`,
      );

      cy.get('gui-multi-select-trigger [role="toolbar"]').should(
        'have.attr',
        'aria-label',
        'Colors',
      );
      pills().eq(1).should('have.attr', 'aria-description', 'Drop');
    });

    it('renders its icon hidden from assistive technology', () => {
      cy.mount(html`<gui-multi-select-trigger icon="icon-palette"></gui-multi-select-trigger>`);

      cy.get('gui-multi-select-trigger .icon-palette').should('have.attr', 'aria-hidden', 'true');
    });

    it('marks the search field invalid while it has errors', () => {
      cy.mount(html`<gui-multi-select-trigger .errors=${['Pick one']}></gui-multi-select-trigger>`);

      input().should('have.attr', 'aria-invalid', 'true');
      element().invoke('prop', 'touched', false);
      input().should('not.have.attr', 'aria-invalid');
    });
  });

  describe('events', () => {
    it('fires gui-pill-remove when a pill is removed', () => {
      const onRemove = cy.spy().as('remove');
      cy.mount(
        html`<gui-multi-select-trigger
          .pills=${selected}
          @gui-pill-remove=${onRemove}
        ></gui-multi-select-trigger>`,
      );

      cy.get('gui-multi-select-trigger .gui-pills__pill-remove').eq(1).click();

      cy.get('@remove').should('have.been.calledOnce');
      cy.get('@remove').its('firstCall.args.0.detail').should('deep.equal', { key: 'green' });
    });

    it('fires gui-dropdown-toggle when the pills collapse into a count', () => {
      const onToggle = cy.spy().as('toggle');
      cy.mount(
        html`<div style="width: 300px">
          <gui-multi-select-trigger
            .pills=${selected}
            @gui-dropdown-toggle=${onToggle}
          ></gui-multi-select-trigger>
        </div>`,
      );

      cy.get('gui-multi-select-trigger .gui-pills__count')
        .should('have.attr', 'aria-label', '2 selected')
        .click();

      cy.get('@toggle').its('lastCall.args.0.detail').should('deep.equal', { open: true });
    });
  });

  describe('events', () => {
    it('fires none of the events of its pills but its own', () => {
      const pillEvents = [
        'gui-pill-click',
        'gui-pill-focus',
        'gui-pill-edit',
        'gui-pill-edit-confirm',
        'gui-pill-edit-cancel',
        'gui-pill-exit',
        'gui-pill-keydown',
        'gui-pills-blur',
      ];
      const leaked = cy.spy().as('leaked');
      const onRemove = cy.spy().as('remove');
      cy.mount(
        html`<div style="width: 300px">
          <gui-multi-select-trigger
            .pills=${selected}
            @gui-pill-remove=${onRemove}
          ></gui-multi-select-trigger>
        </div>`,
      );
      cy.get('div').then(([wrapper]) => {
        for (const type of pillEvents) wrapper.addEventListener(type, leaked);
      });

      // Into the collapsed pills, past their end (gui-pill-keydown), out with Escape
      // (gui-pill-exit), and a removal, which is the trigger's own.
      input().focus().type('{leftArrow}');
      cy.focused().should('have.attr', 'data-key', 'red').type('{downArrow}{downArrow}x');
      cy.focused().type('{esc}');
      cy.focused().should('have.attr', 'role', 'combobox');
      cy.get('gui-multi-select-trigger .gui-pills__pill-remove').first().click({ force: true });

      cy.get('@remove').should('have.been.calledOnce');
      cy.get('@leaked').should('not.have.been.called');
    });
  });

  describe('keyboard', () => {
    it('moves into the pills with ArrowLeft and back to the search past the last pill', () => {
      cy.mount(html`<gui-multi-select-trigger .pills=${selected}></gui-multi-select-trigger>`);

      pills().should('have.attr', 'tabindex', '-1');
      input().focus().type('{leftArrow}');
      cy.focused().should('have.attr', 'data-key', 'green');
      cy.focused().type('{leftArrow}');
      cy.focused().should('have.attr', 'data-key', 'red');
      cy.focused().type('{rightArrow}{rightArrow}');
      cy.focused().should('have.attr', 'role', 'combobox');
    });

    it('moves into the pills with Backspace in an empty search', () => {
      cy.mount(html`<gui-multi-select-trigger .pills=${selected}></gui-multi-select-trigger>`);

      input().type('r{backspace}');
      cy.focused().should('have.attr', 'role', 'combobox');
      cy.focused().type('{backspace}');
      cy.focused().should('have.attr', 'data-key', 'green');
    });

    it('returns focus to the search once its last pill is removed', () => {
      const removeLast = (event: Event) => {
        (event.currentTarget as GuiMultiSelectTrigger).pills = [];
      };
      cy.mount(
        html`<gui-multi-select-trigger
          .pills=${[selected[0]]}
          @gui-pill-remove=${removeLast}
        ></gui-multi-select-trigger>`,
      );

      input().focus().type('{leftArrow}');
      cy.focused().should('have.attr', 'data-key', 'red').type('{del}');

      pills().should('not.exist');
      cy.focused().should('have.attr', 'role', 'combobox');
    });

    it('opens the collapsed pills on ArrowLeft and returns to the search on Escape', () => {
      cy.mount(
        html`<div style="width: 300px">
          <gui-multi-select-trigger .pills=${selected}></gui-multi-select-trigger>
        </div>`,
      );

      input().focus().type('{leftArrow}');
      cy.get('gui-multi-select-trigger .gui-pills__dropdown').should('exist');
      cy.focused().should('have.attr', 'data-key', 'red').type('{downArrow}');
      cy.focused().should('have.attr', 'data-key', 'green').type('{esc}');

      cy.get('gui-multi-select-trigger .gui-pills__dropdown').should('not.exist');
      cy.focused().should('have.attr', 'role', 'combobox');
    });
  });

  describe('states', () => {
    it('keeps focus in the search when read-only', () => {
      cy.mount(
        html`<gui-multi-select-trigger readonly .pills=${selected}></gui-multi-select-trigger>`,
      );

      input().should('have.attr', 'readonly');
      input().should('have.attr', 'aria-readonly', 'true');
      pills().should('be.disabled');
      input().focus().trigger('keydown', { key: 'ArrowLeft' });
      cy.focused().should('have.attr', 'role', 'combobox');
    });

    it('shows its pills without remove buttons when read-only', () => {
      cy.mount(
        html`<gui-multi-select-trigger readonly .pills=${selected}></gui-multi-select-trigger>`,
      );

      pills().should('have.length', 2).and('not.have.attr', 'aria-description');
      cy.get('gui-multi-select-trigger .gui-pills__pill-remove').should('not.exist');
    });

    it('disables the search and the pills', () => {
      cy.mount(
        html`<gui-multi-select-trigger disabled .pills=${selected}></gui-multi-select-trigger>`,
      );

      input().should('be.disabled');
      pills().should('be.disabled');
    });
  });
});
