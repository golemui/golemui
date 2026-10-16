import { html, type TemplateResult } from 'lit';
import { options } from '../support/elements';

// The panels of the pickers and the dropdowns must show whole wherever their field sits: today
// they are `position: absolute` inside the field, so a container that clips its overflow, a modal
// dialog or a transformed drawer cuts them off. Moving them to the top layer (M3 of the components
// plan) fixes it; until then this spec is skipped. Run it with `.only` to see it fail.

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

describe.skip('picker panels and their containers (enabled by M3)', () => {
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
