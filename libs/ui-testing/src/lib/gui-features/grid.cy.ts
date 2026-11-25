import { defineForm } from '@golemui/core';
import { type MountComponentFn, testDomId, withTestFormName } from '../utils';

/** Three text inputs, sized by `sizes`, in the grid `layout`. */
const layoutForm = (props: Record<string, unknown>, sizes: number[] = []) =>
  defineForm({
    form: [
      {
        uid: 'layout',
        kind: 'layout',
        type: 'grid',
        props,
        children: ['first', 'second', 'third'].map((uid, index) => ({
          uid,
          kind: 'input',
          type: 'textinput',
          path: uid,
          label: uid,
          size: sizes[index],
        })),
      } as any,
    ],
  });

export const runGridComponentTests = (baseMountFn: MountComponentFn) => {
  const mountFn = withTestFormName(baseMountFn);
  describe('Grid Component', () => {
    const container = () => cy.get(`[id="${testDomId('layout')}"]`);

    // Angular writes the classes of a `[class]` binding in another order than the other
    // bindings, and the order has no meaning. So the classes are compared as sets.
    const classSet = (value: string | null | undefined) => (value ?? '').split(' ').sort();

    const expectContainerClass = (expected: string) => {
      container().should(($element) => {
        expect(classSet($element.attr('class'))).to.deep.equal(classSet(expected));
      });
    };

    const expectCellClasses = (expected: string[]) => {
      container().should(($element) => {
        const classes = $element
          .children()
          .toArray()
          .map((cell) => classSet(cell.getAttribute('class')));
        expect(classes).to.deep.equal(expected.map(classSet));
      });
    };

    const expectInputOrder = (uids: string[]) => {
      container().should(($element) => {
        const order = $element
          .find('gui-textinput input[data-cy$="_textinput"]')
          .toArray()
          .map((element) => element.getAttribute('data-cy'));
        expect(order).to.deep.equal(uids.map((uid) => `${uid}_textinput`));
      });
    };

    describe('grid props', () => {
      it('renders a stack with no props', () => {
        mountFn({ formDef: layoutForm({}) });

        expectContainerClass('gui-grid');
        expectCellClasses(['gui-grid__cell', 'gui-grid__cell', 'gui-grid__cell']);
      });

      it('renders numbered columns and spans a cell by its size', () => {
        mountFn({ formDef: layoutForm({ columns: 3 }, [2]) });

        expectContainerClass('gui-grid gui-grid--columns-3');
        expectCellClasses([
          'gui-grid__cell gui-grid__cell--span-2',
          'gui-grid__cell',
          'gui-grid__cell',
        ]);
      });

      it('limits a span to the number of columns', () => {
        mountFn({ formDef: layoutForm({ columns: 3 }, [5]) });

        expectCellClasses([
          'gui-grid__cell gui-grid__cell--span-3',
          'gui-grid__cell',
          'gui-grid__cell',
        ]);
      });

      it('renders an auto grid that ignores the sizes', () => {
        mountFn({ formDef: layoutForm({ columns: 'auto' }, [4]) });

        expectContainerClass('gui-grid gui-grid--auto');
        expectCellClasses(['gui-grid__cell', 'gui-grid__cell', 'gui-grid__cell']);
      });

      it('renders the direction, the gap and the justify of a row', () => {
        mountFn({ formDef: layoutForm({ direction: 'row', gap: 'lg', justify: 'end' }) });

        expectContainerClass('gui-grid gui-grid--row gui-grid--gap-lg gui-grid--justify-end');
        expectCellClasses(['gui-grid__cell', 'gui-grid__cell', 'gui-grid__cell']);
      });

      it('shares the width of a stretched row by the sizes', () => {
        mountFn({ formDef: layoutForm({ direction: 'row' }, [8, 4]) });

        expectContainerClass('gui-grid gui-grid--row');
        expectCellClasses([
          'gui-grid__cell gui-grid__cell--span-8',
          'gui-grid__cell gui-grid__cell--span-4',
          'gui-grid__cell',
        ]);
      });

      it('ignores the sizes in a row that is not stretched', () => {
        mountFn({ formDef: layoutForm({ direction: 'row', justify: 'center' }, [8]) });

        expectContainerClass('gui-grid gui-grid--row gui-grid--justify-center');
        expectCellClasses(['gui-grid__cell', 'gui-grid__cell', 'gui-grid__cell']);
      });

      it('ignores justify in a stack', () => {
        mountFn({ formDef: layoutForm({ justify: 'end', gap: 'xs' }) });

        expectContainerClass('gui-grid gui-grid--gap-xs');
      });

      it('uses the widget uid as the container id and keeps the children in source order', () => {
        mountFn({ formDef: layoutForm({ columns: 2 }) });

        container().should('have.attr', 'id', testDomId('layout')).and('have.class', 'gui-grid');
        expectInputOrder(['first', 'second', 'third']);
      });
    });
  });
};
