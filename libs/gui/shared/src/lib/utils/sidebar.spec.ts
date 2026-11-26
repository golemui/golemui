import { afterEach, describe, expect, it } from 'vitest';
import { configureMessages } from '@golemui/gui-components';
import { sidebarRegions, sidebarSideId, sidebarSideLabel, sidebarToggleLabel } from './sidebar';

describe('sidebar helpers', () => {
  afterEach(() => configureMessages(null));

  const definition = [{ uid: 'nav' }, { uid: 'content' }];

  it('takes the side child and the main one by the order of the definition', () => {
    const nav = { uid: 'nav' };
    const content = { uid: 'content' };
    expect(sidebarRegions('shell', definition, [nav, content])).toEqual({
      side: nav,
      main: content,
    });
  });

  it('keeps the main child the main one when a state hides the side one', () => {
    const content = { uid: 'content' };
    expect(sidebarRegions('shell', definition, [content])).toEqual({ main: content });
  });

  it('finds the children of a sidebar in a repeater row by their row suffix', () => {
    const nav = { uid: 'nav[2]' };
    const content = { uid: 'content[2]' };
    expect(sidebarRegions('shell[2]', definition, [nav, content])).toEqual({
      side: nav,
      main: content,
    });
  });

  it('builds the id of the side region, which the toggle opens', () => {
    expect(sidebarSideId('checkout-shell')).toBe('checkout-shell_side');
  });

  it('names the side region and the toggle, with translated defaults', () => {
    expect(sidebarSideLabel('Account')).toBe('Account');
    expect(sidebarSideLabel(undefined)).toBe('Menu');
    expect(sidebarToggleLabel(undefined)).toBe('Open menu');
    configureMessages((key) => ({ sidebarSide: 'Menú', openSidebar: 'Abrir menú' })[key as string]);
    expect(sidebarSideLabel('')).toBe('Menú');
    expect(sidebarToggleLabel('')).toBe('Abrir menú');
  });
});
