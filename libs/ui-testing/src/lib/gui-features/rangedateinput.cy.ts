import { defineForm, identityTranslator } from '@golemui/core';
import { type MountComponentFn } from '../utils';

// Characterization tests for the current gui-range-date behavior. They pin the
// exact interaction model (cross-group auto-advance and arrow navigation,
// transient clamping without write-back, pill creation/swap/merge, no null
// emit on empty blur) so refactors of the input internals must not change it.
export const runRangeDateInputComponentTests = (mountFn: MountComponentFn) => {
  describe('RangeDateInput Component', () => {
    const uid = 'testSubject';
    const sel = {
      start: {
        day: 'gui-range-date input[data-group="start"][data-type="day"]',
        month: 'gui-range-date input[data-group="start"][data-type="month"]',
        year: 'gui-range-date input[data-group="start"][data-type="year"]',
      },
      end: {
        day: 'gui-range-date input[data-group="end"][data-type="day"]',
        month: 'gui-range-date input[data-group="end"][data-type="month"]',
        year: 'gui-range-date input[data-group="end"][data-type="year"]',
      },
      pillText: 'gui-range-date .gui-pills__pill-text',
      pillRemove: 'gui-range-date .gui-pills__pill-remove',
    };

    const mountRangeDateInput = (options?: {
      data?: Record<string, any>;
      lang?: string;
      props?: Record<string, any>;
      formSubmit?: (event: any) => void;
      readonly?: boolean;
      disabled?: boolean;
    }) => {
      mountFn({
        localization: identityTranslator(options?.lang ?? 'en-US'),
        data: options?.data,
        formDef: defineForm({
          form: [
            {
              uid,
              kind: 'input',
              type: 'rangeDateInput',
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
      cy.get('[data-cy="submitBtn_button"]').click();
      return cy.get(formSubmitAlias).then((stub: any) => stub.getCall(0).args[0].data);
    };

    const typeDate = (group: 'start' | 'end', month: string, day: string, year: string) => {
      cy.get(sel[group].month).click();
      cy.focused().type(month);
      cy.focused().type(day);
      cy.focused().type(year);
    };

    describe('rendering', () => {
      it('should render two groups in locale part order', () => {
        mountRangeDateInput();

        // en-US orders parts month/day/year within each group
        cy.get('gui-range-date input').should(($inputs) => {
          const parts = $inputs
            .toArray()
            .map((el) => `${el.getAttribute('data-group')}-${el.getAttribute('data-type')}`);
          expect(parts).to.deep.equal([
            'start-month',
            'start-day',
            'start-year',
            'end-month',
            'end-day',
            'end-year',
          ]);
        });
      });
    });

    describe('auto-advance', () => {
      it('should advance from the last start part into the first end part', () => {
        mountRangeDateInput();

        cy.get(sel.start.month).type('06');
        cy.focused().should('have.attr', 'data-type', 'day');
        cy.focused().type('15');
        cy.focused().should('have.attr', 'data-type', 'year');
        cy.focused().type('2026');

        cy.focused().should('have.attr', 'data-group', 'end');
        cy.focused().should('have.attr', 'data-type', 'month');
      });

      it('should NOT wrap after the last end part is filled', () => {
        mountRangeDateInput();

        cy.get(sel.end.year).type('2026');
        cy.focused().should('have.attr', 'data-group', 'end');
        cy.focused().should('have.attr', 'data-type', 'year');
      });
    });

    describe('pill creation', () => {
      it('should create a pill on Enter, clear the inputs and submit the range', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountRangeDateInput({ formSubmit: formSubmitHandler });

        typeDate('start', '06', '15', '2026');
        typeDate('end', '06', '18', '2026');
        cy.focused().type('{enter}');

        cy.get(sel.pillText).should('contain.text', '06/15/2026 - 06/18/2026');
        cy.get(sel.start.month).should('have.value', '');
        cy.get(sel.end.year).should('have.value', '');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({
            myRanges: [{ start: '2026-06-15', end: '2026-06-18' }],
          });
        });
      });

      it('should create a start-only range when start and end are the same day', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountRangeDateInput({ formSubmit: formSubmitHandler });

        typeDate('start', '06', '15', '2026');
        typeDate('end', '06', '15', '2026');
        cy.focused().type('{enter}');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myRanges: [{ start: '2026-06-15' }] });
        });
      });

      it('should swap start and end when end is before start', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountRangeDateInput({ formSubmit: formSubmitHandler });

        typeDate('start', '06', '18', '2026');
        typeDate('end', '06', '15', '2026');
        cy.focused().type('{enter}');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({
            myRanges: [{ start: '2026-06-15', end: '2026-06-18' }],
          });
        });
      });

      it('should merge overlapping ranges', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountRangeDateInput({
          data: { myRanges: [{ start: '2026-06-10', end: '2026-06-16' }] },
          formSubmit: formSubmitHandler,
        });

        typeDate('start', '06', '15', '2026');
        typeDate('end', '06', '20', '2026');
        cy.focused().type('{enter}');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({
            myRanges: [{ start: '2026-06-10', end: '2026-06-20' }],
          });
        });
      });
    });

    describe('pills', () => {
      it('should remove a pill and emit the updated value', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountRangeDateInput({
          data: { myRanges: [{ start: '2026-06-10', end: '2026-06-16' }] },
          formSubmit: formSubmitHandler,
        });

        cy.get(sel.pillText).should('contain.text', '06/10/2026 - 06/16/2026');
        // force: gui-pills may collapse to compact mode in narrow harnesses
        cy.get(sel.pillRemove).click({ force: true });
        cy.get(sel.pillText).should('not.exist');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myRanges: [] });
        });
      });

      it('should emit pillClick when a pill is clicked', () => {
        mountRangeDateInput({
          data: { myRanges: [{ start: '2026-06-10', end: '2026-06-16' }] },
        });

        const pillClickSpy = cy.spy().as('pillClickSpy');
        cy.get('gui-range-date').then(($el) => {
          $el[0].addEventListener('pillClick', pillClickSpy as unknown as EventListener);
        });

        // force: gui-pills may collapse to compact mode in narrow harnesses
        cy.get(sel.pillText).click({ force: true });
        cy.get('@pillClickSpy').should('have.been.calledOnce');
      });
    });

    describe('clamping', () => {
      it('should clamp an out-of-range typed value in place, matching gui-date', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountRangeDateInput({ formSubmit: formSubmitHandler });

        typeDate('start', '07', '35', '2026');
        // Consistent with gui-date / gui-date-time: the typed day 35 is clamped
        // to the month maximum (31) in place, not left visible until commit.
        cy.get(sel.start.day).should('have.value', '31');

        typeDate('end', '08', '02', '2026');
        cy.focused().type('{enter}');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({
            myRanges: [{ start: '2026-07-31', end: '2026-08-02' }],
          });
        });
      });

      it('should emit inputError and create no pill for a complete but invalid date (Feb 31)', () => {
        // Unlike gui-date, the injected error is not displayed (the wrapper never
        // marks the field touched), so we pin the inputError event itself.
        mountRangeDateInput();

        const inputErrorSpy = cy.spy().as('inputErrorSpy');
        cy.get('gui-range-date').then(($el) => {
          $el[0].addEventListener('inputError', inputErrorSpy as unknown as EventListener);
        });

        typeDate('start', '02', '31', '2026');

        // Quiet until the user attempts a commit.
        cy.get('@inputErrorSpy').should('not.have.been.called');

        cy.focused().type('{enter}');
        cy.get('@inputErrorSpy').should('have.been.called');
        cy.get(sel.pillText).should('not.exist');
      });

      it('should clear a group error once its invalid date is corrected, before the range completes', () => {
        mountRangeDateInput({ props: { invalidDateMessage: 'Invalid date' } });

        // Feb 30 in the start group, committed with Enter → invalid-date error.
        typeDate('start', '02', '30', '2026');
        cy.focused().type('{enter}');
        // Submitting marks the form touched so the injected error renders.
        cy.get('[data-cy="submitBtn_button"]').click({ force: true });
        cy.get('[data-cy="testSubject_validator-error"]')
          .should('be.visible')
          .and('contain', 'Invalid date');

        // Correct just the start day to 28 (valid); the end is still empty, but
        // the completed-and-valid start must clear its error on its own.
        cy.get(sel.start.day).click();
        cy.focused().type('{selectall}28', { force: true });
        cy.get(sel.end.month).click();

        cy.get('[data-cy="testSubject_validator-error"]').should('not.exist');
        cy.get(sel.pillText).should('not.exist');
      });

      it('should clamp an ArrowDown spinner at the minimum instead of going negative', () => {
        mountRangeDateInput();

        // ArrowDown on an empty month seeds the increment fallback (01); a
        // further ArrowDown must clamp at the month minimum, never step to 0/-1.
        cy.get(sel.start.month).type('{downArrow}{downArrow}{downArrow}');
        cy.get(sel.start.month).should('have.value', '01');

        cy.get(sel.start.day).type('{downArrow}{downArrow}{downArrow}');
        cy.get(sel.start.day).should('have.value', '01');
      });
    });

    describe('arrow left/right navigation', () => {
      it('should cross the group boundary in LTR', () => {
        mountRangeDateInput();

        cy.get(sel.start.year).click();
        cy.focused().type('{rightArrow}');
        cy.focused().should('have.attr', 'data-group', 'end');
        cy.focused().should('have.attr', 'data-type', 'month');

        cy.focused().type('{leftArrow}');
        cy.focused().should('have.attr', 'data-group', 'start');
        cy.focused().should('have.attr', 'data-type', 'year');
      });

      it('should flip navigation and cross groups in RTL', () => {
        mountRangeDateInput({ lang: 'ar' });

        cy.get('form').should('have.attr', 'dir', 'rtl');

        // ar orders parts day/month/year; ArrowLeft moves to the NEXT DOM input
        cy.get(sel.start.day).click();
        cy.focused().type('{leftArrow}');
        cy.focused().should('have.attr', 'data-group', 'start');
        cy.focused().should('have.attr', 'data-type', 'month');

        // ArrowLeft from the last start part jumps to the LAST end part
        cy.get(sel.start.year).click();
        cy.focused().type('{leftArrow}');
        cy.focused().should('have.attr', 'data-group', 'end');
        cy.focused().should('have.attr', 'data-type', 'year');

        // ArrowRight from the first end part jumps to the FIRST start part
        cy.get(sel.end.day).click();
        cy.focused().type('{rightArrow}');
        cy.focused().should('have.attr', 'data-group', 'start');
        cy.focused().should('have.attr', 'data-type', 'day');
      });
    });

    describe('blur', () => {
      it('should keep a single digit part on blur (optionally padded)', () => {
        // Same framework-dependent cosmetic pad as gui-date: see dateinput.cy.ts.
        mountRangeDateInput();

        cy.get(sel.start.day).type('9');
        cy.get(sel.start.day).blur();
        cy.get(sel.start.day).invoke('val').should('match', /^0?9$/);
      });

      it('should NOT emit a null value when a part is blurred empty', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountRangeDateInput({
          data: { myRanges: [{ start: '2026-06-10', end: '2026-06-16' }] },
          formSubmit: formSubmitHandler,
        });

        cy.get(sel.start.day).click();
        cy.get(sel.start.day).blur();

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({
            myRanges: [{ start: '2026-06-10', end: '2026-06-16' }],
          });
        });
      });
    });

    describe('readonly and disabled', () => {
      it('should ignore typing and arrows when readonly', () => {
        mountRangeDateInput({
          data: { myRanges: [] },
          readonly: true,
        });

        cy.get(sel.start.day).should('have.attr', 'readonly');
        cy.get(sel.start.day).type('{upArrow}', { force: true });
        cy.get(sel.start.day).should('have.value', '');
      });

      it('should render disabled inputs when disabled', () => {
        mountRangeDateInput({ disabled: true });

        cy.get(sel.start.day).should('be.disabled');
        cy.get(sel.end.year).should('be.disabled');
      });
    });

    describe('pills accessibility', () => {
      const juneRange = { start: '2026-06-10', end: '2026-06-16' };

      it('should expose the strip as a labeled toolbar of named pill buttons', () => {
        mountRangeDateInput({ data: { myRanges: [juneRange] } });

        cy.get('.gui-pills__strip')
          .should('have.attr', 'role', 'toolbar')
          .should('have.attr', 'aria-label', 'Selected date ranges');

        // A real button, named by the range itself; the remove hint travels
        // as the description instead of polluting the accessible name
        cy.get('button.gui-pills__pill')
          .should('have.attr', 'aria-label', '06/10/2026 - 06/16/2026')
          .should('have.attr', 'aria-description', 'Remove date');
        cy.get('.gui-pills__pill-remove').should('have.attr', 'aria-hidden', 'true');
      });

      it('should wire the count bubble to the dropdown toolbar', () => {
        mountRangeDateInput({ data: { myRanges: [juneRange] } });

        cy.get('.gui-pills__count')
          .should('have.attr', 'aria-haspopup', 'true')
          .should('have.attr', 'aria-expanded', 'false')
          .should('have.attr', 'aria-controls', 'testSubject_pills_dropdown');

        cy.get('.gui-pills__count').click({ force: true });
        cy.get('#testSubject_pills_dropdown')
          .should('have.attr', 'role', 'toolbar')
          .should('have.attr', 'aria-orientation', 'vertical');
        cy.get('.gui-pills__count').should('have.attr', 'aria-expanded', 'true');
      });

      it('should natively disable pill buttons when the widget is disabled', () => {
        mountRangeDateInput({ data: { myRanges: [juneRange] }, disabled: true });
        cy.get('button.gui-pills__pill').should('be.disabled');
      });
    });
  });
};
