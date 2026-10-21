import { type ActionWidget, type FormEvent, type LayoutWidget } from '@golemui/core';
import { describe, expect, it, vi } from 'vitest';
import { _guiMenu, _gslMenus } from '../index';
import { formDefs } from '../formDefs';
import { getStaticChild, processDx } from './helpers';

const items = [
  { label: 'Edit', value: 'edit' },
  { separator: true as const },
  { label: 'Delete', value: 'delete', disabled: true },
];

describe('DX Pipeline — Menu', () => {
  it('expands _guiMenu into a menu action widget', () => {
    const root = processDx([
      _guiMenu({ uid: 'rowActions', label: 'Actions', items, placement: 'bottom-end' }),
    ]);
    const menu = getStaticChild(root, 0) as ActionWidget;

    expect(menu).toMatchObject({
      uid: 'rowActions',
      kind: 'action',
      type: 'menu',
      label: 'Actions',
      props: { items, placement: 'bottom-end' },
    });
  });

  it('keeps the button props and the disabled state', () => {
    const root = processDx([
      _guiMenu({
        label: 'More',
        items,
        variant: 'outlined',
        icon: 'more_vert',
        iconPosition: 'right',
        disabled: { when: '$formIsInvalid' },
      }),
    ]);
    const menu = getStaticChild(root, 0) as ActionWidget;

    expect(menu.disabled).toEqual({ when: '$formIsInvalid' });
    expect(menu.props).toEqual({
      items,
      variant: 'outlined',
      icon: 'more_vert',
      iconPosition: 'right',
    });
  });

  it('wires a zero-arg handler returning a string to on.click (host-managed dispatch)', () => {
    const root = processDx([_guiMenu({ label: 'Actions', items, onClick: () => 'rowAction' })]);

    expect((getStaticChild(root, 0) as ActionWidget).on?.click).toBe('rowAction');
  });

  it('runs an onClick handler with the event, so it can read the picked value', () => {
    const onClick = vi.fn((_event: FormEvent) => undefined);
    const result = formDefs.processDxFacade(
      [_guiMenu({ label: 'Actions', items, onClick })],
      [],
      {},
    );
    const menu = getStaticChild(result.form.form as LayoutWidget, 0) as ActionWidget;

    expect(menu.on?.click).toMatch(/^event_\d+$/);
    // The handler takes a parameter, so the build never probes it with an undefined event.
    expect(onClick).not.toHaveBeenCalled();

    result.events!({
      name: menu.on!.click as string,
      data: {},
      detail: { value: 'edit' },
      callback: vi.fn(),
    });

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0][0].detail).toEqual({ value: 'edit' });
    expect(typeof (onClick.mock.calls[0][0] as any).update).toBe('function');
  });

  it('is matched by the menus selector', () => {
    const root = processDx(
      [_guiMenu({ label: 'Actions', items })],
      [_gslMenus({ override: { placement: 'top-end' } })],
    );

    expect((getStaticChild(root, 0) as ActionWidget).props).toMatchObject({
      placement: 'top-end',
    });
  });
});
