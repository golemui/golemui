import { gui } from '@golemui/gui-shared';

const thousandsOfItems = Array.from({ length: 1000 }, (_, i) => i);
const thousandsOfObjectItems = Array.from({ length: 1000 }, (_, i) => ({ label: `Item ${i}`, value: i }));

export const dropdownTab = gui.layouts.flex([
  gui.inputs.dropdown('dropdowns.searchAsYouType', {
    label: 'Search as you type',
    itemHeight: 60,
    itemRenderer: 'productItemRenderer',
    labelField: 'product',
    valueField: 'id',
    inputDebounce: 300,
    items: [],
    hint: 'Search as you type with server side filtering',
    autocomplete: 'off',
    onLoad: 'searchProductForDropdown',
    onFilter: 'searchProductForDropdown',
  }),
  gui.inputs.dropdown('dropdowns.defaultListRendererObjectItems', {
    label: 'Default list renderer with object values',
    height: 100,
    hint: 'Virtual scroll list with 1000 items. Default Item height.',
    items: thousandsOfObjectItems,
  }),
  gui.inputs.dropdown('dropdowns.defaultListRenderer', {
    label: 'Default list renderer with primitive values',
    height: 100,
    hint: 'Virtual scroll list with 1000 items. Default Item height.',
    items: thousandsOfItems,
  }),
  gui.inputs.dropdown('dropdowns.defaultRenderer20', {
    label: 'Default Renderer with 20px item height',
    height: 100,
    itemHeight: 20,
    hint: 'Virtual scroll list with 1000 items. Item height is 20px.',
    items: thousandsOfItems,
  }),
  gui.inputs.dropdown('dropdowns.disabledList', {
    label: 'Disabled list',
    disabled: true,
    readonly: true,
    height: 100,
    items: thousandsOfItems,
  }),
  gui.inputs.dropdown('dropdowns.requiredList', {
    label: 'Required list',
    hint: 'Select a number greater than 10.',
    height: 100,
    items: thousandsOfItems,
    validator: { type: 'number', required: true, minimum: 10 },
  }),
  gui.inputs.dropdown('dropdowns.invalidValueList', {
    label: 'Invalid value list',
    hint: 'A list containing invalid values.',
    height: 100,
    items: thousandsOfItems,
    validator: { type: 'string', required: true },
  }),
  gui.inputs.dropdown('dropdowns.customItemRenderer', {
    label: 'Custom item renderer',
    hint: 'Search by "title" and "description"',
    height: 150,
    itemHeight: 60,
    itemRenderer: 'complexListItemRenderer',
    labelField: 'title',
    valueField: 'value',
    searchFields: ['title', 'description'],
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
