import { describe, expect, it } from 'vitest';
import { LayoutWidget, NonFunctionWidget } from '@golemui/core';
import {
  _guiRepeater,
  _guiInputs,
  _guiSelect,
  _guiCurrency,
  _gslRepeaters,
  _gslRepeaterById,
} from '../index';
import { processDx, getStaticChild, getRawChild, resolveDynamic } from './helpers';

describe('DX Pipeline — Repeater', () => {
  it('expands _guiRepeater into a repeater input widget with template', () => {
    const result = processDx(
      _guiRepeater('users', { addLabel: 'Add User' }, [
        _guiInputs({ 'users.items.name': 'string', 'users.items.surname': 'string' }),
      ]),
    );
    const w = getStaticChild(result, 0) as NonFunctionWidget & {
      path?: string;
      props?: {
        addLabel?: string;
        template?: LayoutWidget;
      };
    };

    expect(w.kind).toBe('input');
    expect(w.type).toBe('repeater');
    expect(w.path).toBe('users');
    expect(w.props?.addLabel).toBe('Add User');

    // Template is a flex layout wrapping the walked children
    const template = w.props?.template as LayoutWidget;
    expect(template.kind).toBe('layout');
    expect(template.type).toBe('flex');
    expect(template.children?.length).toBe(2);

    const child1 = template.children?.[0] as NonFunctionWidget;
    expect(child1.kind).toBe('input');
    expect(child1.type).toBe('textinput');
  });

  it('works with minimal signature (no config)', () => {
    const result = processDx(
      _guiRepeater('items', [
        _guiInputs({ 'items.items.name': 'string' }),
      ]),
    );
    const w = getStaticChild(result, 0) as NonFunctionWidget & {
      path?: string;
      props?: { template?: LayoutWidget };
    };

    expect(w.kind).toBe('input');
    expect(w.type).toBe('repeater');
    expect(w.path).toBe('items');

    const template = w.props?.template as LayoutWidget;
    expect(template.children?.length).toBe(1);
  });

  it('passes all config props through to widget props', () => {
    const result = processDx(
      _guiRepeater(
        'data',
        {
          addLabel: 'Add',
          removeLabel: 'Remove',
          limit: 5,
          title: 'Data Entries',
          addButtonIcon: 'plus',
          removeButtonIcon: 'trash',
        },
        [_guiInputs({ 'data.items.val': 'string' })],
      ),
    );
    const w = getStaticChild(result, 0) as NonFunctionWidget & {
      props?: Record<string, any>;
    };

    expect(w.props?.['addLabel']).toBe('Add');
    expect(w.props?.['removeLabel']).toBe('Remove');
    expect(w.props?.['limit']).toBe(5);
    expect(w.props?.['title']).toBe('Data Entries');
    expect(w.props?.['addButtonIcon']).toBe('plus');
    expect(w.props?.['removeButtonIcon']).toBe('trash');
  });

  it('processes template children through the full pipeline', () => {
    const result = processDx(
      _guiRepeater('orders', { addLabel: 'Add' }, [
        _guiInputs({ 'orders.items.product': 'string' }),
      ]),
    );
    const w = getStaticChild(result, 0) as NonFunctionWidget & {
      props?: { template?: LayoutWidget };
    };
    const template = w.props?.template as LayoutWidget;
    const input = template.children?.[0] as NonFunctionWidget & { label?: string };

    // autoLabel should have processed the path
    expect(input.label).toBeDefined();
  });

  it('supports nested repeaters', () => {
    const result = processDx(
      _guiRepeater('containers', { addLabel: 'Add Container' }, [
        _guiInputs({ 'containers.items.containerId': 'string' }),
        _guiRepeater('containers.items.pallets', { addLabel: 'Add Pallet', limit: 20 }, [
          _guiInputs({ 'containers.items.pallets.items.skuCode': 'string' }),
        ]),
      ]),
    );
    const outerRepeater = getStaticChild(result, 0) as NonFunctionWidget & {
      path?: string;
      props?: { template?: LayoutWidget; addLabel?: string };
    };

    expect(outerRepeater.kind).toBe('input');
    expect(outerRepeater.type).toBe('repeater');
    expect(outerRepeater.path).toBe('containers');
    expect(outerRepeater.props?.addLabel).toBe('Add Container');

    const outerTemplate = outerRepeater.props?.template as LayoutWidget;
    expect(outerTemplate.children?.length).toBe(2);

    // First child: the containerId input
    const containerInput = outerTemplate.children?.[0] as NonFunctionWidget;
    expect(containerInput.kind).toBe('input');
    expect(containerInput.type).toBe('textinput');

    // Second child: the nested repeater
    const innerRepeater = outerTemplate.children?.[1] as NonFunctionWidget & {
      path?: string;
      props?: { template?: LayoutWidget; addLabel?: string; limit?: number };
    };
    expect(innerRepeater.kind).toBe('input');
    expect(innerRepeater.type).toBe('repeater');
    expect(innerRepeater.path).toBe('containers.items.pallets');
    expect(innerRepeater.props?.addLabel).toBe('Add Pallet');
    expect(innerRepeater.props?.limit).toBe(20);

    // Inner template has the sku code input
    const innerTemplate = innerRepeater.props?.template as LayoutWidget;
    expect(innerTemplate.children?.length).toBe(1);
    const skuInput = innerTemplate.children?.[0] as NonFunctionWidget;
    expect(skuInput.kind).toBe('input');
    expect(skuInput.type).toBe('textinput');
  });

  it('applies GSL broad selector override', () => {
    const result = processDx(
      _guiRepeater('items', { addLabel: 'Add', limit: 3 }, [
        _guiInputs({ 'items.items.x': 'string' }),
      ]),
      [_gslRepeaters({ decorator: { limit: 10 } })],
    );
    const w = getStaticChild(result, 0) as NonFunctionWidget & {
      props?: { limit?: number };
    };

    expect(w.props?.limit).toBe(10);
  });

  it('applies GSL byId selector override', () => {
    const result = processDx(
      _guiRepeater('items', { uid: 'my-repeater', addLabel: 'Add' }, [
        _guiInputs({ 'items.items.x': 'string' }),
      ]),
      [_gslRepeaterById('my-repeater', { decorator: { addLabel: 'New' } })],
    );
    const w = getStaticChild(result, 0) as NonFunctionWidget & {
      props?: { addLabel?: string };
    };

    expect(w.props?.addLabel).toBe('New');
  });

  it('supports dynamic callback producing a FunctionWidget', () => {
    const result = processDx(
      _guiRepeater('items', [_guiInputs({ 'items.items.x': 'string' })]),
      [
        _gslRepeaters({
          decorator: () => () => ({
            addLabel: 'Dynamic Add',
          }),
        }),
      ],
    );
    const raw = getRawChild(result, 0);
    const w = resolveDynamic(raw) as NonFunctionWidget & {
      path?: string;
      props?: { addLabel?: string; template?: LayoutWidget };
    };

    expect(w.kind).toBe('input');
    expect(w.type).toBe('repeater');
    expect(w.props?.addLabel).toBe('Dynamic Add');
    expect(w.props?.template).toBeDefined();
  });
});
