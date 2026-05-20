import { type LayoutWidget } from '@golemui/core';
import { describe, expect, it, vi } from 'vitest';
import { formDefs } from '../dx.service';
import {
  _gslCustomActionByUid,
  _gslCustomActions,
  _gslCustomDisplayByUid,
  _gslCustomDisplays,
  _gslCustomInputByUid,
  _gslCustomInputs,
  _gslCustomLayoutByUid,
  _gslCustomLayouts,
  _guiCustomAction,
  _guiCustomDisplay,
  _guiCustomInput,
  _guiCustomLayout,
  _guiTextInput,
} from '../index';
import { getRawChild, getStaticChild, processDx, resolveDynamic } from './helpers';

describe('DX Pipeline — Custom Display', () => {
  it('expands _guiCustomDisplay into a display widget with custom type', () => {
    const result = processDx(_guiCustomDisplay('heading', { text: 'Hello', level: 1 }));
    const w = getStaticChild(result, 0) as any;

    expect(w.kind).toBe('display');
    expect(w.type).toBe('heading');
    expect(w.props.text).toBe('Hello');
    expect(w.props.level).toBe(1);
  });

  it('produces minimal widget when no props provided', () => {
    const result = processDx(_guiCustomDisplay('heading'));
    const w = getStaticChild(result, 0) as any;

    expect(w.kind).toBe('display');
    expect(w.type).toBe('heading');
    expect(w.props).toEqual({});
  });

  it('supports dynamic callback', () => {
    const result = processDx(_guiCustomDisplay('heading', () => ({ props: { text: 'Dynamic' } })));
    const raw = getRawChild(result, 0);
    const w = resolveDynamic(raw) as any;

    expect(w.kind).toBe('display');
    expect(w.type).toBe('heading');
    expect(w.props.text).toBe('Dynamic');
  });

  it('applies GSL broad selector override', () => {
    const result = processDx(_guiCustomDisplay('heading', { text: 'Original' }), [
      _gslCustomDisplays({ override: { props: { text: 'Overridden' } } }),
    ]);
    const w = getStaticChild(result, 0) as any;

    expect(w.props.text).toBe('Overridden');
  });

  it('applies GSL byId selector override', () => {
    const result = processDx(_guiCustomDisplay('heading', { text: 'Original', uid: 'h1' }), [
      _gslCustomDisplayByUid('h1', { override: { props: { text: 'ById' } } }),
    ]);
    const w = getStaticChild(result, 0) as any;

    expect(w.props.text).toBe('ById');
  });
});

describe('DX Pipeline — Custom Input', () => {
  it('expands _guiCustomInput into an input widget with custom type', () => {
    const result = processDx(_guiCustomInput('matTextInput', 'user.email', { label: 'Email' }));
    const w = getStaticChild(result, 0) as any;

    expect(w.kind).toBe('input');
    expect(w.type).toBe('matTextInput');
    expect(w.path).toBe('user.email');
    expect(w.label).toBe('Email');
  });

  it('auto-generates label from path when not provided', () => {
    const result = processDx(_guiCustomInput('matTextInput', 'firstName'));
    const w = getStaticChild(result, 0) as any;

    expect(w.kind).toBe('input');
    expect(w.type).toBe('matTextInput');
    expect(w.path).toBe('firstName');
    expect(w.label).toBe('First Name');
  });

  it('passes through disabled and readonly flags', () => {
    const result = processDx(
      _guiCustomInput('matTextInput', 'field', { disabled: true, readonly: true }),
    );
    const w = getStaticChild(result, 0) as any;

    expect(w.disabled).toBe(true);
    expect(w.readonly).toBe(true);
  });

  it('passes through defaultValue', () => {
    const result = processDx(_guiCustomInput('matTextInput', 'field', { defaultValue: 'hello' }));
    const w = getStaticChild(result, 0) as any;

    expect(w.defaultValue).toBe('hello');
  });

  it('passes through custom props', () => {
    const result = processDx(
      _guiCustomInput('matTextInput', 'field', { props: { variant: 'filled' } }),
    );
    const w = getStaticChild(result, 0) as any;

    expect(w.props.variant).toBe('filled');
  });

  it('applies GSL broad selector', () => {
    const result = processDx(_guiCustomInput('matTextInput', 'email'), [
      _gslCustomInputs({ override: { label: 'Forced Label' } }),
    ]);
    const w = getStaticChild(result, 0) as any;

    expect(w.label).toBe('Forced Label');
  });

  it('applies GSL byId selector', () => {
    const result = processDx(_guiCustomInput('matTextInput', 'email', { uid: 'email-field' }), [
      _gslCustomInputByUid('email-field', { override: { label: 'By ID' } }),
    ]);
    const w = getStaticChild(result, 0) as any;

    expect(w.label).toBe('By ID');
  });
});

describe('DX Pipeline — Custom Action', () => {
  it('expands _guiCustomAction into an action widget with custom type', () => {
    const result = processDx(_guiCustomAction('matButton', { label: 'Send' }));
    const w = getStaticChild(result, 0) as any;

    expect(w.kind).toBe('action');
    expect(w.type).toBe('matButton');
    expect(w.label).toBe('Send');
  });

  it('wires onClick callback through afterMerge hook', () => {
    const handler = vi.fn();
    const dxResult = formDefs.processDxFacade(
      [_guiCustomAction('matButton', { label: 'Go', onClick: handler })],
      [],
      {},
    );

    expect(dxResult.events).toBeDefined();

    const root = dxResult.form.form as LayoutWidget;
    const btn = root.children?.find(
      (c) => typeof c !== 'function' && (c as any).kind === 'action',
    ) as any;

    expect(typeof btn.on?.click).toBe('string');

    dxResult.events!({ name: btn.on.click, data: { ok: true }, callback: vi.fn() });
    expect(handler).toHaveBeenCalledWith({ ok: true });
  });

  it('passes through custom props', () => {
    const result = processDx(
      _guiCustomAction('matButton', { label: 'Go', props: { variant: 'outlined' } }),
    );
    const w = getStaticChild(result, 0) as any;

    expect(w.props.variant).toBe('outlined');
  });

  it('applies GSL broad selector', () => {
    const result = processDx(_guiCustomAction('matButton', { label: 'Original' }), [
      _gslCustomActions({ override: { label: 'Overridden' } }),
    ]);
    const w = getStaticChild(result, 0) as any;

    expect(w.label).toBe('Overridden');
  });

  it('applies GSL byId selector', () => {
    const result = processDx(_guiCustomAction('matButton', { label: 'Original', uid: 'btn1' }), [
      _gslCustomActionByUid('btn1', { override: { label: 'ById' } }),
    ]);
    const w = getStaticChild(result, 0) as any;

    expect(w.label).toBe('ById');
  });
});

describe('DX Pipeline — Custom Layout', () => {
  it('expands _guiCustomLayout with children recursively', () => {
    const result = processDx(_guiCustomLayout('card', [_guiTextInput('name')]));
    const layout = getStaticChild(result, 0) as LayoutWidget;

    expect(layout.kind).toBe('layout');
    expect(layout.type).toBe('card');
    expect(layout.children).toBeDefined();
    expect(layout.children!.length).toBe(1);

    const child = layout.children![0] as any;
    expect(child.kind).toBe('input');
  });

  it('passes through custom props', () => {
    const result = processDx(_guiCustomLayout('card', [], { props: { elevation: 2 } }));
    const layout = getStaticChild(result, 0) as any;

    expect(layout.kind).toBe('layout');
    expect(layout.type).toBe('card');
    expect(layout.props.elevation).toBe(2);
  });

  it('applies GSL broad selector', () => {
    const result = processDx(_guiCustomLayout('card', []), [
      _gslCustomLayouts({ override: { props: { elevation: 4 } } }),
    ]);
    const layout = getStaticChild(result, 0) as any;

    expect(layout.props.elevation).toBe(4);
  });

  it('applies GSL byId selector', () => {
    const result = processDx(_guiCustomLayout('card', [], { uid: 'main-card' }), [
      _gslCustomLayoutByUid('main-card', { override: { props: { elevation: 8 } } }),
    ]);
    const layout = getStaticChild(result, 0) as any;

    expect(layout.props.elevation).toBe(8);
  });
});

describe('DX Pipeline — widgetLoaders transport', () => {
  it('includes widgetLoaders in DxResult when formConfig provides them', () => {
    const loader = async () => ({ default: {} });
    const result = formDefs.processDxFacade([_guiTextInput('name')], [], {
      widgetLoaders: { heading: loader },
    });

    expect(result.widgetLoaders).toBeDefined();
    expect(result.widgetLoaders!['heading']).toBe(loader);
  });

  it('omits widgetLoaders from DxResult when formConfig has none', () => {
    const result = formDefs.processDxFacade([_guiTextInput('name')], []);

    expect(result.widgetLoaders).toBeUndefined();
  });
});
