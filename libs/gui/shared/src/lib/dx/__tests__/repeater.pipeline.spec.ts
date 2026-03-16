import { describe, expect, it } from 'vitest';
import { LayoutWidget, NonFunctionWidget } from '@golemui/core';
import {
  _guiRepeater,
  _guiInputs,
  _guiSelect,
  _guiCurrency,
  _guiHorizontalStack,
  _gslRepeaters,
  _gslRepeaterById,
} from '../index';
import { processDx, getStaticChild, getRawChild, resolveDynamic } from './helpers';

describe('DX Pipeline — Repeater', () => {
  it('expands _guiRepeater into a repeater input widget with template', () => {
    const result = processDx(
      _guiRepeater('users', { addLabel: 'Add User' }, [
        _guiInputs({ name: 'string', surname: 'string' }),
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
        _guiInputs({ name: 'string' }),
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
        [_guiInputs({ val: 'string' })],
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
        _guiInputs({ product: 'string' }),
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
        _guiInputs({ containerId: 'string' }),
        _guiRepeater('pallets', { addLabel: 'Add Pallet', limit: 20 }, [
          _guiInputs({ skuCode: 'string' }),
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

    // First child: the containerId input — auto-prefixed
    const containerInput = outerTemplate.children?.[0] as NonFunctionWidget & { path?: string };
    expect(containerInput.kind).toBe('input');
    expect(containerInput.type).toBe('textinput');
    expect(containerInput.path).toBe('containers.items.containerId');

    // Second child: the nested repeater — path auto-prefixed by outer
    const innerRepeater = outerTemplate.children?.[1] as NonFunctionWidget & {
      path?: string;
      props?: { template?: LayoutWidget; addLabel?: string; limit?: number };
    };
    expect(innerRepeater.kind).toBe('input');
    expect(innerRepeater.type).toBe('repeater');
    expect(innerRepeater.path).toBe('containers.items.pallets');
    expect(innerRepeater.props?.addLabel).toBe('Add Pallet');
    expect(innerRepeater.props?.limit).toBe(20);

    // Inner template has the sku code input — auto-prefixed by inner repeater
    const innerTemplate = innerRepeater.props?.template as LayoutWidget;
    expect(innerTemplate.children?.length).toBe(1);
    const skuInput = innerTemplate.children?.[0] as NonFunctionWidget & { path?: string };
    expect(skuInput.kind).toBe('input');
    expect(skuInput.type).toBe('textinput');
    expect(skuInput.path).toBe('containers.items.pallets.items.skuCode');
  });

  it('applies GSL broad selector override', () => {
    const result = processDx(
      _guiRepeater('items', { addLabel: 'Add', limit: 3 }, [
        _guiInputs({ x: 'string' }),
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
        _guiInputs({ x: 'string' }),
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
      _guiRepeater('items', [_guiInputs({ x: 'string' })]),
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

  describe('auto-prefixing', () => {
    it('prefixes simple repeater children', () => {
      const result = processDx(
        _guiRepeater('users', { addLabel: 'Add User' }, [
          _guiInputs({ name: 'string', email: 'string' }),
        ]),
      );
      const w = getStaticChild(result, 0) as NonFunctionWidget & {
        props?: { template?: LayoutWidget };
      };
      const template = w.props?.template as LayoutWidget;

      const child0 = template.children?.[0] as NonFunctionWidget & { path?: string };
      const child1 = template.children?.[1] as NonFunctionWidget & { path?: string };
      expect(child0.path).toBe('users.items.name');
      expect(child1.path).toBe('users.items.email');
    });

    it('prefixes nested repeater — 2 levels', () => {
      const result = processDx(
        _guiRepeater('containers', { addLabel: 'Add Container' }, [
          _guiInputs({ containerId: 'string' }),
          _guiRepeater('pallets', { addLabel: 'Add Pallet' }, [
            _guiInputs({ weight: 'number' }),
          ]),
        ]),
      );
      const outer = getStaticChild(result, 0) as NonFunctionWidget & {
        path?: string;
        props?: { template?: LayoutWidget };
      };
      expect(outer.path).toBe('containers');

      const outerTemplate = outer.props?.template as LayoutWidget;

      // containerId: prefixed by outer repeater
      const containerIdInput = outerTemplate.children?.[0] as NonFunctionWidget & { path?: string };
      expect(containerIdInput.path).toBe('containers.items.containerId');

      // Inner repeater: its own path prefixed by outer
      const innerRepeater = outerTemplate.children?.[1] as NonFunctionWidget & {
        path?: string;
        props?: { template?: LayoutWidget };
      };
      expect(innerRepeater.path).toBe('containers.items.pallets');

      // weight: prefixed by inner repeater (which already has prefixed path)
      const innerTemplate = innerRepeater.props?.template as LayoutWidget;
      const weightInput = innerTemplate.children?.[0] as NonFunctionWidget & { path?: string };
      expect(weightInput.path).toBe('containers.items.pallets.items.weight');
    });

    it('prefixes nested repeater — 3 levels (shipping manifest pattern)', () => {
      const result = processDx(
        _guiRepeater('containers', { addLabel: 'Add Container' }, [
          _guiInputs({ containerId: 'string' }),
          _guiRepeater('pallets', { addLabel: 'Add Pallet' }, [
            _guiInputs({ palletType: 'string' }),
            _guiRepeater('skuItems', { addLabel: 'Add SKU' }, [
              _guiInputs({ skuCode: 'string' }),
            ]),
          ]),
        ]),
      );
      const outer = getStaticChild(result, 0) as NonFunctionWidget & {
        path?: string;
        props?: { template?: LayoutWidget };
      };

      const outerTemplate = outer.props?.template as LayoutWidget;

      // Level 1: containerId
      const containerIdInput = outerTemplate.children?.[0] as NonFunctionWidget & { path?: string };
      expect(containerIdInput.path).toBe('containers.items.containerId');

      // Level 2: pallets repeater
      const palletsRepeater = outerTemplate.children?.[1] as NonFunctionWidget & {
        path?: string;
        props?: { template?: LayoutWidget };
      };
      expect(palletsRepeater.path).toBe('containers.items.pallets');

      const palletsTemplate = palletsRepeater.props?.template as LayoutWidget;

      // Level 2: palletType
      const palletTypeInput = palletsTemplate.children?.[0] as NonFunctionWidget & { path?: string };
      expect(palletTypeInput.path).toBe('containers.items.pallets.items.palletType');

      // Level 3: skuItems repeater
      const skuRepeater = palletsTemplate.children?.[1] as NonFunctionWidget & {
        path?: string;
        props?: { template?: LayoutWidget };
      };
      expect(skuRepeater.path).toBe('containers.items.pallets.items.skuItems');

      // Level 3: skuCode
      const skuTemplate = skuRepeater.props?.template as LayoutWidget;
      const skuCodeInput = skuTemplate.children?.[0] as NonFunctionWidget & { path?: string };
      expect(skuCodeInput.path).toBe('containers.items.pallets.items.skuItems.items.skuCode');
    });

    it('prefixes children inside layout wrappers', () => {
      const result = processDx(
        _guiRepeater('users', { addLabel: 'Add' }, [
          _guiHorizontalStack([
            _guiInputs({ firstName: 'string' }),
            _guiInputs({ lastName: 'string' }),
          ]),
        ]),
      );
      const w = getStaticChild(result, 0) as NonFunctionWidget & {
        props?: { template?: LayoutWidget };
      };
      const template = w.props?.template as LayoutWidget;

      // The horizontal stack is the first child of the template
      const hStack = template.children?.[0] as LayoutWidget;
      expect(hStack.kind).toBe('layout');

      // Inputs inside the stack should be prefixed
      const firstNameInput = hStack.children?.[0] as NonFunctionWidget & { path?: string };
      const lastNameInput = hStack.children?.[1] as NonFunctionWidget & { path?: string };
      expect(firstNameInput.path).toBe('users.items.firstName');
      expect(lastNameInput.path).toBe('users.items.lastName');
    });

    it('does not double-prefix nested repeater template children', () => {
      // This is the critical correctness test.
      // Each nesting level's prefixTemplatePaths applies its OWN prefix to everything
      // in scope — including nested template children. This is additive, not duplicative,
      // because each level uses a different prefix string. Inner buildWidget runs first
      // (depth-first walker) and applies 'b.items.' to 'x' → 'b.items.x'. Then outer
      // buildWidget applies 'a.items.' to both the inner repeater's path ('b' → 'a.items.b')
      // AND the inner template child ('b.items.x' → 'a.items.b.items.x').
      const result = processDx(
        _guiRepeater('a', { addLabel: 'A' }, [
          _guiRepeater('b', { addLabel: 'B' }, [
            _guiInputs({ x: 'string' }),
          ]),
        ]),
      );
      const outer = getStaticChild(result, 0) as NonFunctionWidget & {
        props?: { template?: LayoutWidget };
      };
      const outerTemplate = outer.props?.template as LayoutWidget;
      const inner = outerTemplate.children?.[0] as NonFunctionWidget & {
        path?: string;
        props?: { template?: LayoutWidget };
      };

      // Inner repeater path: prefixed once by outer
      expect(inner.path).toBe('a.items.b');

      // Inner template child: prefixed once by inner (using inner's already-prefixed path)
      const innerTemplate = inner.props?.template as LayoutWidget;
      const xInput = innerTemplate.children?.[0] as NonFunctionWidget & { path?: string };
      expect(xInput.path).toBe('a.items.b.items.x');
    });
  });
});
