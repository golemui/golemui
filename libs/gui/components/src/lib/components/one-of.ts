// The option normalization lives in gui-shared, where the value-schema resolver shares it with
// the components. Re-exported here so the components and this package's public API keep
// their import paths.
export {
  createOptionMapper,
  inferOptionValue,
  isOptionValue,
  isProtoOption,
  updateOptions,
} from '@golemui/gui-shared/internals';
