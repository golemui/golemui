import { describe, expect, it } from 'vitest';
import { defineShortcutType } from '../registry';
import { processAutoLabel } from '@golemui/dx';
import { type DxCommonFields, type DxInputBase } from '@golemui/dx';
import { type DefOrCallback, type GslConfigBase, type GuiShortcutOf } from '@golemui/dx';
import { processDx, getStaticChild } from './helpers';

interface CustomDecorator extends DxInputBase, DxCommonFields {
  type: 'test-custom';
  customField?: string;
}

interface GslCustomConfig extends GslConfigBase<CustomDecorator> {
  suppressAutomaticLabels?: boolean;
}

type CustomEntry = { key: string; def: DefOrCallback<CustomDecorator> };
type GuiCustomShortcut = GuiShortcutOf<'TEST_CUSTOM_WIDGET', CustomEntry>;

const { gsl: _gslCustom } = defineShortcutType<CustomEntry, CustomDecorator, GslCustomConfig>({
  itemType: 'TEST_CUSTOM_WIDGET',
  entryShape: 'keyed',
  sensibleDefaults: {
    base: { suppressAutomaticLabels: false },
    fields: ['suppressAutomaticLabels'],
    apply: (def, config) => processAutoLabel(def, config),
  },
  mapToWidget: (def) => ({
    uid: def.uid ?? '',
    kind: 'input',
    type: 'test-custom',
    path: def.path ?? '',
    ...(def.label != null ? { label: def.label } : {}),
    props: { ...(def.customField != null ? { customField: def.customField } : {}) },
  }),
});

function _guiCustom(
  path: string,
  props?: Partial<Omit<CustomDecorator, 'type'>>,
): GuiCustomShortcut {
  const def: CustomDecorator = { type: 'test-custom', ...props };
  return { type: 'ITEMS', itemType: 'TEST_CUSTOM_WIDGET', items: [{ key: path, def }], tags: [] };
}

describe('Extension API — defineShortcutType', () => {
  it('registers a custom type and processes it through the pipeline', () => {
    const result = processDx(_guiCustom('myField'));
    const widget = getStaticChild(result, 0) as {
      kind?: string;
      type?: string;
      path?: string;
    };

    expect(widget.kind).toBe('input');
    expect(widget.type).toBe('test-custom');
    expect(widget.path).toBe('myField');
  });

  it('applies sensible defaults (auto-label) to custom type', () => {
    const result = processDx(_guiCustom('firstName'));
    const widget = getStaticChild(result, 0) as { label?: string };

    expect(widget.label).toBe('First Name');
  });

  it('applies GSL selector decorator override to custom type', () => {
    const result = processDx(_guiCustom('field'), [
      _gslCustom({ override: { customField: 'from-gsl' } }),
    ]);
    const widget = getStaticChild(result, 0) as {
      props?: { customField?: string };
    };

    expect(widget.props?.customField).toBe('from-gsl');
  });
});
