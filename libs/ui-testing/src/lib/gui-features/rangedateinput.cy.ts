import { defineForm, identityTranslator } from '@golemui/core';
import {
  clearPillsWidthOverride,
  forcePillsCompactMode,
  forcePillsStripMode,
  type MountComponentFn,
} from '../utils';

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
      validator?: Record<string, any>;
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
              ...(options?.validator ? { validator: options.validator as any } : {}),
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

      it('should NOT advance into the end group when its first part is filled', () => {
        mountRangeDateInput();

        cy.get(sel.end.month).type('07');
        cy.get(sel.start.year).type('2026');
        cy.focused().should('have.attr', 'data-group', 'start');
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

    describe('focus leave', () => {
      it('should commit a complete typed range when focus leaves, without Enter', () => {
        mountRangeDateInput();

        typeDate('start', '06', '10', '2026');
        typeDate('end', '06', '16', '2026');
        cy.get(sel.pillText).should('not.exist');

        // Leaving acts as Enter: a range the user finished is not abandoned
        // work, and making them press a key to keep it loses it silently.
        cy.get('[data-cy="submitBtn_button"]').focus();
        cy.get(sel.pillText).should('have.length', 1).and('contain', '06/10/2026');
        cy.get(sel.start.month).should('have.value', '');
      });

      it('should not steal focus back when the leave creates the pill', () => {
        mountRangeDateInput();

        typeDate('start', '06', '10', '2026');
        typeDate('end', '06', '16', '2026');
        cy.get('[data-cy="submitBtn_button"]').focus();

        // Enter refocuses the start field, ready for the next range. Leaving
        // must not — that would drag the user back into the control.
        cy.get(sel.pillText).should('have.length', 1);
        cy.focused().should('have.attr', 'data-cy', 'submitBtn_button');
      });

      it('should include a range committed by the click that submits the form', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountRangeDateInput({ formSubmit: formSubmitHandler });

        typeDate('start', '06', '10', '2026');
        typeDate('end', '06', '16', '2026');

        // One click both leaves the widget and submits. The leave has to settle
        // before the form reads its data, or the range is missing from it.
        submitAndGetData('@formSubmitHandler').then((data: any) => {
          expect(data).to.deep.equal({ myRanges: [{ start: '2026-06-10', end: '2026-06-16' }] });
        });
      });

      it('should not validate while moving between the parts of one endpoint', () => {
        // Filling a part auto-advances to the next one. That hop is not
        // leaving the widget, so the form must not judge a half-typed entry:
        // a required field lighting up after the first part is the bug.
        mountRangeDateInput({ validator: { type: 'array', required: true } });

        cy.get(sel.start.month).type('06');
        cy.get(`[data-cy="${uid}_validator-errors"]`).should('not.exist');
        cy.focused().type('15');
        cy.get(`[data-cy="${uid}_validator-errors"]`).should('not.exist');

        // Leaving the widget is the one moment the entry is judged
        cy.get('[data-cy="submitBtn_button"]').focus();
        cy.get(`[data-cy="${uid}_validator-errors"]`).should('exist');
      });

      it('should report an incomplete range when only one endpoint was filled', () => {
        // A whole endpoint typed with the other left empty is as unfinished as
        // a half-typed one: the range never became a pill.
        mountRangeDateInput();

        typeDate('start', '06', '10', '2026');
        cy.get('[data-cy="submitBtn_button"]').focus();

        cy.get(`[data-cy="${uid}_validator-error"]`).should('contain.text', 'Incomplete date');
      });

      it('should clear the incomplete error once the range is completed', () => {
        mountRangeDateInput();

        typeDate('start', '06', '10', '2026');
        cy.get('[data-cy="submitBtn_button"]').focus();
        cy.get(`[data-cy="${uid}_validator-error"]`).should('contain.text', 'Incomplete date');

        typeDate('end', '06', '16', '2026');
        cy.focused().type('{enter}');
        cy.get(`[data-cy="${uid}_validator-error"]`).should('not.exist');
        cy.get(sel.pillText).should('have.length', 1);
      });

      it('should clear the incomplete error when the emptied endpoint is left again', () => {
        // Regression: leave one endpoint behind (incomplete error), come
        // back, empty its fields and leave again — the error must not
        // outlive fields that no longer hold anything.
        mountRangeDateInput();

        typeDate('start', '06', '10', '2026');
        cy.get('[data-cy="submitBtn_button"]').focus();
        cy.get(`[data-cy="${uid}_validator-error"]`).should('contain.text', 'Incomplete date');

        cy.get(sel.start.month).type('{selectAll}{backspace}');
        cy.get(sel.start.day).type('{selectAll}{backspace}');
        cy.get(sel.start.year).type('{selectAll}{backspace}');
        cy.get('[data-cy="submitBtn_button"]').focus();
        cy.get(`[data-cy="${uid}_validator-errors"]`).should('not.exist');
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

        // The widget is a single tab stop: pills are reachable via ArrowLeft
        // from the segments, not via Tab
        cy.get('button.gui-pills__pill').should('have.attr', 'tabindex', '-1');
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

    describe('pill keyboard navigation', () => {
      // Given unsorted, displayed sorted by start: March first, June last
      const juneRange = { start: '2026-06-10', end: '2026-06-16' };
      const marchRange = { start: '2026-03-05', end: '2026-03-08' };
      const juneLabel = '06/10/2026 - 06/16/2026';
      const marchLabel = '03/05/2026 - 03/08/2026';

      const mountWithRanges = () =>
        mountRangeDateInput({ data: { myRanges: [juneRange, marchRange] } });

      // These pin the strip-mode model, so hold the wrapper above the compact
      // threshold; the harness would otherwise collapse it to the bubble.
      // Dropdown tests below re-pin it to compact explicitly.
      beforeEach(() => forcePillsStripMode('.gui-range-date-input'));
      afterEach(clearPillsWidthOverride);

      it('should enter the strip at the LAST pill on ArrowLeft from the first segment', () => {
        mountWithRanges();

        cy.get(sel.start.month).focus();
        cy.focused().type('{leftArrow}');
        cy.focused()
          .should('have.class', 'gui-pills__pill')
          .should('have.attr', 'aria-label', juneLabel);
      });

      it('should walk pills with arrows and jump with Home/End, stopping at the first pill', () => {
        mountWithRanges();

        cy.get(sel.start.month).focus();
        cy.focused().type('{leftArrow}');
        cy.focused().type('{leftArrow}');
        cy.focused().should('have.attr', 'aria-label', marchLabel);

        // ArrowLeft at the first pill parks: focus stays put
        cy.focused().type('{leftArrow}');
        cy.focused().should('have.attr', 'aria-label', marchLabel);

        cy.focused().type('{end}');
        cy.focused().should('have.attr', 'aria-label', juneLabel);
        cy.focused().type('{home}');
        cy.focused().should('have.attr', 'aria-label', marchLabel);
      });

      it('should return focus to the first start segment on ArrowRight past the last pill', () => {
        mountWithRanges();

        cy.get(sel.start.month).focus();
        cy.focused().type('{leftArrow}');
        cy.focused().should('have.attr', 'aria-label', juneLabel);

        cy.focused().type('{rightArrow}');
        cy.focused()
          .should('have.attr', 'data-group', 'start')
          .should('have.attr', 'data-type', 'month');
      });

      it('should ignore the stray keyup that lands on the segment after the pill handoff', () => {
        // Pills hand focus over on keydown while segments navigate on keyup:
        // the released ArrowRight must not advance a second segment.
        mountWithRanges();

        cy.get(sel.start.month).focus();
        cy.focused().type('{leftArrow}');
        cy.focused().should('have.attr', 'aria-label', juneLabel);

        cy.focused().trigger('keydown', {
          key: 'ArrowRight',
          eventConstructor: 'KeyboardEvent',
        });
        cy.focused().should('have.attr', 'data-type', 'month');
        cy.focused().trigger('keyup', { key: 'ArrowRight', eventConstructor: 'KeyboardEvent' });
        cy.focused().should('have.attr', 'data-type', 'month');
      });

      it('should hand focus to the next pill on Delete, then to the segments when emptied', () => {
        mountWithRanges();

        cy.get(sel.start.month).focus();
        cy.focused().type('{leftArrow}');
        cy.focused().should('have.attr', 'aria-label', juneLabel);

        // Deleting the last pill slides focus onto the pill that took its place
        cy.focused().type('{del}');
        cy.get(sel.pillText).should('have.length', 1);
        cy.focused().should('have.attr', 'aria-label', marchLabel);

        // Deleting the final pill returns focus to the segments
        cy.focused().type('{del}');
        cy.get(sel.pillText).should('have.length', 0);
        cy.focused().should('have.attr', 'data-group', 'start');
      });

      it('should emit pillClick on Enter now that pills are keyboard-only reachable', () => {
        mountWithRanges();

        cy.get('gui-range-date').then(($el) => {
          $el[0].addEventListener('pillClick', cy.stub().as('pillClickHandler'));
        });

        cy.get(sel.start.month).focus();
        cy.focused().type('{leftArrow}');
        cy.focused().type('{enter}');
        cy.get('@pillClickHandler').should('have.been.called');
      });

      it('should close the dropdown on Escape and return focus to the segments', () => {
        forcePillsCompactMode('.gui-range-date-input');
        mountWithRanges();

        cy.get('.gui-pills__count').click();
        cy.get('.gui-pills__dropdown button.gui-pills__pill').first().focus();
        cy.focused().type('{downArrow}');
        cy.focused().should('have.attr', 'aria-label', juneLabel);

        cy.focused().type('{esc}');
        cy.get('.gui-pills__dropdown').should('not.exist');
        cy.focused()
          .should('have.attr', 'data-group', 'start')
          .should('have.attr', 'data-type', 'month');
      });

      it('should focus (not delete) the last pill on Backspace when the segments are empty', () => {
        mountWithRanges();

        cy.get(sel.start.month).focus();
        cy.focused().type('{backspace}');
        cy.focused()
          .should('have.class', 'gui-pills__pill')
          .should('have.attr', 'aria-label', juneLabel);
        cy.get(sel.pillText).should('have.length', 2);
      });

      it('should keep Backspace editing while any segment holds content', () => {
        mountWithRanges();

        // Month fills and auto-advances to the empty day; Backspace there
        // must not jump into the pills while the range is half-typed.
        cy.get(sel.start.month).type('06');
        cy.focused().should('have.attr', 'data-type', 'day');
        cy.focused().type('{backspace}');
        cy.focused().should('have.attr', 'data-type', 'day');
        cy.get(sel.pillText).should('have.length', 2);
      });
    });

    describe('pills dropdown errors and error border', () => {
      const juneRange = { start: '2026-06-10', end: '2026-06-16' };

      it('should repeat the field error inside the open pills dropdown with the red border', () => {
        mountRangeDateInput({ data: { myRanges: [juneRange] } });

        // Leave a half-typed second range behind → incomplete error, pill kept
        cy.get(sel.start.month).click();
        cy.focused().type('06');
        cy.get('[data-cy="submitBtn_button"]').focus();
        cy.get(`[data-cy="${uid}_validator-error"]`).should('contain.text', 'Incomplete date');

        cy.get('.gui-pills__count').click({ force: true });
        cy.get(`[data-cy="${uid}_pills-validator-error"]`)
          .should('be.visible')
          .and('contain.text', 'Incomplete date');

        // The dropdown copy is decorative: hidden from AT with its own id;
        // the field copy stays the aria-errormessage target
        cy.get(`#${uid}_pills_errors`)
          .should('have.attr', 'aria-hidden', 'true')
          .and('not.have.attr', 'role');
        cy.get(`[id="${uid}_errors"]`).should('have.length', 1);

        // Invalid field → the dropdown shares the red border
        cy.get(`[data-cy="${uid}_validator-error"]`).then(($li) => {
          cy.get('.gui-pills__dropdown').should('have.css', 'border-top-color', $li.css('color'));
        });
      });

      it('should not render the dropdown error copy when the value is valid', () => {
        mountRangeDateInput({ data: { myRanges: [juneRange] } });

        cy.get('.gui-pills__count').click({ force: true });
        cy.get('.gui-pills__dropdown').should('exist');
        cy.get(`[data-cy="${uid}_pills-validator-errors"]`).should('not.exist');
      });
    });

    describe('allowEdit pill editing', () => {
      const editableRanges = [
        { start: '2026-06-01', end: '2026-06-05' },
        { start: '2026-06-10', end: '2026-06-12' },
      ];
      const editSel = {
        pill: 'gui-range-date .gui-pills__pill',
        editIcon: `[data-cy="${uid}_pill-edit"]`,
        selectedEditIcon: `.gui-pills__pill--selected [data-cy="${uid}_pill-edit"]`,
        confirmIcon: `[data-cy="${uid}_pill-edit-confirm"]`,
        cancelIcon: `[data-cy="${uid}_pill-edit-cancel"]`,
        removeIcon: '.gui-pills__pill-remove',
        liveRegion: 'gui-range-date .gui-visually-hidden[aria-live="polite"]',
      };

      beforeEach(() => forcePillsStripMode('.gui-range-date-input'));
      afterEach(clearPillsWidthOverride);

      const mountEditable = (formSubmit?: (event: any) => void) =>
        mountRangeDateInput({
          data: { myRanges: editableRanges },
          props: { allowEdit: true },
          formSubmit,
        });

      it('should select a pill on click and reveal the edit action, without committing', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountEditable(formSubmitHandler);

        cy.get(editSel.pill).first().should('have.attr', 'aria-pressed', 'false');
        cy.get(editSel.editIcon).should('not.be.visible');
        cy.get(editSel.pill).first().click();
        cy.get(editSel.pill).first().should('have.attr', 'aria-pressed', 'true');
        cy.get(editSel.pill).first().should('have.class', 'gui-pills__pill--selected');
        cy.get(editSel.pill).first().find(editSel.editIcon).should('have.attr', 'title', 'Edit');
        cy.get(editSel.pill).first().find(editSel.removeIcon).should('exist');
        // The icon is aria-hidden; the pill's description carries the hint.
        cy.get(editSel.pill)
          .first()
          .should('have.attr', 'aria-description')
          .and('contain', 'Edit range 06/01/2026 - 06/05/2026');

        // Selecting is not a commit: the submitted value is untouched.
        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myRanges: editableRanges });
        });
      });

      it('should deselect on a second click, and clear the selection with Escape', () => {
        mountEditable();

        cy.get(editSel.pill).first().click();
        cy.get(editSel.pill).first().should('have.attr', 'aria-pressed', 'true');
        cy.get(editSel.pill).first().click();
        cy.get(editSel.pill).first().should('have.attr', 'aria-pressed', 'false');
        // The pill is still focused, so the Edit preview stays visible.
        cy.get(editSel.pill).first().find(editSel.editIcon).should('be.visible');

        cy.get(editSel.pill).first().click();
        cy.get(editSel.pill).first().type('{esc}');
        cy.get(editSel.pill).first().should('have.attr', 'aria-pressed', 'false');
      });

      it('should preview the edit icon on the focused pill during keyboard navigation', () => {
        mountEditable();

        cy.get(editSel.pill).first().click();
        cy.get(editSel.pill).first().type('{rightarrow}');

        // The selection follows focus away: only the focused pill offers
        // Edit, so a single pencil is ever visible.
        cy.get(editSel.pill).eq(1).should('have.attr', 'aria-pressed', 'false');
        cy.get(editSel.pill).eq(1).find(editSel.editIcon).should('be.visible');
        cy.get(editSel.pill).first().should('have.attr', 'aria-pressed', 'false');
        cy.get(editSel.pill).first().find(editSel.editIcon).should('not.be.visible');
      });

      it('should hide the pill actions when focus leaves the widget', () => {
        mountEditable();

        cy.get(editSel.pill).first().click();
        cy.get(editSel.selectedEditIcon).should('be.visible');
        cy.get('[data-cy="submitBtn_button"]').focus();
        cy.get(editSel.editIcon).should('not.be.visible');
        cy.get('.gui-pills__pill--selected').should('not.exist');
      });

      it('should load the range for editing, preview live on the pill and confirm a replacement', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountEditable(formSubmitHandler);

        cy.get(editSel.pill).first().click();
        cy.get(editSel.selectedEditIcon).click();

        cy.get(sel.start.month).should('have.value', '06');
        cy.get(sel.end.day).should('have.value', '05');
        cy.focused().should('have.attr', 'data-group', 'start');
        cy.get(editSel.pill).first().should('have.class', 'gui-pills__pill--editing');
        cy.get(editSel.liveRegion).should('contain.text', 'Editing range 06/01/2026 - 06/05/2026.');

        // Editing swaps the pill actions: cancel/confirm in, edit/remove out.
        cy.get(editSel.confirmIcon).should('have.attr', 'title', 'Confirm');
        cy.get(editSel.cancelIcon).should('have.attr', 'title', 'Cancel');
        cy.get(editSel.pill).first().find(editSel.editIcon).should('not.exist');
        cy.get(editSel.pill).first().find(editSel.removeIcon).should('not.exist');

        // The editing pill's label previews the modified range live.
        // Parts are pre-filled, so edits retype the segment over its selection.
        cy.get(sel.end.day).type('{selectall}07');
        cy.get(editSel.pill).first().should('contain.text', '06/01/2026 - 06/07/2026');

        cy.get(editSel.confirmIcon).click();
        cy.get(editSel.liveRegion).should(
          'contain.text',
          'Range updated to 06/01/2026 - 06/07/2026.',
        );
        cy.get(editSel.pill).should('have.length', 2);
        cy.get(editSel.pill).first().should('contain.text', '06/01/2026 - 06/07/2026');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({
            myRanges: [
              { start: '2026-06-01', end: '2026-06-07' },
              { start: '2026-06-10', end: '2026-06-12' },
            ],
          });
        });
      });

      it('should commit the edit with Enter, replacing instead of appending', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountEditable(formSubmitHandler);

        cy.get(editSel.pill).first().click();
        cy.get(editSel.selectedEditIcon).click();
        cy.get(sel.end.day).type('{selectall}08');
        cy.focused().type('{enter}');

        cy.get(editSel.pill).should('have.length', 2);
        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({
            myRanges: [
              { start: '2026-06-01', end: '2026-06-08' },
              { start: '2026-06-10', end: '2026-06-12' },
            ],
          });
        });
      });

      it('should start editing with E or F2 on a focused pill', () => {
        mountEditable();

        // Plain E: the pill is a button, so a bare letter key is safe.
        cy.get(editSel.pill).first().click();
        cy.get(editSel.pill).first().type('e');
        cy.get(editSel.pill).first().should('have.class', 'gui-pills__pill--editing');
        cy.get(sel.start.month).should('have.value', '06');

        // F2 selects and edits in one go, no prior selection needed.
        cy.focused().type('{esc}');
        cy.get('.gui-pills__pill--editing').should('not.exist');
        cy.get(editSel.pill).eq(1).focus().trigger('keydown', { key: 'F2' });
        cy.get(editSel.pill).eq(1).should('have.class', 'gui-pills__pill--editing');
        cy.get(sel.start.day).should('have.value', '10');
      });

      it('should cancel with Escape, leaving the value untouched and the pill selected', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountEditable(formSubmitHandler);

        cy.get(editSel.pill).first().click();
        cy.get(editSel.selectedEditIcon).click();
        cy.get(sel.end.day).type('{selectall}20');
        cy.focused().type('{esc}');

        cy.get(editSel.liveRegion).should('contain.text', 'Edit cancelled.');
        cy.get(editSel.editIcon).should('exist');
        cy.get(editSel.confirmIcon).should('not.exist');
        cy.get(sel.start.month).should('have.value', '');
        cy.get(editSel.pill).first().should('not.have.class', 'gui-pills__pill--editing');
        cy.get(editSel.pill).first().should('have.class', 'gui-pills__pill--selected');
        // The live preview is discarded with the session.
        cy.get(editSel.pill).first().should('contain.text', '06/01/2026 - 06/05/2026');
        cy.focused().should('have.class', 'gui-pills__pill');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myRanges: editableRanges });
        });
      });

      it('should cancel from the pill cancel icon, restoring the original label', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountEditable(formSubmitHandler);

        cy.get(editSel.pill).first().click();
        cy.get(editSel.selectedEditIcon).click();
        cy.get(sel.end.day).type('{selectall}20');
        cy.get(editSel.pill).first().should('contain.text', '06/01/2026 - 06/20/2026');
        cy.get(editSel.cancelIcon).click();

        cy.get(editSel.liveRegion).should('contain.text', 'Edit cancelled.');
        cy.get(editSel.pill).first().should('contain.text', '06/01/2026 - 06/05/2026');
        cy.get(editSel.pill).first().should('have.class', 'gui-pills__pill--selected');
        cy.get(editSel.editIcon).should('exist');
        cy.focused().should('have.class', 'gui-pills__pill');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myRanges: editableRanges });
        });
      });

      it('should treat confirming an unchanged range as a cancellation', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountEditable(formSubmitHandler);

        cy.get(editSel.pill).first().click();
        cy.get(editSel.selectedEditIcon).click();
        cy.get(editSel.confirmIcon).click();

        cy.get(editSel.liveRegion).should('contain.text', 'Edit cancelled.');
        cy.get(editSel.editIcon).should('exist');
        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myRanges: editableRanges });
        });
      });

      it('should cancel the session and only select when another pill is clicked mid-edit', () => {
        mountEditable();

        cy.get(editSel.pill).first().click();
        cy.get(editSel.selectedEditIcon).click();
        cy.get(editSel.pill).eq(1).click();

        cy.get(editSel.liveRegion).should('contain.text', 'Edit cancelled.');
        cy.get(editSel.pill).eq(1).should('have.attr', 'aria-pressed', 'true');
        cy.get(editSel.pill).first().should('have.attr', 'aria-pressed', 'false');
        cy.get('.gui-pills__pill--editing').should('not.exist');
        cy.get(editSel.pill).eq(1).find(editSel.editIcon).should('exist');
      });

      it('should merge into a neighbor when the edited range overlaps it', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountEditable(formSubmitHandler);

        cy.get(editSel.pill).first().click();
        cy.get(editSel.selectedEditIcon).click();
        cy.get(sel.end.day).type('{selectall}10');
        cy.get(editSel.confirmIcon).click();

        cy.get(editSel.pill).should('have.length', 1);
        cy.get(editSel.pill).first().should('contain.text', '06/01/2026 - 06/12/2026');
        cy.get(editSel.liveRegion).should(
          'contain.text',
          'Range updated to 06/01/2026 - 06/12/2026.',
        );
        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({
            myRanges: [{ start: '2026-06-01', end: '2026-06-12' }],
          });
        });
      });

      it('should discard a half-entered add partial when an edit starts', () => {
        mountEditable();

        cy.get(sel.start.month).type('07');
        cy.get(editSel.pill).first().click();
        cy.get(editSel.selectedEditIcon).click();

        cy.get(sel.start.month).should('have.value', '06');
        cy.get(sel.start.day).should('have.value', '01');
        cy.get(sel.end.day).should('have.value', '05');
      });

      it('should keep plain pill semantics when allowEdit is off', () => {
        mountRangeDateInput({ data: { myRanges: editableRanges } });

        cy.get(editSel.pill).first().click({ force: true });
        cy.get(editSel.pill).first().should('not.have.attr', 'aria-pressed');
        cy.get(editSel.editIcon).should('not.exist');
      });

      it('should support the flow from the compact-mode dropdown', () => {
        mountEditable();
        forcePillsCompactMode('.gui-range-date-input');

        const inDropdown = (selector: string) => `gui-range-date .gui-pills__dropdown ${selector}`;

        cy.get('gui-range-date .gui-pills__count').click();
        cy.get(inDropdown('.gui-pills__pill')).first().click();
        cy.get('gui-range-date .gui-pills__count').should(
          'have.class',
          'gui-pills__count--has-selection',
        );
        cy.get(inDropdown(editSel.selectedEditIcon)).click();
        cy.get('gui-range-date .gui-pills__count').should(
          'have.class',
          'gui-pills__count--editing',
        );
        cy.get(inDropdown(editSel.confirmIcon)).should('exist');
        cy.get(inDropdown(editSel.cancelIcon)).click();
        cy.get('gui-range-date .gui-pills__count').should(
          'not.have.class',
          'gui-pills__count--editing',
        );
      });
    });
  });
};
