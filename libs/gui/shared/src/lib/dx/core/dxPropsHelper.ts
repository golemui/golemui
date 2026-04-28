import type { DxCommonFields, DxInputBase } from './dxBase.types';

type DxBaseKeys = keyof DxInputBase | keyof DxCommonFields | 'type';

/**
 * Extract widget-specific props from a flattened decorator.
 * Strips DxInputBase + DxCommonFields fields, event properties,
 * and pipeline-internal `on` from the output.
 */
export function extractWidgetProps<D extends DxInputBase & DxCommonFields>(
  def: D,
): Omit<D, DxBaseKeys> {
  const {
    uid: _uid,
    path: _path,
    label: _label,
    disabled: _disabled,
    readonly: _readonly,
    defaultValue: _defaultValue,
    tags: _tags,
    type: _type,
    size: _size,
    onLoad: _onLoad,
    onChange: _onChange,
    onFilter: _onFilter,
    on: _on,
    states: _states,
    include: _include,
    exclude: _exclude,
    validator: _validator,
    ...widgetProps
  } = def as any;
  return widgetProps;
}
