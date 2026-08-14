import { defineForm, identityTranslator } from '@golemui/core';
import {
  clearPillsWidthOverride,
  forcePillsCompactMode,
  forcePillsStripMode,
  type MountComponentFn,
} from '../utils';

// Behavior tests for the gui-tags chip input. Pins the documented keyboard
// model (widgets-reference/input-fields/tags.mdx): the text input is the
// single tab stop, pills are entered with ArrowLeft/Backspace and left with
// ArrowRight, and Escape closes the dropdown returning focus to the input.
export const runTagsComponentTests = (mountFn: MountComponentFn) => {
  describe('Tags Component', () => {
    const uid = 'testSubject';
    const sel = {
      input: `[data-cy="${uid}_tags-input"]`,
      pill: 'gui-tags button.gui-pills__pill',
      pillText: 'gui-tags .gui-pills__pill-text',
    };

    const mountTags = (options?: {
      data?: Record<string, any>;
      props?: Record<string, any>;
      validator?: Record<string, any>;
      readonly?: boolean;
      disabled?: boolean;
    }) => {
      mountFn({
        localization: identityTranslator('en-US'),
        data: options?.data,
        formDef: defineForm({
          form: [
            {
              uid,
              kind: 'input',
              type: 'tags',
              path: 'myTags',
              ...(options?.props ? { props: options.props } : {}),
              ...(options?.validator ? { validator: options.validator as any } : {}),
              ...(options?.readonly !== undefined ? { readonly: options.readonly } : {}),
              ...(options?.disabled !== undefined ? { disabled: options.disabled } : {}),
            },
          ],
        }),
      });
    };

    describe('draft commits', () => {
      it('should commit the draft on Enter and clear the input', () => {
        mountTags();

        cy.get(sel.input).type('alpha{enter}');
        cy.get(sel.pillText).should('have.length', 1).and('contain', 'alpha');
        cy.get(sel.input).should('have.value', '');
      });

      it('should commit the draft on comma', () => {
        mountTags();

        cy.get(sel.input).type('beta,');
        cy.get(sel.pillText).should('have.length', 1).and('contain', 'beta');
        cy.get(sel.input).should('have.value', '');
      });

      it('should clear the draft on Escape without committing', () => {
        mountTags();

        cy.get(sel.input).type('gamma{esc}');
        cy.get(sel.pillText).should('have.length', 0);
        cy.get(sel.input).should('have.value', '');
      });

      it('should commit tags past a maxItems validator and flag the error instead of blocking', () => {
        mountTags({ validator: { type: 'array', maxItems: 2 } });

        // Entry is never silently blocked — the third tag commits and the
        // validator tells the user the field is over the cap.
        cy.get(sel.input).type('one{enter}two{enter}three{enter}');
        cy.get(sel.pillText).should('have.length', 3);

        cy.get(sel.input).blur();
        cy.get(`[data-cy="${uid}_validator-error"]`).should('be.visible');
      });
    });

    describe('pill keyboard navigation', () => {
      const mountWithTags = () => mountTags({ data: { myTags: ['alpha', 'beta'] } });

      // These pin the strip-mode model, so hold the wrapper above the compact
      // threshold; the harness would otherwise collapse it to the bubble.
      beforeEach(() => forcePillsStripMode('.gui-tags-input'));
      afterEach(clearPillsWidthOverride);

      it('should keep pills out of the tab order (input is the single tab stop)', () => {
        mountWithTags();
        cy.get(sel.pill).should('have.attr', 'tabindex', '-1');
      });

      it('should enter the strip at the LAST pill on ArrowLeft at caret 0', () => {
        mountWithTags();

        cy.get(sel.input).focus();
        cy.focused().type('{leftArrow}');
        cy.focused().should('have.class', 'gui-pills__pill').should('contain.text', 'beta');
      });

      it('should NOT enter the strip while the caret is inside the draft', () => {
        mountWithTags();

        cy.get(sel.input).type('x');
        cy.focused().type('{leftArrow}');
        cy.focused().should('have.attr', 'data-cy', `${uid}_tags-input`);
      });

      it('should focus (not delete) the last pill on Backspace with an empty draft', () => {
        mountWithTags();

        cy.get(sel.input).focus();
        cy.focused().type('{backspace}');
        cy.focused().should('have.class', 'gui-pills__pill').should('contain.text', 'beta');
        cy.get(sel.pillText).should('have.length', 2);
      });

      it('should edit the draft on Backspace when it has content', () => {
        mountWithTags();

        cy.get(sel.input).type('xy{backspace}');
        cy.get(sel.input).should('have.value', 'x');
        cy.focused().should('have.attr', 'data-cy', `${uid}_tags-input`);
        cy.get(sel.pillText).should('have.length', 2);
      });

      it('should return focus to the input on ArrowRight past the last pill', () => {
        mountWithTags();

        cy.get(sel.input).focus();
        cy.focused().type('{leftArrow}');
        cy.focused().should('have.class', 'gui-pills__pill');

        cy.focused().type('{rightArrow}');
        cy.focused().should('have.attr', 'data-cy', `${uid}_tags-input`);
      });

      it('should remove pills on Delete with focus handoff, ending at the input', () => {
        mountWithTags();

        cy.get(sel.input).focus();
        cy.focused().type('{leftArrow}');
        cy.focused().should('contain.text', 'beta');

        // Deleting the last pill slides focus onto the pill that took its place
        cy.focused().type('{del}');
        cy.get(sel.pillText).should('have.length', 1);
        cy.focused().should('have.class', 'gui-pills__pill').should('contain.text', 'alpha');

        // Deleting the final pill returns focus to the input
        cy.focused().type('{del}');
        cy.get(sel.pillText).should('have.length', 0);
        cy.focused().should('have.attr', 'data-cy', `${uid}_tags-input`);
      });
    });

    describe('pill keyboard navigation (compact)', () => {
      const mountWithTags = () => mountTags({ data: { myTags: ['alpha', 'beta'] } });

      // Below the threshold the strip is hidden behind the count bubble, so
      // the dropdown is the pill surface: ArrowDown enters it (top of the
      // vertical list) and ArrowLeft stays in the draft.
      beforeEach(() => forcePillsCompactMode('.gui-tags-input'));
      afterEach(clearPillsWidthOverride);

      it('should open the dropdown at the FIRST pill on ArrowDown', () => {
        mountWithTags();

        cy.get(sel.input).focus();
        cy.focused().type('{downArrow}');
        cy.get('.gui-pills__dropdown').should('exist');
        cy.focused().should('have.class', 'gui-pills__pill').should('contain.text', 'alpha');
      });

      it('should keep ArrowLeft in the input instead of entering the hidden strip', () => {
        mountWithTags();

        cy.get(sel.input).focus();
        cy.focused().type('{leftArrow}');
        cy.focused().should('have.attr', 'data-cy', `${uid}_tags-input`);
        cy.get('.gui-pills__dropdown').should('not.exist');
      });

      it('should close the dropdown on Escape and return focus to the input', () => {
        mountWithTags();

        cy.get('.gui-pills__count').click();
        cy.get('.gui-pills__dropdown button.gui-pills__pill').first().focus();
        cy.focused().type('{esc}');
        cy.get('.gui-pills__dropdown').should('not.exist');
        cy.focused().should('have.attr', 'data-cy', `${uid}_tags-input`);
      });
    });

    describe('pills dropdown errors and error border', () => {
      it('should repeat the field error inside the open pills dropdown with the red border', () => {
        mountTags({
          data: { myTags: ['alpha'] },
          validator: { type: 'array', minItems: 2 },
        });

        // Touch and leave → the minItems error shows below the field
        cy.get(sel.input).focus();
        cy.get(sel.input).blur();
        cy.get(`[data-cy="${uid}_validator-error"]`).should('be.visible');

        cy.get('.gui-pills__count').click({ force: true });
        cy.get(`[data-cy="${uid}_pills-validator-error"]`).should('be.visible');
        cy.get(`#${uid}_pills_errors`)
          .should('have.attr', 'aria-hidden', 'true')
          .and('not.have.attr', 'role');
        cy.get(`[id="${uid}_errors"]`).should('have.length', 1);

        cy.get(`[data-cy="${uid}_validator-error"]`).then(($li) => {
          cy.get('.gui-pills__dropdown').should('have.css', 'border-top-color', $li.css('color'));
        });
      });

      it('should not render the dropdown error copy when the value is valid', () => {
        mountTags({ data: { myTags: ['alpha', 'beta'] } });

        cy.get('.gui-pills__count').click({ force: true });
        cy.get('.gui-pills__dropdown').should('exist');
        cy.get(`[data-cy="${uid}_pills-validator-errors"]`).should('not.exist');
      });
    });
  });
};
