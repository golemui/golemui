import { defineForm } from '@golemui/core';
import { type MountComponentFn } from '../utils';

/** Two text inputs, the first with a size, in the layout widget `uid`. */
const layoutForm = (type: 'grid' | 'flex', props: Record<string, unknown>, sizes: number[] = []) =>
  defineForm({
    form: [
      {
        uid: 'layout',
        kind: 'layout',
        type,
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

export const runGridComponentTests = (mountFn: MountComponentFn) => {
  describe('Grid Component', () => {
    const container = () => cy.get('#layout');

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
        mountFn({ formDef: layoutForm('grid', {}) });

        expectContainerClass('gui-grid');
        expectCellClasses(['gui-grid__cell', 'gui-grid__cell', 'gui-grid__cell']);
      });

      it('renders numbered columns and spans a cell by its size', () => {
        mountFn({ formDef: layoutForm('grid', { columns: 3 }, [2]) });

        expectContainerClass('gui-grid gui-grid--columns-3');
        expectCellClasses([
          'gui-grid__cell gui-grid__cell--span-2',
          'gui-grid__cell',
          'gui-grid__cell',
        ]);
      });

      it('limits a span to the number of columns', () => {
        mountFn({ formDef: layoutForm('grid', { columns: 3 }, [5]) });

        expectCellClasses([
          'gui-grid__cell gui-grid__cell--span-3',
          'gui-grid__cell',
          'gui-grid__cell',
        ]);
      });

      it('renders an auto grid that ignores the sizes', () => {
        mountFn({ formDef: layoutForm('grid', { columns: 'auto' }, [4]) });

        expectContainerClass('gui-grid gui-grid--auto');
        expectCellClasses(['gui-grid__cell', 'gui-grid__cell', 'gui-grid__cell']);
      });

      it('renders the direction, the gap and the justify of a row', () => {
        mountFn({ formDef: layoutForm('grid', { direction: 'row', gap: 'lg', justify: 'end' }) });

        expectContainerClass('gui-grid gui-grid--row gui-grid--gap-lg gui-grid--justify-end');
        expectCellClasses(['gui-grid__cell', 'gui-grid__cell', 'gui-grid__cell']);
      });

      it('shares the width of a stretched row by the sizes', () => {
        mountFn({ formDef: layoutForm('grid', { direction: 'row' }, [8, 4]) });

        expectContainerClass('gui-grid gui-grid--row');
        expectCellClasses([
          'gui-grid__cell gui-grid__cell--span-8',
          'gui-grid__cell gui-grid__cell--span-4',
          'gui-grid__cell',
        ]);
      });

      it('ignores the sizes in a row that is not stretched', () => {
        mountFn({ formDef: layoutForm('grid', { direction: 'row', justify: 'center' }, [8]) });

        expectContainerClass('gui-grid gui-grid--row gui-grid--justify-center');
        expectCellClasses(['gui-grid__cell', 'gui-grid__cell', 'gui-grid__cell']);
      });

      it('ignores justify in a stack', () => {
        mountFn({ formDef: layoutForm('grid', { justify: 'end', gap: 'xs' }) });

        expectContainerClass('gui-grid gui-grid--gap-xs');
      });

      it('uses the widget uid as the container id and keeps the children in source order', () => {
        mountFn({ formDef: layoutForm('grid', { columns: 2 }) });

        container().should('have.attr', 'id', 'layout').and('have.class', 'gui-grid');
        expectInputOrder(['first', 'second', 'third']);
      });
    });

    describe('deprecated grid props', () => {
      it('renders a twelve column grid for autoFit false and takes the gap from columnGap', () => {
        mountFn({
          formDef: layoutForm('grid', { direction: 'row', autoFit: false, columnGap: 24 }, [6]),
        });

        expectContainerClass('gui-grid gui-grid--columns-12 gui-grid--gap-lg');
        expectCellClasses([
          'gui-grid__cell gui-grid__cell--span-6',
          'gui-grid__cell',
          'gui-grid__cell',
        ]);
      });

      it('takes the gap from rowGap when there is no columnGap', () => {
        mountFn({ formDef: layoutForm('grid', { rowGap: 50 }) });

        expectContainerClass('gui-grid gui-grid--gap-xl');
      });

      it('renders align as justify and maps the space values to space-between', () => {
        mountFn({ formDef: layoutForm('grid', { direction: 'row', align: 'space-evenly' }) });

        expectContainerClass('gui-grid gui-grid--row gui-grid--justify-space-between');
      });
    });

    describe('deprecated flex layout', () => {
      it('renders as a grid row with a gap step and a justify', () => {
        mountFn({
          formDef: layoutForm('flex', { direction: 'row-reverse', gap: 12, align: 'space-evenly' }),
        });

        expectContainerClass(
          'gui-grid gui-grid--row gui-grid--gap-sm gui-grid--justify-space-between',
        );
        expectInputOrder(['first', 'second', 'third']);
      });

      it('renders a column as a plain grid', () => {
        mountFn({ formDef: layoutForm('flex', { direction: 'column' }) });

        expectContainerClass('gui-grid');
        expectInputOrder(['first', 'second', 'third']);
      });
    });
  });
};
