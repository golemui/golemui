import { defineForm, identityTranslator } from '@golemui/core';
import { type MountComponentFn } from '../utils';

// Behavior tests for the gui-range-time web component: two segmented time inputs
// (start/end) accumulating a TimeRange[] value as pills. Pins the pill
// create/merge/remove model and the "end must be after start" ordering error
// (unlike the date range, which swaps). Uses en-GB (24h) so parts are just
// hour+minute with no day-period.
export const runRangeTimeInputComponentTests = (mountFn: MountComponentFn) => {
  describe('RangeTimeInput Component', () => {
    const uid = 'testSubject';
    const sel = {
      start: {
        hour: 'gui-range-time input[data-group="start"][data-type="hour"]',
        minute: 'gui-range-time input[data-group="start"][data-type="minute"]',
      },
      end: {
        hour: 'gui-range-time input[data-group="end"][data-type="hour"]',
        minute: 'gui-range-time input[data-group="end"][data-type="minute"]',
      },
      pillText: 'gui-range-time .gui-pills__pill-text',
      pillRemove: 'gui-range-time .gui-pills__pill-remove',
    };

    const mountRangeTimeInput = (options?: {
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
              type: 'rangeTimeInput',
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

    const typeRange = (start: [string, string], end: [string, string], commit = true) => {
      cy.get(sel.start.hour).click();
      cy.focused().type(start[0]);
      cy.focused().type(start[1]);
      cy.get(sel.end.hour).click();
      cy.focused().type(end[0]);
      cy.focused().type(end[1]);
      if (commit) cy.focused().type('{enter}');
    };

    it('should hydrate a TimeRange[] value into pills', () => {
      mountRangeTimeInput({
        data: { myRanges: [{ start: '09:00:00', end: '11:00:00' }] },
      });
      cy.get(sel.pillText).should('have.length', 1).and('contain', '09:00');
    });

    it('should render a range without an end as start–start (not "undefined")', () => {
      // A hydrated single-instant range ({start} only) must mirror gui-range-date's
      // single-day pills ("14:00 - 14:00"), never "14:00 - undefined".
      mountRangeTimeInput({ data: { myRanges: [{ start: '14:00:00' }] } });
      cy.get(sel.pillText)
        .should('have.length', 1)
        .should(($el) => {
          const text = $el.text();
          expect(text).to.not.contain('undefined');
          expect((text.match(/14:00/g) || []).length).to.equal(2);
        });
    });

    it('should seed the AM/PM toggle to AM in a 12h locale', () => {
      // en-US resolves to 12h: the day-period switch always has a state, so an
      // empty start/end group must still show "AM", not a blank toggle.
      mountRangeTimeInput({ lang: 'en-US' });
      cy.get('gui-range-time button[data-group="start"][data-type="dayPeriod"]').should(($el) => {
        expect($el.text().trim()).to.match(/AM/);
      });
      cy.get('gui-range-time button[data-group="end"][data-type="dayPeriod"]').should(($el) => {
        expect($el.text().trim()).to.match(/AM/);
      });
    });

    it('should clamp the hour to 12 in a 12h locale', () => {
      // With an AM/PM toggle present, the hour cannot exceed 12: typing 15
      // must correct to 12 (matching gui-time), not stay 15.
      mountRangeTimeInput({ lang: 'en-US' });
      cy.get('gui-range-time input[data-group="start"][data-type="hour"]').click();
      cy.focused().type('15');
      cy.get('gui-range-time input[data-group="start"][data-type="hour"]').should(
        'have.value',
        '12',
      );
    });

    it('should not create a pill until Enter is pressed', () => {
      mountRangeTimeInput();

      // Completing both endpoints is deliberately not enough: the range is only
      // committed by an explicit Enter, which is what frees the user to correct
      // the trailing AM/PM toggle first.
      typeRange(['09', '00'], ['11', '30'], false);

      cy.get(sel.pillText).should('have.length', 0);
      // The typed values stay put so the user can come back and commit them.
      cy.get(sel.start.hour).should('have.value', '09');
      cy.get(sel.end.minute).should('have.value', '30');

      cy.get(sel.end.minute).type('{enter}');
      cy.get(sel.pillText).should('have.length', 1);
    });

    it('should toggle AM/PM with the arrows without committing the range', () => {
      mountRangeTimeInput({ lang: 'en-US' });
      const startPeriod = 'gui-range-time button[data-group="start"][data-type="dayPeriod"]';

      // Arrows cycle the day-period like every other part. The keydown is
      // prevented so a focused button does not scroll the page.
      cy.get(startPeriod).should('contain', 'AM');
      cy.get(startPeriod).focus().type('{downarrow}');
      cy.get(startPeriod).should('contain', 'PM');
      cy.get(startPeriod).type('{uparrow}');
      cy.get(startPeriod).should('contain', 'AM');

      cy.get(sel.pillText).should('have.length', 0);
    });

    it('should commit from the AM/PM toggle with Enter without flipping it', () => {
      // The regression this whole model exists for: Enter used to activate the
      // day-period button (flipping AM->PM) *and* commit in one keypress, so a
      // trailing 11:30 AM committed as 23:30. Enter must only commit.
      const formSubmitHandler = cy.stub().as('formSubmitHandler');
      mountRangeTimeInput({ lang: 'en-US', formSubmit: formSubmitHandler });
      const endPeriod = 'gui-range-time button[data-group="end"][data-type="dayPeriod"]';

      cy.get(sel.start.hour).click();
      cy.focused().type('0900');
      cy.get(sel.end.hour).click();
      cy.focused().type('1130');

      cy.get(endPeriod).should('contain', 'AM');
      cy.get(sel.pillText).should('have.length', 0);

      cy.get(endPeriod).focus().type('{enter}');
      cy.get(sel.pillText).should('have.length', 1);

      submitAndGetData('@formSubmitHandler').then((data) => {
        // 11:30 AM, not the 23:30 a stray toggle would have produced.
        expect(data).to.deep.equal({ myRanges: [{ start: '09:00:00', end: '11:30:00' }] });
      });
    });

    it('should create a pill from a typed range and submit it', () => {
      const formSubmitHandler = cy.stub().as('formSubmitHandler');
      mountRangeTimeInput({ formSubmit: formSubmitHandler });

      typeRange(['09', '00'], ['11', '30']);

      cy.get(sel.pillText).should('have.length', 1);
      cy.get(sel.start.hour).should('have.value', '');

      submitAndGetData('@formSubmitHandler').then((data) => {
        expect(data).to.deep.equal({ myRanges: [{ start: '09:00:00', end: '11:30:00' }] });
      });
    });

    it('should merge overlapping ranges into a single pill', () => {
      const formSubmitHandler = cy.stub().as('formSubmitHandler');
      mountRangeTimeInput({
        data: { myRanges: [{ start: '09:00:00', end: '11:00:00' }] },
        formSubmit: formSubmitHandler,
      });

      // 10:00–13:00 overlaps 09:00–11:00 → merge to 09:00–13:00
      typeRange(['10', '00'], ['13', '00']);

      cy.get(sel.pillText).should('have.length', 1);
      submitAndGetData('@formSubmitHandler').then((data) => {
        expect(data).to.deep.equal({ myRanges: [{ start: '09:00:00', end: '13:00:00' }] });
      });
    });

    it('should keep non-overlapping ranges as separate pills', () => {
      mountRangeTimeInput({
        data: { myRanges: [{ start: '09:00:00', end: '10:00:00' }] },
      });
      typeRange(['14', '00'], ['15', '00']);
      cy.get(sel.pillText).should('have.length', 2);
    });

    it('should reject a range whose end is not after start with the order error', () => {
      mountRangeTimeInput({ props: { rangeOrderMessage: 'End must be after start' } });

      const inputErrorSpy = cy.spy().as('inputErrorSpy');
      cy.get('gui-range-time').then(($el) => {
        $el[0].addEventListener('inputError', inputErrorSpy as unknown as EventListener);
      });

      // 11:00 → 09:00 is reversed; time ranges error (no swap)
      typeRange(['11', '00'], ['09', '00']);

      cy.get(sel.pillText).should('have.length', 0);
      cy.get('@inputErrorSpy').then((spy: any) => {
        expect(spy.getCall(0).args[0].detail.message).to.equal('End must be after start');
      });
    });

    it('should clear the visible order error once a corrected range is committed', () => {
      // Regression: a valid `change` must clear the injected rangeOrderMessage.
      // The Angular wrapper previously omitted injectValidationIssues(null) on
      // change, so the error lingered after the range was fixed.
      mountRangeTimeInput({ props: { rangeOrderMessage: 'End must be after start' } });

      // 11:00 -> 09:00 is reversed → order error injected.
      typeRange(['11', '00'], ['09', '00']);
      // Submitting marks the form touched so the injected error renders.
      cy.get('[data-cy="submitBtn_button"]').click({ force: true });
      cy.get('[data-cy="testSubject_validator-error"]')
        .should('be.visible')
        .and('contain', 'End must be after start');

      // Correct it: overwrite the end hour 09 → 13 (valid 11:00–13:00). Once a
      // commit has been attempted, every edit re-validates, so the error must
      // clear as soon as the range is valid — without waiting for another Enter.
      cy.get(sel.end.hour).click();
      cy.focused().type('{selectall}13', { force: true });
      cy.get('[data-cy="testSubject_validator-error"]').should('not.exist');

      // The pill itself still requires the explicit commit.
      cy.focused().type('{enter}');
      cy.get(sel.pillText).should('have.length', 1);
    });

    it('should remove a pill', () => {
      const formSubmitHandler = cy.stub().as('formSubmitHandler');
      mountRangeTimeInput({
        data: {
          myRanges: [
            { start: '09:00:00', end: '10:00:00' },
            { start: '14:00:00', end: '15:00:00' },
          ],
        },
        formSubmit: formSubmitHandler,
      });

      cy.get(sel.pillText).should('have.length', 2);
      cy.get(sel.pillRemove).first().click({ force: true });
      cy.get(sel.pillText).should('have.length', 1);
    });

    it('should emit an inputError for a typed time past maxTime', () => {
      mountRangeTimeInput({ props: { maxTime: '17:00:00', maxTimeMessage: 'Too late' } });

      const inputErrorSpy = cy.spy().as('inputErrorSpy');
      cy.get('gui-range-time').then(($el) => {
        $el[0].addEventListener('inputError', inputErrorSpy as unknown as EventListener);
      });

      cy.get(sel.start.hour).click();
      cy.focused().type('18');
      cy.focused().type('00');

      // Nothing is reported while the user is still typing — a half-entered
      // time is frequently out of the window and would flash an error.
      cy.get('@inputErrorSpy').should('not.have.been.called');

      // Attempting the commit is what triggers validation.
      cy.focused().type('{enter}');
      cy.get('@inputErrorSpy').then((spy: any) => {
        expect(spy.getCall(0).args[0].detail.message).to.equal('Too late');
      });
    });

    it('should not validate while moving between the parts of one endpoint', () => {
      // Filling a part auto-advances to the next one. That hop is not leaving
      // the widget, so the form must not judge a half-typed entry: a required
      // field lighting up after the first part is the bug.
      mountRangeTimeInput({ validator: { type: 'array', required: true } });

      cy.get(sel.start.hour).click();
      cy.focused().type('09');
      cy.get('[data-cy="testSubject_validator-errors"]').should('not.exist');

      // Leaving the widget is the one moment the entry is judged
      cy.get('[data-cy="submitBtn_button"]').focus();
      cy.get('[data-cy="testSubject_validator-errors"]').should('exist');
    });

    it('should report an incomplete range when only one endpoint was filled', () => {
      // A whole endpoint typed with the other left empty is as unfinished as a
      // half-typed one: the range never became a pill.
      mountRangeTimeInput();

      cy.get(sel.start.hour).click();
      cy.focused().type('09');
      cy.focused().type('00');
      cy.get('[data-cy="submitBtn_button"]').focus();

      cy.get('[data-cy="testSubject_validator-error"]').should('contain.text', 'Incomplete time');
      cy.get(sel.pillText).should('not.exist');
    });

    it('should render disabled inputs when disabled', () => {
      mountRangeTimeInput({
        data: { myRanges: [{ start: '09:00:00', end: '10:00:00' }] },
        disabled: true,
      });
      cy.get(sel.start.hour).should('be.disabled');
      cy.get(sel.end.hour).should('be.disabled');
    });
  });
};
