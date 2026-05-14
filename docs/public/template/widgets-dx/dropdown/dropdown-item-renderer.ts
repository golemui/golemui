import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.dropdown('country', {
    items: [
      { id: 'AU', flag: '🇦🇺', label: 'Australia' },
      { id: 'BR', flag: '🇧🇷', label: 'Brazil' },
      { id: 'CA', flag: '🇨🇦', label: 'Canada' },
      { id: 'FR', flag: '🇫🇷', label: 'France' },
      { id: 'DE', flag: '🇩🇪', label: 'Germany' },
      { id: 'JP', flag: '🇯🇵', label: 'Japan' },
      { id: 'ES', flag: '🇪🇸', label: 'Spain' },
      { id: 'US', flag: '🇺🇸', label: 'United States' },
      { id: 'GB', flag: '🇬🇧', label: 'United Kingdom' },
    ],
    labelField: 'label',
    valueField: 'id',
    searchFields: ['label'],
    itemRenderer: 'countryItemRenderer',
    label: 'Pick a country',
    uid: 'dropdown_item_renderer',
  }),
];
