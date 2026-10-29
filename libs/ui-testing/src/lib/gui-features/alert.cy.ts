import { defineForm } from '@golemui/core';
import { dictionaryTranslator, eventsNamed, type MountComponentFn } from '../utils';

export const runAlertComponentTests = (mountFn: MountComponentFn) => {
  describe('Alert Component', () => {
    beforeEach(() => {
      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: '',
              kind: 'display',
              type: 'alert',
              props: {
                text: 'Some fields need your attention',
                level: 'warning',
              },
            },
          ],
        }),
      });
    });

    it('should display a warning alert', () => {
      cy.get('gui-alert[variant="warning"]')
        .should('have.attr', 'role', 'alert')
        .and('contain.text', 'Some fields need your attention');
    });
  });

  describe('Alert Component level and text', () => {
    it('should use the default variant when no level is set', () => {
      mountFn({
        formDef: defineForm({
          form: [{ uid: 'note', kind: 'display', type: 'alert', props: { text: 'A note' } }],
        }),
      });

      cy.get('gui-alert[id="note"]').should('have.attr', 'variant', 'default');
    });

    it('should use the level of the active state', () => {
      mountFn({
        formDef: defineForm({
          states: { failed: "$form.status === 'failed'" },
          form: [
            { uid: 'status', kind: 'input', type: 'textinput', path: 'status' },
            {
              uid: 'result',
              kind: 'display',
              type: 'alert',
              props: { text: 'Result', level: 'info', 'level.failed': 'error' },
            },
          ],
        }),
      });

      cy.get('gui-alert[id="result"]').should('have.attr', 'variant', 'info');
      cy.get('[data-cy="status_textinput"]').type('failed');
      cy.get('gui-alert[id="result"]').should('have.attr', 'variant', 'error');
      cy.get('[data-cy="status_textinput"]').type('x');
      cy.get('gui-alert[id="result"]').should('have.attr', 'variant', 'info');
    });

    it('should translate a text given as a translation key, and again after a language change', () => {
      const translator = dictionaryTranslator('en', {
        en: { 'alert.saved': 'Saved' },
        es: { 'alert.saved': 'Guardado' },
      });

      mountFn({
        localization: translator,
        formDef: defineForm({
          form: [
            {
              uid: 'saved',
              kind: 'display',
              type: 'alert',
              props: { text: { key: 'alert.saved' }, level: 'success' },
            },
          ],
        }),
      });

      cy.get('gui-alert[id="saved"]').should('contain.text', 'Saved');
      cy.then(() => translator.setLang('es'));
      cy.get('gui-alert[id="saved"]').should('contain.text', 'Guardado');
    });

    it('should send no form event for on handlers on an alert', () => {
      const formEvent = cy.stub().as('formEventHandler');

      mountFn({
        formEvent,
        formDef: defineForm({
          form: [
            // The display widget type has no `on`. A JSON form definition can still contain it.
            {
              uid: 'warning',
              kind: 'display',
              type: 'alert',
              props: { text: 'A warning' },
              on: { load: 'warningLoaded', click: 'warningClicked' },
            } as any,
            {
              uid: 'save',
              kind: 'action',
              type: 'button',
              label: 'Save',
              on: { click: 'saveClicked' },
            },
          ],
        }),
      });

      cy.get('gui-alert[id="warning"]').click();
      // The button event shows that the click above had time to send an event.
      cy.get('[data-cy="save_button"]').click();
      cy.get('@formEventHandler').should(() => {
        expect(eventsNamed(formEvent, 'saveClicked')).to.have.length(1);
      });
      cy.then(() => {
        const names = formEvent.getCalls().map((call) => call.args[0].name);
        expect(names).to.not.include('warningLoaded');
        expect(names).to.not.include('warningClicked');
      });
      cy.get('@formHealth').should('have.been.calledWith', { status: 'ok' });
      cy.get('@formHealth').should('not.have.been.calledWithMatch', { status: 'errored' });
    });
  });
};
