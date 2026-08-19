import { defineForm, identityTranslator } from '@golemui/core';
import {
  clearPillsWidthOverride,
  forcePillsCompactMode,
  forcePillsStripMode,
  type MountComponentFn,
} from '../utils';

// Behavior tests for the gui-range-date-time web component: two segmented
// date-time inputs (start/end) accumulating a DateTimeRange[] value as pills.
// Pins the pill create/merge/remove model and — unlike the pure time range,
// which errors on a reversed range — the **swap** ordering (a backward
// selection silently reorders on the full date-time). Uses en-GB (24h) so the
// parts are dd/mm/yyyy hh:mm with no day-period.
export const runRangeDateTimeInputComponentTests = (mountFn: MountComponentFn) => {
  describe('RangeDateTimeInput Component', () => {
    const uid = 'testSubject';
    const partSel = (group: string, type: string) =>
      `gui-range-date-time input[data-group="${group}"][data-type="${type}"]`;
    const sel = {
      startDay: partSel('start', 'day'),
      startHour: partSel('start', 'hour'),
      endDay: partSel('end', 'day'),
      endHour: partSel('end', 'hour'),
      pillText: 'gui-range-date-time .gui-pills__pill-text',
      pillRemove: 'gui-range-date-time .gui-pills__pill-remove',
    };

    const mountRangeDateTimeInput = (options?: {
      data?: Record<string, any>;
      lang?: string;
      props?: Record<string, any>;
      validator?: Record<string, any>;
      formSubmit?: (event: any) => void;
      readonly?: boolean;
      disabled?: boolean;
    }) => {
      mountFn({
        localization: identityTranslator(options?.lang ?? 'en-GB'),
        data: options?.data,
        formDef: defineForm({
          form: [
            {
              uid,
              kind: 'input',
              type: 'rangeDateTimeInput',
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
      cy.get('[data-cy="submitBtn_button"]').click({ force: true });
      return cy.get(formSubmitAlias).then((stub: any) => stub.getCall(0).args[0].data);
    };

    // day/month/year/hour/minute for a group, in en-GB (dd/mm/yyyy hh:mm) order.
    const typeGroup = (
      group: 'start' | 'end',
      [d, mo, y, h, mi]: [string, string, string, string, string],
    ) => {
      cy.get(partSel(group, 'day')).click();
      cy.focused().type(d);
      cy.focused().type(mo);
      cy.focused().type(y);
      cy.focused().type(h);
      cy.focused().type(mi);
    };

    const typeRange = (
      start: [string, string, string, string, string],
      end: [string, string, string, string, string],
      commit = true,
    ) => {
      typeGroup('start', start);
      typeGroup('end', end);
      if (commit) cy.focused().type('{enter}');
    };

    it('should hydrate a DateTimeRange[] value into pills', () => {
      mountRangeDateTimeInput({
        data: { myRanges: [{ start: '2026-11-22T09:00:00', end: '2026-11-22T11:00:00' }] },
      });
      cy.get(sel.pillText)
        .should('have.length', 1)
        .and('contain', '22/11/2026')
        .and('contain', '09:00');
    });

    it('should seed the AM/PM toggle to AM in a 12h locale', () => {
      mountRangeDateTimeInput({ lang: 'en-US' });
      cy.get('gui-range-date-time button[data-group="start"][data-type="dayPeriod"]').should(
        ($el) => {
          expect($el.text().trim()).to.match(/AM/);
        },
      );
      cy.get('gui-range-date-time button[data-group="end"][data-type="dayPeriod"]').should(
        ($el) => {
          expect($el.text().trim()).to.match(/AM/);
        },
      );
    });

    it('should create a pill from a typed range and submit it', () => {
      const formSubmitHandler = cy.stub().as('formSubmitHandler');
      mountRangeDateTimeInput({ formSubmit: formSubmitHandler });

      typeRange(['22', '11', '2026', '09', '00'], ['22', '11', '2026', '11', '30']);

      cy.get(sel.pillText).should('have.length', 1);
      cy.get(sel.startDay).should('have.value', '');

      submitAndGetData('@formSubmitHandler').then((data) => {
        expect(data).to.deep.equal({
          myRanges: [{ start: '2026-11-22T09:00:00', end: '2026-11-22T11:30:00' }],
        });
      });
    });

    it('should reorder (swap) a backward same-day range instead of erroring', () => {
      const formSubmitHandler = cy.stub().as('formSubmitHandler');
      mountRangeDateTimeInput({ formSubmit: formSubmitHandler });

      // start 18:00 → end 09:00 on the same day: silently swaps to 09:00 → 18:00.
      typeRange(['22', '11', '2026', '18', '00'], ['22', '11', '2026', '09', '00']);

      cy.get(sel.pillText).should('have.length', 1);
      submitAndGetData('@formSubmitHandler').then((data) => {
        expect(data).to.deep.equal({
          myRanges: [{ start: '2026-11-22T09:00:00', end: '2026-11-22T18:00:00' }],
        });
      });
    });

    it('should keep a cross-day range as-is (later time on the earlier day)', () => {
      const formSubmitHandler = cy.stub().as('formSubmitHandler');
      mountRangeDateTimeInput({ formSubmit: formSubmitHandler });

      // Nov 22 18:00 → Nov 23 09:00 is already ordered on the full date-time.
      typeRange(['22', '11', '2026', '18', '00'], ['23', '11', '2026', '09', '00']);

      cy.get(sel.pillText).should('have.length', 1);
      submitAndGetData('@formSubmitHandler').then((data) => {
        expect(data).to.deep.equal({
          myRanges: [{ start: '2026-11-22T18:00:00', end: '2026-11-23T09:00:00' }],
        });
      });
    });

    it('should merge overlapping ranges into a single pill', () => {
      const formSubmitHandler = cy.stub().as('formSubmitHandler');
      mountRangeDateTimeInput({
        data: { myRanges: [{ start: '2026-11-22T09:00:00', end: '2026-11-22T11:00:00' }] },
        formSubmit: formSubmitHandler,
      });

      // 10:00–13:00 same day overlaps 09:00–11:00 → merge to 09:00–13:00
      typeRange(['22', '11', '2026', '10', '00'], ['22', '11', '2026', '13', '00']);

      cy.get(sel.pillText).should('have.length', 1);
      submitAndGetData('@formSubmitHandler').then((data) => {
        expect(data).to.deep.equal({
          myRanges: [{ start: '2026-11-22T09:00:00', end: '2026-11-22T13:00:00' }],
        });
      });
    });

    it('should keep non-overlapping ranges as separate pills', () => {
      mountRangeDateTimeInput({
        data: { myRanges: [{ start: '2026-11-22T09:00:00', end: '2026-11-22T10:00:00' }] },
      });
      typeRange(['24', '11', '2026', '14', '00'], ['24', '11', '2026', '15', '00']);
      cy.get(sel.pillText).should('have.length', 2);
    });

    it('should emit an inputError for a typed date-time past maxDateTime', () => {
      mountRangeDateTimeInput({
        props: { maxDateTime: '2026-11-22T17:00:00', maxDateTimeMessage: 'Too late' },
      });

      const inputErrorSpy = cy.spy().as('inputErrorSpy');
      cy.get('gui-range-date-time').then(($el) => {
        $el[0].addEventListener('inputError', inputErrorSpy as unknown as EventListener);
      });

      // Nov 22 18:00 is past the Nov 22 17:00 instant → rejected.
      typeGroup('start', ['22', '11', '2026', '18', '00']);
      cy.get(sel.endDay).click();

      // Quiet until the user attempts a commit.
      cy.get('@inputErrorSpy').should('not.have.been.called');

      cy.focused().type('{enter}');
      cy.get('@inputErrorSpy').then((spy: any) => {
        expect(spy.getCall(0).args[0].detail.message).to.equal('Too late');
      });
    });

    it('should accept a later day whose time-of-day precedes minDateTime', () => {
      // The bound is an instant, not a (date, time-of-day) pair: Nov 23 08:00 is
      // after Nov 22 09:00 and must be accepted. Validating the date and time
      // axes independently would wrongly reject it on the time axis alone.
      mountRangeDateTimeInput({
        props: { minDateTime: '2026-11-22T09:00:00', minDateTimeMessage: 'Too early' },
      });

      const inputErrorSpy = cy.spy().as('inputErrorSpy');
      cy.get('gui-range-date-time').then(($el) => {
        $el[0].addEventListener('inputError', inputErrorSpy as unknown as EventListener);
      });

      typeRange(['23', '11', '2026', '08', '00'], ['23', '11', '2026', '10', '00']);

      cy.get('@inputErrorSpy').should('not.have.been.called');
      cy.get(sel.pillText).should('have.length', 1);
    });

    it('should emit an inputError for a typed date-time before minDateTime', () => {
      mountRangeDateTimeInput({
        props: { minDateTime: '2026-11-22T09:00:00', minDateTimeMessage: 'Too early' },
      });

      const inputErrorSpy = cy.spy().as('inputErrorSpy');
      cy.get('gui-range-date-time').then(($el) => {
        $el[0].addEventListener('inputError', inputErrorSpy as unknown as EventListener);
      });

      // Nov 22 08:00 is before the Nov 22 09:00 instant → rejected.
      typeGroup('start', ['22', '11', '2026', '08', '00']);
      cy.get(sel.endDay).click();

      // Quiet until the user attempts a commit.
      cy.get('@inputErrorSpy').should('not.have.been.called');

      cy.focused().type('{enter}');
      cy.get('@inputErrorSpy').then((spy: any) => {
        expect(spy.getCall(0).args[0].detail.message).to.equal('Too early');
      });
    });

    it('should clear a group error once its invalid date is corrected, before the range completes', () => {
      mountRangeDateTimeInput({ props: { invalidDateMessage: 'Invalid date' } });

      // Feb 30 09:00 in the start group, committed with Enter → invalid-date error.
      typeGroup('start', ['30', '02', '2026', '09', '00']);
      cy.focused().type('{enter}');
      // Submitting marks the form touched so the injected error renders.
      cy.get('[data-cy="submitBtn_button"]').click({ force: true });
      cy.get('[data-cy="testSubject_validator-error"]')
        .should('be.visible')
        .and('contain', 'Invalid date');

      // Correct just the start day to 28 (valid); the end is still empty, but the
      // completed-and-valid start must clear its error on its own.
      cy.get(sel.startDay).click();
      cy.focused().type('{selectall}28', { force: true });
      cy.get(sel.endDay).click();

      cy.get('[data-cy="testSubject_validator-error"]').should('not.exist');
      cy.get(sel.pillText).should('not.exist');
    });

    it('should remove a pill', () => {
      mountRangeDateTimeInput({
        data: {
          myRanges: [
            { start: '2026-11-22T09:00:00', end: '2026-11-22T10:00:00' },
            { start: '2026-11-24T14:00:00', end: '2026-11-24T15:00:00' },
          ],
        },
      });

      cy.get(sel.pillText).should('have.length', 2);
      cy.get(sel.pillRemove).first().click({ force: true });
      cy.get(sel.pillText).should('have.length', 1);
    });

    it('should not validate while moving between the parts of one endpoint', () => {
      // Filling a part auto-advances to the next one. That hop is not leaving
      // the widget, so the form must not judge a half-typed entry: a required
      // field lighting up after the first part is the bug.
      mountRangeDateTimeInput({ validator: { type: 'array', required: true } });

      cy.get(sel.startDay).click();
      cy.focused().type('22');
      cy.get('[data-cy="testSubject_validator-errors"]').should('not.exist');
      cy.focused().type('11');
      cy.get('[data-cy="testSubject_validator-errors"]').should('not.exist');

      // Leaving the widget is the one moment the entry is judged
      cy.get('[data-cy="submitBtn_button"]').focus();
      cy.get('[data-cy="testSubject_validator-errors"]').should('exist');
    });

    it('should report an incomplete range when only one endpoint was filled', () => {
      // A whole endpoint typed with the other left empty is as unfinished as a
      // half-typed one: the range never became a pill.
      mountRangeDateTimeInput();

      typeGroup('start', ['22', '11', '2026', '09', '00']);
      cy.get('[data-cy="submitBtn_button"]').focus();

      cy.get('[data-cy="testSubject_validator-error"]').should(
        'contain.text',
        'Incomplete date-time',
      );
      cy.get(sel.pillText).should('not.exist');
    });

    it('should clear the incomplete error when the emptied endpoint is left again', () => {
      // Regression: leave one endpoint behind (incomplete error), come back,
      // empty its fields and leave again — the error must not outlive fields
      // that no longer hold anything.
      mountRangeDateTimeInput();

      typeGroup('start', ['22', '11', '2026', '09', '00']);
      cy.get('[data-cy="submitBtn_button"]').focus();
      cy.get('[data-cy="testSubject_validator-error"]').should(
        'contain.text',
        'Incomplete date-time',
      );

      for (const type of ['day', 'month', 'year', 'hour', 'minute']) {
        cy.get(partSel('start', type)).type('{selectAll}{backspace}');
      }
      cy.get('[data-cy="submitBtn_button"]').focus();
      cy.get('[data-cy="testSubject_validator-errors"]').should('not.exist');
    });

    it('should commit a complete range when focus leaves, without Enter', () => {
      const formSubmitHandler = cy.stub().as('formSubmitHandler');
      mountRangeDateTimeInput({ formSubmit: formSubmitHandler });

      typeGroup('start', ['22', '11', '2026', '09', '00']);
      typeGroup('end', ['22', '11', '2026', '11', '30']);
      cy.get(sel.pillText).should('not.exist');

      // Leaving acts as Enter: a range the user finished is not abandoned work,
      // and the click that leaves is the same one that submits, so the commit
      // has to settle before the form reads its data.
      submitAndGetData('@formSubmitHandler').then((data: any) => {
        expect(data).to.deep.equal({
          myRanges: [{ start: '2026-11-22T09:00:00', end: '2026-11-22T11:30:00' }],
        });
      });
      cy.get(sel.pillText).should('have.length', 1);
    });

    it('should render disabled inputs when disabled', () => {
      mountRangeDateTimeInput({
        data: { myRanges: [{ start: '2026-11-22T09:00:00', end: '2026-11-22T10:00:00' }] },
        disabled: true,
      });
      cy.get(sel.startDay).should('be.disabled');
      cy.get(sel.endDay).should('be.disabled');
    });

    describe('pill keyboard navigation', () => {
      // Given unsorted, displayed sorted by start: May first, November last
      const november = { start: '2026-11-22T09:00:00', end: '2026-11-22T11:00:00' };
      const may = { start: '2026-05-10T09:00:00', end: '2026-05-10T10:00:00' };

      const mountWithRanges = () =>
        mountRangeDateTimeInput({ data: { myRanges: [november, may] } });

      // These pin the strip-mode model, so hold the wrapper above the compact
      // threshold; the harness would otherwise collapse it to the bubble.
      // The dropdown test below re-pins it to compact explicitly.
      beforeEach(() => forcePillsStripMode('.gui-range-date-time-input'));
      afterEach(clearPillsWidthOverride);

      it('should keep pills out of the tab order', () => {
        mountWithRanges();
        cy.get('button.gui-pills__pill').should('have.attr', 'tabindex', '-1');
      });

      it('should enter the strip at the LAST pill on ArrowLeft from the first segment', () => {
        mountWithRanges();

        cy.get(sel.startDay).focus();
        cy.focused().type('{leftArrow}');
        cy.focused().should('have.class', 'gui-pills__pill').should('contain.text', '22/11/2026');
      });

      it('should return focus to the first start segment on ArrowRight past the last pill', () => {
        mountWithRanges();

        cy.get(sel.startDay).focus();
        cy.focused().type('{leftArrow}');
        cy.focused().should('have.class', 'gui-pills__pill');

        cy.focused().type('{rightArrow}');
        cy.focused()
          .should('have.attr', 'data-group', 'start')
          .should('have.attr', 'data-type', 'day');
      });

      it('should close the dropdown on Escape and return focus to the segments', () => {
        forcePillsCompactMode('.gui-range-date-time-input');
        mountWithRanges();

        cy.get('.gui-pills__count').click();
        cy.get('.gui-pills__dropdown button.gui-pills__pill').first().focus();
        cy.focused().type('{esc}');
        cy.get('.gui-pills__dropdown').should('not.exist');
        cy.focused().should('have.attr', 'data-group', 'start');
      });

      it('should focus (not delete) the last pill on Delete when the segments are empty', () => {
        mountWithRanges();

        cy.get(sel.startDay).focus();
        cy.focused().type('{del}');
        cy.focused().should('have.class', 'gui-pills__pill').should('contain.text', '22/11/2026');
        cy.get(sel.pillText).should('have.length', 2);
      });
    });

    describe('pills dropdown errors and error border', () => {
      const committedRange = {
        myRanges: [{ start: '2026-11-22T09:00:00', end: '2026-11-22T10:00:00' }],
      };

      it('should repeat the field error inside the open pills dropdown with the red border', () => {
        mountRangeDateTimeInput({ data: committedRange });

        // Leave a half-typed second range behind → incomplete error, pill kept
        cy.get(sel.startDay).click();
        cy.focused().type('15');
        cy.get('[data-cy="submitBtn_button"]').focus();
        cy.get(`[data-cy="${uid}_validator-error"]`).should('contain.text', 'Incomplete date-time');

        cy.get('.gui-pills__count').click({ force: true });
        cy.get(`[data-cy="${uid}_pills-validator-error"]`)
          .should('be.visible')
          .and('contain.text', 'Incomplete date-time');
        cy.get(`#${uid}_pills_errors`)
          .should('have.attr', 'aria-hidden', 'true')
          .and('not.have.attr', 'role');
        cy.get(`[id="${uid}_errors"]`).should('have.length', 1);

        cy.get(`[data-cy="${uid}_validator-error"]`).then(($li) => {
          cy.get('.gui-pills__dropdown').should('have.css', 'border-top-color', $li.css('color'));
        });
      });

      it('should not render the dropdown error copy when the value is valid', () => {
        mountRangeDateTimeInput({ data: committedRange });

        cy.get('.gui-pills__count').click({ force: true });
        cy.get('.gui-pills__dropdown').should('exist');
        cy.get(`[data-cy="${uid}_pills-validator-errors"]`).should('not.exist');
      });
    });

    describe('allowEdit pill editing', () => {
      const editableRanges = [
        { start: '2026-11-22T09:00:00', end: '2026-11-22T11:00:00' },
        { start: '2026-11-25T14:00:00', end: '2026-11-25T15:00:00' },
      ];
      const editSel = {
        pill: 'gui-range-date-time .gui-pills__pill',
        editIcon: `[data-cy="${uid}_pill-edit"]`,
        selectedEditIcon: `.gui-pills__pill--selected [data-cy="${uid}_pill-edit"]`,
        confirmIcon: `[data-cy="${uid}_pill-edit-confirm"]`,
        liveRegion: 'gui-range-date-time .gui-visually-hidden[aria-live="polite"]',
      };

      beforeEach(() => forcePillsStripMode('.gui-range-date-time-input'));
      afterEach(clearPillsWidthOverride);

      const mountEditable = (formSubmit?: (event: any) => void) =>
        mountRangeDateTimeInput({
          data: { myRanges: editableRanges },
          props: { allowEdit: true },
          formSubmit,
        });

      it('should select, edit with live preview and confirm a replacement', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountEditable(formSubmitHandler);

        cy.get(editSel.pill).first().click();
        cy.get(editSel.pill).first().should('have.attr', 'aria-pressed', 'true');
        cy.get(editSel.pill)
          .first()
          .should(($el) => {
            const description = $el.attr('aria-description') ?? '';
            expect(description).to.contain('Edit range');
            expect(description).to.contain('22/11/2026');
          });
        cy.get(editSel.selectedEditIcon).click();

        cy.get(sel.startDay).should('have.value', '22');
        cy.get(sel.endHour).should('have.value', '11');
        cy.get(editSel.liveRegion).should('contain.text', 'Editing range');
        cy.get(editSel.pill).first().should('have.class', 'gui-pills__pill--editing');

        // The editing pill's label previews the modified range live.
        // Parts are pre-filled, so edits retype the segment over its selection.
        cy.get(sel.endHour).type('{selectall}12');
        cy.get(editSel.pill).first().should('contain.text', '12:00');

        cy.get(editSel.confirmIcon).click();
        cy.get(editSel.pill).should('have.length', 2);
        cy.get(editSel.pill).first().should('contain.text', '12:00');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({
            myRanges: [
              { start: '2026-11-22T09:00:00', end: '2026-11-22T12:00:00' },
              { start: '2026-11-25T14:00:00', end: '2026-11-25T15:00:00' },
            ],
          });
        });
      });

      it('should cancel with Escape, leaving the value untouched', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountEditable(formSubmitHandler);

        cy.get(editSel.pill).first().click();
        cy.get(editSel.selectedEditIcon).click();
        cy.get(sel.endHour).type('{selectall}12');
        cy.focused().type('{esc}');

        cy.get(editSel.liveRegion).should('contain.text', 'Edit cancelled.');
        cy.get(editSel.editIcon).should('exist');
        cy.get(editSel.pill).first().should('contain.text', '11:00');
        cy.get(sel.startDay).should('have.value', '');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myRanges: editableRanges });
        });
      });

      it('should keep plain pill semantics when allowEdit is off', () => {
        mountRangeDateTimeInput({ data: { myRanges: editableRanges } });

        cy.get(editSel.pill).first().click({ force: true });
        cy.get(editSel.pill).first().should('not.have.attr', 'aria-pressed');
        cy.get(editSel.editIcon).should('not.exist');
      });
    });
  });
};
