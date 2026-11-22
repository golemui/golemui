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

  it('does not compile with a function inside the definition', () => {
    const formDef = golemForm().create({
      form: [
        // @ts-expect-error A widget is an object, not a function.
        () => ({ uid: 'title', kind: 'display', type: 'alert', props: { text: 'Title' } }),
        {
          uid: 'name',
          kind: 'input',
          type: 'textinput',
          path: 'name',
          // @ts-expect-error A label is a text or a translation config, not a function.
          label: () => 'Name',
        },
        {
          uid: 'email',
          kind: 'input',
          type: 'textinput',
          path: 'email',
          // @ts-expect-error A validator is an object, not a function.
          validator: () => ({ type: 'string', required: true }),
        },
        {
          uid: 'city',
          kind: 'input',
          type: 'textinput',
          path: 'city',
          on: {
            // @ts-expect-error An event handler is an event name, not a function.
            change: () => 'cityChanged',
          },
        },
        {
          uid: 'phone',
          kind: 'input',
          type: 'textinput',
          path: 'phone',
          props: {
            // @ts-expect-error A prop is a value, not a function.
            placeholder: () => 'Your phone',
          },
        },
      ],
    });

    // The `@ts-expect-error` lines above are the check: one that finds no error fails the run.
    expect(formDef.form.children).toHaveLength(5);
  });

  it('does not compile with a text outside the fixed list of a prop', () => {
    const formDef = golemForm().create({
      form: [
        {
          uid: 'saved',
          kind: 'display',
          type: 'alert',
          props: {
            text: 'Saved',
            // @ts-expect-error The level is one text of a fixed list.
            level: 'superbad',
          },
        },
        {
          uid: 'save',
          kind: 'action',
          type: 'button',
          label: 'Save',
          // @ts-expect-error The action type is `button` or `submit`.
          actionType: 'reset',
        },
      ],
    });

    expect(formDef.form.children).toHaveLength(2);
  });
});
