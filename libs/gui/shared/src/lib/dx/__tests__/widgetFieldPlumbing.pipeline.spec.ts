/**
 * Phase 1.2.2.1 — Widget Field Plumbing (Areas C + D)
 *
 * Tests for:
 * - Gap 4: `defaultValue` flows through mappers to core widgets
 * - Gap 5: `size` is typed on DxCommonFields and flows to core widgets
 * - Gap 6: `validateOn` flows from FormConfig to DxResult
 */
import { describe, it, expect } from 'vitest';
import { formDefs } from '../dx.service';
import { processDx, getStaticChild, getRawChild, resolveDynamic } from './helpers';
import { _guiTextInput } from '../shortcuts/inputs/guiTextInput.impl';
import { _guiNumberInput } from '../shortcuts/inputs/guiNumberInput.impl';
import { _guiBooleanInput } from '../shortcuts/inputs/guiBooleanInput.impl';
import { _guiCalendar } from '../shortcuts/calendar/guiCalendar.impl';
import { _guiPassword } from '../shortcuts/password/guiPassword.impl';
import { _guiCheckbox } from '../shortcuts/checkbox/guiCheckbox.impl';
import { _guiDateInput } from '../shortcuts/date-input/guiDateInput.impl';
import { _guiCurrency } from '../shortcuts/currency/guiCurrency.impl';
import { _guiRangeCalendar } from '../shortcuts/range-calendar/guiRangeCalendar.impl';
import { _guiSelect } from '../shortcuts/select/guiSelect.impl';
import { _guiRadiogroup } from '../shortcuts/radiogroup/guiRadiogroup.impl';
import { _guiTextarea } from '../shortcuts/textarea/guiTextarea.impl';
import { _guiMarkdown } from '../shortcuts/markdown/guiMarkdown.impl';
import { _guiRangeDateInput } from '../shortcuts/range-date-input/guiRangeDateInput.impl';
import { _guiRangeDatePicker } from '../shortcuts/range-date-picker/guiRangeDatePicker.impl';
import { _guiButton } from '../shortcuts/actions/guiActions.impl';
import { GuiItemTypes, ValidGuiShortcut } from '../core/dx.domain';

// ═══════════════════════════════════════════════════
// Gap 4: defaultValue pass-through
// ═══════════════════════════════════════════════════

describe('DX Pipeline — defaultValue pass-through', () => {
  it('passes defaultValue through _guiTextInput', () => {
    const root = processDx(_guiTextInput('name', { defaultValue: 'Alice' }));
    const widget = getStaticChild(root, 0) as any;
    expect(widget.defaultValue).toBe('Alice');
  });

  it('passes defaultValue through _guiNumberInput', () => {
    const root = processDx(_guiNumberInput('age', { defaultValue: 25 }));
    const widget = getStaticChild(root, 0) as any;
    expect(widget.defaultValue).toBe(25);
  });

  it('passes defaultValue through _guiBooleanInput', () => {
    const root = processDx(_guiBooleanInput('active', { defaultValue: true }));
    const widget = getStaticChild(root, 0) as any;
    expect(widget.defaultValue).toBe(true);
  });

  it('passes defaultValue through _guiCalendar', () => {
    const root = processDx(_guiCalendar('startDate', { defaultValue: '2026-01-01' }));
    const widget = getStaticChild(root, 0) as any;
    expect(widget.defaultValue).toBe('2026-01-01');
  });

  it('passes defaultValue through _guiPassword', () => {
    const root = processDx(_guiPassword('secret', { defaultValue: 'hunter2' }));
    const widget = getStaticChild(root, 0) as any;
    expect(widget.defaultValue).toBe('hunter2');
  });

  it('passes defaultValue through _guiCheckbox', () => {
    const root = processDx(_guiCheckbox('agree', { defaultValue: true }));
    const widget = getStaticChild(root, 0) as any;
    expect(widget.defaultValue).toBe(true);
  });

  it('passes defaultValue through _guiSelect', () => {
    const root = processDx(
      _guiSelect('color', { options: ['red', 'blue'], defaultValue: 'blue' }),
    );
    const widget = getStaticChild(root, 0) as any;
    expect(widget.defaultValue).toBe('blue');
  });

  it('omits defaultValue when not set', () => {
    const root = processDx(_guiTextInput('name'));
    const widget = getStaticChild(root, 0) as any;
    expect(widget).not.toHaveProperty('defaultValue');
  });

  it('passes defaultValue through dynamic widget', () => {
    const root = processDx(
      _guiTextInput('name', () => ({ defaultValue: 'dynamic' })),
    );
    const fn = getRawChild(root, 0);
    const widget = resolveDynamic(fn) as any;
    expect(widget.defaultValue).toBe('dynamic');
  });
});

// ═══════════════════════════════════════════════════
// Gap 5: size type exposure and pass-through
// ═══════════════════════════════════════════════════

describe('DX Pipeline — size pass-through', () => {
  it('passes size through input widget', () => {
    const root = processDx(_guiTextInput('name', { size: 2 }));
    const widget = getStaticChild(root, 0) as any;
    expect(widget.size).toBe(2);
  });

  it('passes size through action widget', () => {
    const root = processDx(
      _guiButton({ label: 'Click', size: 3 } as any),
    );
    const widget = getStaticChild(root, 0) as any;
    expect(widget.size).toBe(3);
  });

  it('passes size through layout widget', () => {
    const layoutShortcut: ValidGuiShortcut = {
      type: 'ITEMS',
      itemType: GuiItemTypes.LAYOUTS,
      items: [{ def: { widgetName: 'flex', direction: 'row', size: 2 }, children: [_guiTextInput('x')] }],
      tags: [],
    };
    const root = processDx(layoutShortcut);
    const innerLayout = getStaticChild(root, 0) as any;
    expect(innerLayout.size).toBe(2);
  });

  it('does not leak size into props for input widgets', () => {
    const root = processDx(_guiTextInput('name', { size: 2 }));
    const widget = getStaticChild(root, 0) as any;
    expect(widget.props).not.toHaveProperty('size');
  });

  it('does not leak size into props for layout widgets', () => {
    const layoutShortcut: ValidGuiShortcut = {
      type: 'ITEMS',
      itemType: GuiItemTypes.LAYOUTS,
      items: [{ def: { widgetName: 'flex', direction: 'row', size: 2 }, children: [_guiTextInput('x')] }],
      tags: [],
    };
    const root = processDx(layoutShortcut);
    const innerLayout = getStaticChild(root, 0) as any;
    expect(innerLayout.props).not.toHaveProperty('size');
  });

  it('omits size when not set', () => {
    const root = processDx(_guiTextInput('name'));
    const widget = getStaticChild(root, 0) as any;
    expect(widget).not.toHaveProperty('size');
  });
});

// ═══════════════════════════════════════════════════
// Gap 6: validateOn flows to DxResult
// ═══════════════════════════════════════════════════

describe('DX Pipeline — validateOn pass-through', () => {
  it('passes validateOn from FormConfig to DxResult', () => {
    const result = formDefs.processDxFacade(
      _guiTextInput('name'),
      [],
      { validateOn: 'blur' },
    );
    expect(result.validateOn).toBe('blur');
  });

  it('passes validateOn: eager', () => {
    const result = formDefs.processDxFacade(
      _guiTextInput('name'),
      [],
      { validateOn: 'eager' },
    );
    expect(result.validateOn).toBe('eager');
  });

  it('passes validateOn as array', () => {
    const result = formDefs.processDxFacade(
      _guiTextInput('name'),
      [],
      { validateOn: ['change', 'blur'] },
    );
    expect(result.validateOn).toEqual(['change', 'blur']);
  });

  it('omits validateOn when not set', () => {
    const result = formDefs.processDxFacade(_guiTextInput('name'));
    expect(result).not.toHaveProperty('validateOn');
  });

  it('passes validateOn alongside other FormConfig fields', () => {
    const deps = {};
    const result = formDefs.processDxFacade(
      _guiTextInput('name'),
      [],
      { validateOn: 'submit', dependencies: deps },
    );
    expect(result.validateOn).toBe('submit');
    expect(result.dependencies).toBe(deps);
  });
});
