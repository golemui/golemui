import { html } from 'lit';

const button = () => cy.get('gui-button button');

describe('gui-button', () => {
  describe('rendering', () => {
    it('renders its label in a plain button', () => {
      cy.mount(html`<gui-button label="Save"></gui-button>`);

      button().should('have.attr', 'type', 'button').and('contain.text', 'Save');
      button().should('not.have.class', 'gui-button--outlined');
    });

    it('renders its icon hidden from assistive technology, on the side of icon-position', () => {
      cy.mount(
        html`<gui-button label="Next" icon="icon-arrow" icon-position="right"></gui-button>`,
      );

      button()
        .should('have.class', 'gui-button-with-icon')
        .and('have.class', 'gui-button-icon-right');
      button()
        .children()
        .last()
        .should('have.class', 'icon-arrow')
        .and('have.attr', 'aria-hidden', 'true');

      cy.get('gui-button').invoke('attr', 'icon-position', 'left');
      button().children().first().should('have.class', 'icon-arrow');
    });

    it('styles itself with variant', () => {
      cy.mount(html`<gui-button label="Cancel" variant="outlined"></gui-button>`);

      button().should('have.class', 'gui-button--outlined');
      cy.get('gui-button').invoke('attr', 'variant', 'link');
      button()
        .should('have.class', 'gui-button--link')
        .and('not.have.class', 'gui-button--outlined');
    });
  });

  describe('accessible name', () => {
    it('names an icon-only button with button-aria-label', () => {
      cy.mount(html`<gui-button icon="icon-close" button-aria-label="Close"></gui-button>`);

      button().should('have.attr', 'aria-label', 'Close');
    });

    it('keeps its visible label as its name, and drops the aria-label', () => {
      cy.mount(
        html`<gui-button label="Save" icon="icon-save" button-aria-label="Store"></gui-button>`,
      );

      button().should('not.have.attr', 'aria-label');
      cy.get('gui-button').invoke('prop', 'label', '');
      button().should('have.attr', 'aria-label', 'Store');
    });

    it('names an icon-only link too', () => {
      cy.mount(
        html`<gui-button href="/help" icon="icon-help" button-aria-label="Help"></gui-button>`,
      );

      cy.get('gui-button a').should('have.attr', 'aria-label', 'Help');
    });
  });

  describe('states', () => {
    it('submits its form with type="submit", sending its name and value', () => {
      const onSubmit = cy.spy((event: Event) => event.preventDefault()).as('submit');
      cy.mount(
        html`<form @submit=${onSubmit}>
          <gui-button label="Send" type="submit" name="intent" value="send"></gui-button>
        </form>`,
      );

      button().should('have.attr', 'type', 'submit').click();

      cy.get('@submit').should('have.been.calledOnce');
      cy.get<HTMLFormElement>('form').then(([form]) => {
        const submitter = form.querySelector('button');
        expect(new FormData(form, submitter).get('intent')).to.equal('send');
      });
    });

    it('submits the form named by its form attribute', () => {
      const onSubmit = cy.spy((event: Event) => event.preventDefault()).as('submit');
      cy.mount(
        html`<form id="checkout" @submit=${onSubmit}></form>
          <gui-button label="Pay" type="submit" form="checkout"></gui-button>`,
      );

      button().click();

      cy.get('@submit').should('have.been.calledOnce');
    });

    it('resets its form with type="reset"', () => {
      cy.mount(
        html`<form>
          <input value="initial" />
          <gui-button label="Reset" type="reset"></gui-button>
        </form>`,
      );

      cy.get('input').clear().type('changed');
      button().click();

      cy.get('input').should('have.value', 'initial');
    });

    it('disables the native button', () => {
      cy.mount(html`<gui-button label="Save" disabled></gui-button>`);

      button().should('be.disabled');
    });

    it('while loading, shows a spinner, stays focusable and ignores clicks', () => {
      const onSubmit = cy.spy((event: Event) => event.preventDefault()).as('submit');
      const onClick = cy.spy().as('click');
      cy.mount(
        html`<form @submit=${onSubmit}>
          <gui-button label="Send" type="submit" loading @click=${onClick}></gui-button>
        </form>`,
      );

      button()
        .should('not.be.disabled')
        .and('have.attr', 'aria-disabled', 'true')
        .and('have.attr', 'aria-busy', 'true')
        .and('contain.text', 'Send');
      button().find('.gui-spinner svg').should('have.attr', 'aria-hidden', 'true');
      button().focus().click();

      cy.focused().should('have.attr', 'type', 'submit');
      cy.get('@submit').should('not.have.been.called');
      cy.get('@click').should('not.have.been.called');
    });

    it('sizes itself with size', () => {
      cy.mount(html`<gui-button label="Save" size="sm"></gui-button>`);

      button().should('have.class', 'gui-button--sm').invoke('outerHeight').should('equal', 32);
      cy.get('gui-button').invoke('attr', 'size', 'lg');
      button().should('have.class', 'gui-button--lg').invoke('outerHeight').should('equal', 50);
    });
  });

  describe('as a link', () => {
    const link = () => cy.get('gui-button a');

    it('renders a link with href, styled like a button', () => {
      cy.mount(
        html`<gui-button
          label="Docs"
          href="https://golemui.com"
          target="_blank"
          rel="noopener"
          variant="outlined"
        ></gui-button>`,
      );

      cy.get('gui-button button').should('not.exist');
      link()
        .should('have.attr', 'href', 'https://golemui.com')
        .and('have.attr', 'target', '_blank')
        .and('have.attr', 'rel', 'noopener')
        .and('have.class', 'gui-button--outlined')
        .and('contain.text', 'Docs');
    });

    it('drops its href while disabled, and stays a link', () => {
      const onClick = cy.spy().as('click');
      cy.mount(
        html`<gui-button label="Docs" href="#docs" disabled @click=${onClick}></gui-button>`,
      );

      link().should('not.have.attr', 'href');
      link().should('have.attr', 'role', 'link');
      link().should('have.attr', 'aria-disabled', 'true');
      link().click();

      cy.get('@click').should('not.have.been.called');
    });
  });

  describe('as an invoker', () => {
    it('toggles a popover with commandfor and command, which anchors to its inner button', () => {
      cy.mount(
        html`<gui-button label="Filters" commandfor="filters" command="toggle-popover"></gui-button>
          <gui-popover>
            <div id="filters" popover><button type="button">Apply</button></div>
          </gui-popover>`,
      );

      button()
        .should('have.attr', 'commandfor', 'filters')
        .and('have.attr', 'command', 'toggle-popover');
      button().click();
      cy.get('#filters').should('match', ':popover-open');
      button().then(([invoker]) =>
        cy.get('#filters').should(([panel]) => {
          const anchor = invoker.getBoundingClientRect();
          const box = panel.getBoundingClientRect();
          expect(box.top).to.be.closeTo(anchor.bottom + 4, 1);
          expect(box.left).to.be.closeTo(anchor.left, 1);
        }),
      );
      button().click();
      cy.get('#filters').should('not.match', ':popover-open');
    });

    it('opens a dialog with command="show-modal", and gets focus back when it closes', () => {
      cy.mount(
        html`<gui-button label="Edit" commandfor="edit" command="show-modal"></gui-button>
          <gui-dialog>
            <dialog id="edit" aria-label="Edit profile">
              <button type="button" commandfor="edit" command="close">Cancel</button>
            </dialog>
          </gui-dialog>`,
      );

      button().click();
      cy.get('#edit').should('match', ':modal');
      cy.get('#edit button').click();
      cy.get('#edit').should('not.match', ':modal');
      cy.focused().should(([focused]) =>
        expect(focused).to.equal(Cypress.$('gui-button button')[0]),
      );
    });

    it('opens a menu, whose aria-haspopup reaches its inner button', () => {
      cy.mount(
        html`<gui-button
            id="actions"
            label="Actions"
            commandfor="row-actions"
            command="toggle-popover"
          ></gui-button>
          <gui-menu>
            <div id="row-actions" popover>
              <button type="button" value="edit">Edit</button>
            </div>
          </gui-menu>`,
      );

      button().should('have.attr', 'aria-haspopup', 'menu');
      button().click();
      cy.get('#row-actions').should('match', ':popover-open');
      cy.focused().should('have.attr', 'value', 'edit');
    });

    it('leaves commandfor off a link', () => {
      cy.mount(
        html`<gui-button
          label="Docs"
          href="#docs"
          commandfor="edit"
          command="show-modal"
        ></gui-button>`,
      );

      cy.get('gui-button a').should('not.have.attr', 'commandfor');
      cy.get('gui-button a').should('not.have.attr', 'command');
    });
  });

  describe('description', () => {
    it("passes a tooltip's description on to its inner button", () => {
      cy.mount(
        html`<gui-button id="save" label="Save"></gui-button>
          <gui-tooltip for="save">Saves without publishing</gui-tooltip>`,
      );

      cy.get('gui-tooltip').then(([tooltip]) => {
        button().should('have.attr', 'aria-describedby', tooltip.id);
        tooltip.remove();
        button().should('not.have.attr', 'aria-describedby');
      });
    });

    it('passes aria-describedby on to its inner link', () => {
      cy.mount(
        html`<gui-button label="Docs" href="#docs" aria-describedby="docs-hint"></gui-button>
          <p id="docs-hint">Opens in this tab</p>`,
      );

      cy.get('gui-button a').should('have.attr', 'aria-describedby', 'docs-hint');
    });
  });
});
