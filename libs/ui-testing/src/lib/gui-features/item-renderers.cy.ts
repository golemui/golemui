import { defineForm } from '@golemui/core';
import { type MountComponentFn } from '../utils';

type ListType = 'list' | 'dropdown';

const mountListWidget = (
  mountFn: MountComponentFn,
  type: ListType,
  props: Record<string, unknown>,
  data?: Record<string, unknown>,
) => {
  mountFn({
    withCustomItemRenderer: true,
    data,
    formDef: defineForm({
      form: [
        {
          uid: 'testSubject',
          kind: 'input',
          type,
          path: 'pick',
          props: type === 'dropdown' ? { inputDebounce: 0, ...props } : props,
        },
      ],
    }),
  });
  if (type === 'dropdown') {
    cy.get('[data-cy="testSubject_textinput"]').click();
  }
};

const visibleRows = () =>
  cy.get('gui-list:not([hidden]) .gui-list__item-wrapper').filter(':visible');

/**
 * Registers the tests for a custom item renderer that `config.itemRenderers` provides and
 * `props.itemRenderer` selects.
 *
 * @param mountFn - Mounts a form with the options and the framework of the calling package.
 */
export const runItemRenderersComponentTests = (mountFn: MountComponentFn) => {
  describe('Custom item renderers', () => {
    (['list', 'dropdown'] as const).forEach((type) => {
      it(`${type}: should render each item with the custom renderer and its full context`, () => {
        mountListWidget(
          mountFn,
          type,
          {
            itemRenderer: 'custom',
            valueField: 'id',
            items: [
              { name: 'Alpha', id: 'a' },
              { name: 'Beta', id: 'b' },
            ],
          },
          { pick: 'b' },
        );

        // The custom renderer gets the whole item as `template`, not the label field.
        visibleRows().should('have.length', 2);
        cy.get('[data-cy="custom-item"]').then((items) => {
          const texts = items.toArray().map((item) => item.textContent?.trim());
          expect(texts).to.deep.equal(['0|a|Alpha|false', '1|b|Beta|true']);
        });
        cy.get('.gui-list__item').should('not.exist');
      });
    });
  });
};

/**
 * Registers the tests for a `props.itemRenderer` key that `config.itemRenderers` does not have.
 *
 * @param mountFn - Mounts a form with the options and the framework of the calling package.
 */
export const runUnknownItemRendererComponentTests = (mountFn: MountComponentFn) => {
  describe('Unknown item renderer', () => {
    (['list', 'dropdown'] as const).forEach((type) => {
      it(`${type}: should render the items with the default renderer`, () => {
        mountListWidget(mountFn, type, { itemRenderer: 'missing', items: ['React', 'Vue'] });

        visibleRows().should('have.length', 2);
        cy.get('.gui-list__item').then((items) => {
          const texts = items.toArray().map((item) => item.textContent?.trim());
          expect(texts).to.deep.equal(['React', 'Vue']);
        });
        cy.get('[data-cy="custom-item"]').should('not.exist');
      });
    });
  });
};
