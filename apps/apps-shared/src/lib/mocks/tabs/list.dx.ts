import { gui } from '@golemui/gui-shared';

const thousandsOfItems = Array.from({ length: 1000 }, (_, i) => i);
const thousandsOfObjectItems = Array.from({ length: 1000 }, (_, i) => ({
  label: `Item ${i}`,
  value: i,
}));

export const listTab = gui.layouts.flex([
  gui.inputs.list('lists.defaultListRenderer', {
    hint: 'Virtual scroll list with 1000 items. Default Item height.',
    items: thousandsOfItems,
  }),
  gui.inputs.list('lists.defaultListRendererObjectItems', {
    height: 150,
    hint: 'Virtual scroll list with 1000 items. Default Item height.',
    items: thousandsOfObjectItems,
  }),
  gui.inputs.list('lists.defaultRenderer20', {
    label: 'Default Renderer with 20px item height',
    height: 150,
    itemHeight: 20,
    hint: 'Virtual scroll list with 1000 items. Item height is 20px.',
    items: thousandsOfItems,
  }),
  gui.inputs.list('lists.disabledList', {
    label: 'Disabled list',
    disabled: true,
    readonly: true,
    height: 150,
    items: thousandsOfItems,
  }),
  gui.inputs.list('lists.requiredList', {
    label: 'Required list',
    hint: 'Select a number greater than 10.',
    height: 150,
    items: thousandsOfItems,
    // TODO: validator on list — DX type gap, tracked in dx-open-items
  }),
  gui.inputs.list('lists.invalidValueList', {
    label: 'Invalid value list',
    hint: 'A list containing invalid values.',
    height: 150,
    items: thousandsOfItems,
    // TODO: validator on list — DX type gap, tracked in dx-open-items
  }),
  gui.inputs.list('lists.customItemRenderer', {
    height: 200,
    itemHeight: 60,
    labelField: 'title',
    valueField: 'value',
    itemRenderer: 'complexListItemRenderer',
    items: [
      { value: 'one', title: 'This is One', description: 'Blah blah blah Lorem Ipsum' },
      { value: 'two', title: 'Two this is', description: 'Ok, blah blah Ipsum Lorem' },
      { value: 'three', title: 'Three this is', description: 'Lorem Ipsum blah blah blah' },
      { value: 'four', title: 'Four this is', description: 'bluh bluh bluh' },
      { value: 'five', title: 'Five this is', description: 'bleh bleh' },
      { value: 'six', title: 'Six this is', description: 'blih blih blih' },
    ],
  }),
]);
