import { gui } from '@golemui/gui-shared';

const items = [
  { label: 'Edit', value: 'edit' },
  { label: 'Duplicate', value: 'duplicate' },
  { separator: true as const },
  { label: 'Archive', value: 'archive', disabled: true },
  { label: 'Delete', value: 'delete' },
];

export const menuTab = gui.layouts.grid([
  gui.actions.menu({ uid: 'menuActions', label: 'Actions', items, onClick: () => 'onMenuAction' }),
  gui.actions.menu({
    uid: 'menuOutlined',
    label: 'Actions',
    items,
    variant: 'outlined',
    onClick: () => 'onMenuAction',
  }),
  gui.actions.menu({
    uid: 'menuLink',
    label: 'Actions',
    items,
    variant: 'link',
    onClick: () => 'onMenuAction',
  }),
  gui.actions.menu({
    uid: 'menuIcon',
    label: 'More',
    items,
    icon: 'more_vert',
    iconPosition: 'right',
    placement: 'bottom-end',
    onClick: () => 'onMenuAction',
  }),
  gui.actions.menu({
    uid: 'menuIconOnly',
    ariaLabel: 'Row actions',
    items,
    icon: 'more_vert',
    variant: 'outlined',
    placement: 'bottom-end',
    onClick: () => 'onMenuAction',
  }),
  gui.actions.menu({
    uid: 'menuTop',
    label: 'Opens above',
    items,
    placement: 'top-start',
    onClick: () => 'onMenuAction',
  }),
  gui.actions.menu({ uid: 'menuDisabled', label: 'Actions', items, disabled: true }),
]);
