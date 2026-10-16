import { html, type TemplateResult } from 'lit';
import { GUIAnchorController } from '../../src/lib/controllers/anchor.controller';
import { options } from '../support/elements';

// The panels of the pickers and the dropdowns must show whole wherever their field sits: in a
// container that clips its overflow, in a modal dialog, in a drawer that slides in with a
// transform. They show in the top layer, placed under their field.

const fields: Record<string, { field: TemplateResult; toggle: string }> = {
  'gui-date-picker': {
    field: html`<gui-date-picker label="Start"></gui-date-picker>`,
    toggle: '.gui-date-picker__arrow',
  },
  'gui-dropdown': {
    field: html`<gui-dropdown label="Plan" .items=${options}></gui-dropdown>`,
    toggle: '.gui-dropdown__arrow',
  },
};

// Each one holds the field near its bottom edge, where the panel overflows it. The dialogs focus a
// close button first: a date picker opens when its field takes focus.
const containers: Record<string, { mount: (field: TemplateResult) => void }> = {
  'a box that clips its overflow': {
    mount: (field) =>
      cy.mount(
        html`<div style="overflow: hidden; block-size: 140px; padding-block-start: 60px">
          ${field}
        </div>`,
      ),
  },
  'a modal dialog': {
    mount: (field) => {
      cy.mount(
        html`<dialog id="clipping-dialog" aria-label="Edit" style="inline-size: 360px">
          <button type="button" autofocus>Close</button>
          ${field}
        </dialog>`,
      );
      cy.get<HTMLDialogElement>('#clipping-dialog').then(([dialog]) => dialog.showModal());
    },
  },
  'a drawer that slides in with a transform': {
    mount: (field) => {
      cy.mount(
        html`<dialog
          id="clipping-drawer"
          aria-label="Edit"
          style="margin: 0 0 0 auto; inline-size: 360px; block-size: 100%; max-block-size: none; transform: translateX(0); overflow: hidden"
        >
          <button type="button" autofocus>Close</button>
          <div style="block-size: calc(100vh - 160px)"></div>
          ${field}
        </dialog>`,
      );
      cy.get<HTMLDialogElement>('#clipping-drawer').then(([dialog]) => dialog.showModal());
    },
  },
};

describe('picker panels and their containers', () => {
  for (const [tag, { field, toggle }] of Object.entries(fields)) {
    for (const [name, container] of Object.entries(containers)) {
      it(`shows the whole panel of a ${tag} in ${name}`, () => {
        container.mount(field);

        cy.get(`${tag} ${toggle}`).click();
        cy.get(`${tag} .gui-picker__panel`).should(([panel]) => {
          const { x, width, bottom } = panel.getBoundingClientRect();
          // The middle of its last row of pixels is the panel's own, not what lies under it.
          const under = panel.ownerDocument.elementFromPoint(x + width / 2, bottom - 2);
          expect(panel.contains(under), 'the bottom edge of the panel shows').to.equal(true);
        });
      });
    }
  }
});

const dropdown = html`<gui-dropdown label="Plan" .items=${options}></gui-dropdown>`;
const panelOf = (tag: string) => cy.get(`${tag} .gui-picker__panel`);
const fieldOf = (tag: string) => cy.get(`${tag} > .gui-widget`);

/** Waits until the panel is open in the top layer, then yields both boxes. */
const boxes = (tag: string, check: (field: DOMRect, panel: DOMRect) => void) =>
  fieldOf(tag).then(([field]) =>
    panelOf(tag).should(([panel]) => {
      expect(panel.matches(':popover-open'), 'in the top layer').to.equal(true);
      check(field.getBoundingClientRect(), panel.getBoundingClientRect());
    }),
  );

describe('picker panels in the top layer', () => {
  for (const fallback of [false, true]) {
    describe(fallback ? 'measuring' : 'with CSS anchor positioning', () => {
      beforeEach(() => {
        GUIAnchorController.forceFallback = fallback;
      });

      afterEach(() => {
        GUIAnchorController.forceFallback = false;
      });

      it("opens a dropdown's panel under its field, as wide as the field", () => {
        cy.mount(html`<div style="inline-size: 320px">${dropdown}</div>`);

        cy.get('gui-dropdown .gui-dropdown__arrow').click();
        boxes('gui-dropdown', (field, panel) => {
          expect(panel.top).to.be.closeTo(field.bottom + 2, 1);
          expect(panel.left).to.be.closeTo(field.left, 1);
          expect(panel.width).to.be.closeTo(field.width, 1);
        });
      });

      it('opens a picker above its field when there is no room below', () => {
        cy.mount(
          html`<div
            style="position: fixed; inset-block-end: 8px; inset-inline-start: 8px; inline-size: 320px"
          >
            <gui-date-picker label="Start"></gui-date-picker>
          </div>`,
        );

        cy.get('gui-date-picker .gui-date-picker__arrow').click();
        boxes('gui-date-picker', (field, panel) => {
          expect(panel.bottom).to.be.closeTo(field.top - 2, 1);
        });
      });

      it('lines the panel up with the end of its field in right to left', () => {
        cy.mount(html`<div dir="rtl" style="inline-size: 320px">${dropdown}</div>`);

        cy.get('gui-dropdown .gui-dropdown__arrow').click();
        boxes('gui-dropdown', (field, panel) => {
          expect(panel.right).to.be.closeTo(field.right, 1);
        });
      });
    });
  }

  it('leaves the list of a time picker in a date-time calendar inline', () => {
    cy.mount(html`<gui-date-time-calendar label="Start"></gui-date-time-calendar>`);

    cy.get('gui-date-time-calendar gui-time-picker .gui-picker__panel').should(([panel]) => {
      expect(panel.hasAttribute('popover')).to.equal(false);
    });
  });

  it("closes a picker's panel with the field, and leaves the top layer", () => {
    cy.mount(dropdown);

    cy.get('gui-dropdown .gui-dropdown__arrow').click();
    panelOf('gui-dropdown').should('match', ':popover-open');
    cy.get('gui-dropdown .gui-dropdown__arrow').click();
    panelOf('gui-dropdown').should('not.match', ':popover-open').and('have.attr', 'hidden');
  });

  it('keeps a popover open while the user picks in a picker inside it', () => {
    cy.mount(
      html`<button type="button" popovertarget="filters">Filters</button>
        <gui-popover>
          <div id="filters" popover>${dropdown}</div>
        </gui-popover>`,
    );

    cy.get('button[popovertarget="filters"]').click();
    cy.get('gui-dropdown .gui-dropdown__arrow').click();
    panelOf('gui-dropdown').should('match', ':popover-open');
    cy.get('gui-dropdown [role="option"]').first().click();
    cy.get('#filters').should('match', ':popover-open');
    cy.get('gui-dropdown').should('have.prop', 'value', 'red');
  });

  it("scrolls the pills' overflow list when it holds more than fits", () => {
    const items = Array.from({ length: 12 }, (_, index) => ({
      key: `${index}`,
      label: `Pill ${index + 1}`,
    }));
    cy.mount(
      html`<div
        style="container-type: inline-size; container-name: gui-pills-widget; position: relative; width: 200px"
      >
        <gui-pills .items=${items}></gui-pills>
      </div>`,
    );

    cy.get('gui-pills .gui-pills__count').click();
    cy.get('gui-pills .gui-pills__dropdown-list').should(([list]) => {
      const last = list.lastElementChild as HTMLElement;
      const { x, y, width, height } = last.getBoundingClientRect();
      // Out of the list's view, so clipped: the point shows what is under the card, not the pill.
      const shown = list.ownerDocument.elementFromPoint(x + width / 2, y + height / 2);
      expect(last.contains(shown), 'the last pill shows outside the list').to.equal(false);
      list.scrollTop = list.scrollHeight;
    });
    cy.get('gui-pills .gui-pills__dropdown-list').should(([list]) => {
      const last = list.lastElementChild as HTMLElement;
      const { x, y, width, height } = last.getBoundingClientRect();
      const shown = list.ownerDocument.elementFromPoint(x + width / 2, y + height / 2);
      expect(last.contains(shown), 'the last pill shows once scrolled to').to.equal(true);
    });
  });

  it("floats the pills' overflow list under their wrapper, as wide as it", () => {
    const items = ['Alpha', 'Beta', 'Gamma', 'Delta'].map((label) => ({ key: label, label }));
    cy.mount(
      html`<div
        id="wrapper"
        style="container-type: inline-size; container-name: gui-pills-widget; position: relative; width: 200px; overflow: hidden"
      >
        <gui-pills .items=${items}></gui-pills>
      </div>`,
    );

    cy.get('gui-pills .gui-pills__count').click();
    cy.get('#wrapper').then(([wrapper]) =>
      cy.get('gui-pills .gui-pills__dropdown').should(([list]) => {
        expect(list.matches(':popover-open'), 'in the top layer').to.equal(true);
        const field = wrapper.getBoundingClientRect();
        const box = list.getBoundingClientRect();
        expect(box.top).to.be.closeTo(field.bottom + 4, 1);
        expect(box.width).to.be.closeTo(field.width, 1);
      }),
    );
  });
});
