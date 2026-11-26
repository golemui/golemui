import { afterEach, describe, expect, it } from 'vitest';
import { configureMessages } from '@golemui/gui-components';
import { breadcrumbLabel, breadcrumbTrail } from './breadcrumb';

describe('breadcrumb helpers', () => {
  afterEach(() => configureMessages(null));

  it("names the trail after the widget's label", () => {
    expect(breadcrumbLabel('You are here')).toBe('You are here');
  });

  it('names a trail with no label "Breadcrumb", through the translate function', () => {
    expect(breadcrumbLabel(undefined)).toBe('Breadcrumb');
    expect(breadcrumbLabel('')).toBe('Breadcrumb');
    configureMessages((key) => (key === 'breadcrumb' ? 'Ruta de navegación' : undefined));
    expect(breadcrumbLabel(undefined)).toBe('Ruta de navegación');
  });

  it('marks the last step as the current page', () => {
    const trail = breadcrumbTrail([
      { label: 'Orders', value: 'orders' },
      { label: 'A-1042', value: 'order' },
    ]);
    expect(trail.map((step) => step.current)).toEqual([false, true]);
    expect(breadcrumbTrail(undefined)).toEqual([]);
  });
});
