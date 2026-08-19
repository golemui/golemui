import { defineForm, identityTranslator } from '@golemui/core';
import { type MountComponentFn } from '../utils';

// Behavior tests for the gui-range-calendar web component: the standalone
// range calendar accumulating a DateRange[] value as pills. Add-flow tests use
// current-month relative dates so the day buttons are visible without
// hydrating a value first; the allowEdit tests hydrate fixed June 2026 ranges
// (the calendar navigates to the first range) for deterministic labels.
export const runRangeCalendarComponentTests = (mountFn: MountComponentFn) => {
  describe('RangeCalendar Component', () => {
    const cal = 'gui-range-calendar';
    const sel = {
      dayButton: (date: string) => `${cal} .gui-calendar__day-button[data-date="${date}"]`,
      pill: `${cal} .gui-pills__pill`,
      pillText: `${cal} .gui-pills__pill-text`,
      pillRemove: `${cal} .gui-pills__pill-remove`,
    };

    const now = new Date();
    const y = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const iso = (d: number) => `${y}-${mm}-${String(d).padStart(2, '0')}`;

    const mountCalendar = (options?: {
      data?: Record<string, any>;
      props?: Record<string, any>;
      formSubmit?: (event: any) => void;
      readonly?: boolean;
      disabled?: boolean;
    }) => {
      mountFn({
        localization: identityTranslator('en-US'),
        data: options?.data,
        formDef: defineForm({
          form: [
            {
              uid: 'testSubject',
              kind: 'input',
              type: 'rangeCalendar',
              path: 'myRanges',
              ...(options?.props ? { props: options.props } : {}),
              ...(options?.readonly !== undefined ? { readonly: options.readonly } : {}),
              ...(options?.disabled !== undefined ? { disabled: options.disabled } : {}),
            },
            {
              uid: 'submitBtn',
              kind: 'action',
              type: 'button',
              label: 'Submit',
              actionType: 'submit',
            },
          ],
        }),
        formSubmit: options?.formSubmit,
      });
    };

    const submitAndGetData = (formSubmitAlias: string) => {
      cy.get('[data-cy="submitBtn_button"]').click({ force: true });
      return cy.get(formSubmitAlias).then((stub: any) => stub.getCall(0).args[0].data);
    };

    describe('add flow', () => {
      it('should commit a two-click span as a pill with day highlights', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountCalendar({ formSubmit });

        cy.get(sel.dayButton(iso(13))).click();
        cy.get(sel.dayButton(iso(16))).click();

        cy.get(sel.pillText).should('have.length', 1);
        cy.get(sel.dayButton(iso(13))).should('have.class', 'range-start');
        cy.get(sel.dayButton(iso(14))).should('have.class', 'in-range');
        cy.get(sel.dayButton(iso(16))).should('have.class', 'range-end');

        submitAndGetData('@formSubmit').then((data) => {
          expect(data.myRanges).to.deep.equal([{ start: iso(13), end: iso(16) }]);
        });
      });

      it('should remove a range via its pill', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountCalendar({
          data: {
            myRanges: [
              { start: iso(13), end: iso(16) },
              { start: iso(20), end: iso(22) },
            ],
          },
          formSubmit,
        });

        cy.get(sel.pillText).should('have.length', 2);
        cy.get(sel.pillRemove).first().click();
        cy.get(sel.pillText).should('have.length', 1);

        submitAndGetData('@formSubmit').then((data) => {
          expect(data.myRanges).to.deep.equal([{ start: iso(20), end: iso(22) }]);
        });
      });
    });

    describe('allowEdit pill editing', () => {
      const uid = 'testSubject';
      const editableRanges = [
        { start: '2026-06-10', end: '2026-06-12' },
        { start: '2026-06-20', end: '2026-06-22' },
      ];
      const editSel = {
        selectedEditIcon: `.gui-pills__pill--selected [data-cy="${uid}_pill-edit"]`,
        confirmIcon: `[data-cy="${uid}_pill-edit-confirm"]`,
        cancelIcon: `[data-cy="${uid}_pill-edit-cancel"]`,
      };

      const mountEditable = (formSubmit?: (event: any) => void) =>
        mountCalendar({
          data: { myRanges: editableRanges },
          props: { allowEdit: true },
          formSubmit,
        });

      it('should mark the selected range by dimming the competing ranges', () => {
        mountEditable();

        // No selection: nothing is dimmed.
        cy.get(sel.dayButton('2026-06-20')).should('not.have.class', 'range-muted');

        cy.get(sel.pill).first().click();
        cy.get(sel.pill).first().should('have.attr', 'aria-pressed', 'true');
        cy.get(sel.dayButton('2026-06-10')).should('have.class', 'edit-selected');
        cy.get(sel.dayButton('2026-06-12')).should('have.class', 'edit-selected');
        // The selected range keeps its full treatment; the other recedes.
        cy.get(sel.dayButton('2026-06-10')).should('not.have.class', 'range-muted');
        cy.get(sel.dayButton('2026-06-20')).should('have.class', 'range-muted');
        cy.get(sel.dayButton('2026-06-22')).should('have.class', 'range-muted');

        // Keyboard navigation moves the selection, and the marking with it.
        cy.get(sel.pill).first().type('{rightarrow}');
        cy.get(sel.pill).eq(1).should('have.attr', 'aria-pressed', 'true');
        cy.get(sel.dayButton('2026-06-20')).should('not.have.class', 'range-muted');
        cy.get(sel.dayButton('2026-06-10')).should('have.class', 'range-muted');

        // Focus leaving the pills clears the selection and the marking.
        cy.get(sel.dayButton('2026-06-16')).focus();
        cy.get('.gui-pills__pill--selected').should('not.exist');
        cy.get('.gui-calendar__day-button.range-muted').should('not.exist');
      });

      it('should re-pick the span in place and commit the replacement on confirm', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountEditable(formSubmitHandler);

        cy.get(sel.pill).first().click();
        cy.get(editSel.selectedEditIcon).click();
        // Editing starts on the range's start day, ready for re-picking.
        cy.focused().should('have.attr', 'data-date', '2026-06-10');
        cy.get(sel.pill).first().should('have.class', 'gui-pills__pill--editing');

        // Two picks reshape the working span; nothing commits yet, and the
        // editing pill's label live-previews the re-picked span.
        cy.get(sel.dayButton('2026-06-08')).click();
        cy.get(sel.dayButton('2026-06-09')).click();
        cy.get(sel.pill).should('have.length', 2);
        cy.get(sel.pill).first().should('contain.text', '06/08/2026 - 06/09/2026');

        cy.get(editSel.confirmIcon).click();
        cy.get(sel.pill).should('have.length', 2);
        cy.get(sel.pill).first().should('not.have.class', 'gui-pills__pill--editing');
        cy.get(sel.pill).first().should('contain.text', '06/08/2026 - 06/09/2026');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data.myRanges).to.deep.equal([
            { start: '2026-06-08', end: '2026-06-09' },
            { start: '2026-06-20', end: '2026-06-22' },
          ]);
        });
      });

      it('should start editing with E and layer Escape: cancel, then deselect', () => {
        mountEditable();

        cy.get(sel.pill).first().click();
        cy.get(sel.pill).first().type('e');
        cy.get(sel.pill).first().should('have.class', 'gui-pills__pill--editing');

        // A half re-picked span is abandoned by the cancel.
        cy.get(sel.dayButton('2026-06-08')).click();
        cy.get(sel.dayButton('2026-06-09')).click();
        cy.get(sel.pill).first().should('contain.text', '06/08/2026 - 06/09/2026');

        // First Escape cancels the session; the label reverts, selection kept.
        cy.focused().type('{esc}');
        cy.get('.gui-pills__pill--editing').should('not.exist');
        cy.get(sel.pill).first().should('contain.text', '06/10/2026 - 06/12/2026');
        cy.get(sel.pill).first().should('have.attr', 'aria-pressed', 'true');

        // Second Escape clears the selection.
        cy.focused().type('{esc}');
        cy.get(sel.pill).first().should('have.attr', 'aria-pressed', 'false');
      });

      it('should treat a confirm without changes as a cancel', () => {
        mountEditable();

        cy.get(sel.pill).first().click();
        cy.get(editSel.selectedEditIcon).click();
        cy.get(editSel.confirmIcon).click();

        cy.get('.gui-pills__pill--editing').should('not.exist');
        cy.get(sel.pill).first().should('contain.text', '06/10/2026 - 06/12/2026');
        cy.get(sel.pill).first().should('have.attr', 'aria-pressed', 'true');
      });

      it('should merge an edited range into the neighbor it now touches', () => {
        mountEditable();

        cy.get(sel.pill).first().click();
        cy.get(editSel.selectedEditIcon).click();
        // Re-pick right up against the second range: 18–20 folds into 18–22.
        cy.get(sel.dayButton('2026-06-18')).click();
        cy.get(sel.dayButton('2026-06-20')).click();
        cy.get(editSel.confirmIcon).click();

        cy.get(sel.pill).should('have.length', 1);
        cy.get(sel.pill).first().should('contain.text', '06/18/2026 - 06/22/2026');
      });

      it('should commit a changed span when focus leaves the calendar', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountEditable(formSubmitHandler);

        cy.get(sel.pill).first().click();
        cy.get(editSel.selectedEditIcon).click();
        cy.get(sel.dayButton('2026-06-08')).click();
        cy.get(sel.dayButton('2026-06-09')).click();

        // Leaving is as deliberate as Confirm for a complete re-picked span.
        cy.get('[data-cy="submitBtn_button"]').focus();
        cy.get('.gui-pills__pill--editing').should('not.exist');
        cy.get(sel.pill).first().should('contain.text', '06/08/2026 - 06/09/2026');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data.myRanges).to.deep.equal([
            { start: '2026-06-08', end: '2026-06-09' },
            { start: '2026-06-20', end: '2026-06-22' },
          ]);
        });
      });

      it('should keep a rejected re-pick out of the value and the session open', () => {
        mountCalendar({
          data: { myRanges: editableRanges },
          props: { allowEdit: true, disabledRanges: [{ start: '2026-06-05' }] },
        });

        cy.get(sel.pill).first().click();
        cy.get(editSel.selectedEditIcon).click();
        // The re-picked span steps over the disabled day 5 → rejected in place.
        cy.get(sel.dayButton('2026-06-04')).click();
        cy.get(sel.dayButton('2026-06-06')).click();

        cy.get(sel.dayButton('2026-06-04')).should('have.class', 'invalid-range-start');
        cy.get(sel.pill).should('have.length', 2);
        cy.get(sel.pill).first().should('have.class', 'gui-pills__pill--editing');

        // Cancelling recovers the original range untouched.
        cy.focused().type('{esc}');
        cy.get('.gui-pills__pill--editing').should('not.exist');
        cy.get(sel.pill).first().should('contain.text', '06/10/2026 - 06/12/2026');
      });

      it('should keep pills plain when allowEdit is off', () => {
        mountCalendar({ data: { myRanges: editableRanges } });

        cy.get(sel.pill).first().click();
        cy.get(sel.pill).first().should('not.have.attr', 'aria-pressed');
        cy.get(`[data-cy="${uid}_pill-edit"]`).should('not.exist');
      });
    });
  });
};
