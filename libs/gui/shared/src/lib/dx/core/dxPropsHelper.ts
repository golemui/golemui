import type { DxCommonFields, DxInputBase } from './dxBase.types';

type DxBaseKeys = keyof DxInputBase | keyof DxCommonFields | 'type';

/**
 * Extract widget-specific props from a flattened decorator.
 * Strips DxInputBase + DxCommonFields fields and returns the remainder.
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
    ...widgetProps
  } = def as any;
  return widgetProps;
}
