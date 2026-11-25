import { defineForm } from '@golemui/core';
import { dictionaryTranslator, type MountComponentFn, testDomId, withTestFormName } from '../utils';

// Behavior tests for the typography widget: a heading or plain text, on the tag of its variant.
export const runTypographyComponentTests = (baseMountFn: MountComponentFn) => {
  const mountFn = withTestFormName(baseMountFn);
  const typography = (uid: string) => cy.get(`[id="${testDomId(uid)}"]`);

  describe('Typography Component', () => {
    it('renders each heading variant as that heading, and the text variants as a paragraph', () => {
      const variants = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body', 'small'] as const;
      mountFn({
        formDef: defineForm({
          form: variants.map((variant) => ({
            uid: `text-${variant}`,
            kind: 'display' as const,
            type: 'typography' as const,
            props: { text: `A ${variant}`, variant },
          })),
        }),
      });

      for (const variant of variants) {
        const tag = variant.startsWith('h') ? variant.toUpperCase() : 'P';
        typography(`text-${variant}`)
          .should('have.prop', 'tagName', tag)
          .and('have.class', 'gui-typography')
          .and('have.class', `gui-typography--${variant}`)
          .and('have.text', `A ${variant}`);
      }
      typography('text-h1').parent().should('have.class', 'gui-field');
    });

    it('is body text in a paragraph without a variant', () => {
      mountFn({
        formDef: defineForm({
          form: [{ uid: 'note', kind: 'display', type: 'typography', props: { text: 'A note' } }],
        }),
      });

      typography('note')
        .should('have.prop', 'tagName', 'P')
        .and('have.class', 'gui-typography--body');
    });

    it('keeps the line breaks of its text', () => {
      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: 'lines',
              kind: 'display',
              type: 'typography',
              props: { text: 'One line\nand another' },
            },
          ],
        }),
      });

      typography('lines').should(([el]) => {
        expect(el.textContent).to.equal('One line\nand another');
        const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
        expect(el.getBoundingClientRect().height).to.be.closeTo(lineHeight * 2, 1);
      });
    });

    it('interpolates the form data, and takes the variant of the active state', () => {
      mountFn({
        data: { name: 'Ada' },
        formDef: defineForm({
          states: { done: "$form.status === 'done'" },
          form: [
            { uid: 'status', kind: 'input', type: 'textinput', path: 'status' },
            {
              uid: 'greeting',
              kind: 'display',
              type: 'typography',
              props: { text: 'Hello, {{ $form.name }}', variant: 'h3', 'variant.done': 'h2' },
            },
          ],
        }),
      });

      typography('greeting').should('have.prop', 'tagName', 'H3').and('have.text', 'Hello, Ada');
      cy.get('[data-cy="status_textinput"]').type('done');
      typography('greeting').should('have.prop', 'tagName', 'H2').and('have.text', 'Hello, Ada');
    });

    it('translates its text, and again after a language change', () => {
      const translator = dictionaryTranslator('en', {
        en: { 'booking.title': 'Your booking' },
        es: { 'booking.title': 'Tu reserva' },
      });

      mountFn({
        localization: translator,
        formDef: defineForm({
          form: [
            {
              uid: 'title',
              kind: 'display',
              type: 'typography',
              props: { text: { key: 'booking.title' }, variant: 'h2' },
            },
          ],
        }),
      });

      typography('title').should('have.text', 'Your booking');
      cy.then(() => translator.setLang('es'));
      typography('title').should('have.text', 'Tu reserva');
    });
  });
};
