import { describe, expect, it } from 'vitest';
import { golemForm } from './golem-form';

// This file is also typechecked by vitest (see `typecheck.include` in vite.config.ts), so a
// definition that stops compiling fails the run.
describe('golemForm typed JSON API', () => {
  it('accepts a translation config as an accordion section label and as a tab label', () => {
    const formDef = golemForm().create({
      form: [
        {
          uid: 'sections',
          kind: 'layout',
          type: 'accordion',
          props: {
            sections: [{ uid: 'billing', label: { key: 'sections.billing', default: 'Billing' } }],
          },
          children: [{ uid: 'billing', kind: 'input', type: 'textinput', path: 'iban' }],
        },
        {
          uid: 'tabs',
          kind: 'layout',
          type: 'tabs',
          props: {
            tabs: [
              { uid: 'profile', label: { key: 'tabs.profile' } },
              { uid: 'notes', label: 'Notes' },
            ],
          },
          children: [
            { uid: 'profile', kind: 'input', type: 'textinput', path: 'name' },
            { uid: 'notes', kind: 'input', type: 'textinput', path: 'notes' },
          ],
        },
      ],
    });

    // The typed `create` call above is the check. The assertions only read the result back.
    const propsOf = (index: number): Record<string, any> =>
      (formDef.form.children[index] as unknown as { props: Record<string, any> }).props;
    expect(propsOf(0)['sections'][0].label).toEqual({
      key: 'sections.billing',
      default: 'Billing',
    });
    expect(propsOf(1)['tabs'].map((tab: { label: unknown }) => tab.label)).toEqual([
      { key: 'tabs.profile' },
      'Notes',
    ]);
  });
});
