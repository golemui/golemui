// The list item normalization lives in gui-shared, where the value-schema resolver shares it
// with the components. Re-exported here so the components and this package's public API keep
// their import paths.
export {
  createListItemMapper,
  isListItem,
  isListItemValue,
  isProtoListItem,
  updateListItems,
} from '@golemui/gui-shared/internals';
export type { ListItemValue } from '@golemui/gui-shared/internals';
