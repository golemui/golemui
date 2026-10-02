import { describe, expect, it } from 'vitest';
import { type FormWidgetJson } from './types';
import {
  applyPatch,
  asWidgetList,
  cleanWidget,
  removeDuplicateWidgets,
  withIncludeCondition,
} from './widget-json';

const input = (path: string, fields: Partial<FormWidgetJson> = {}): FormWidgetJson => ({
  kind: 'input',
  type: 'text',
  path,
  ...fields,
});

describe('asWidgetList', () => {
  it('turns every build result into a list', () => {
    expect(asWidgetList(null)).toEqual([]);
    expect(asWidgetList(undefined)).toEqual([]);
    expect(asWidgetList(input('a'))).toEqual([input('a')]);
    expect(asWidgetList([input('a'), input('b')])).toHaveLength(2);
  });
});

describe('applyPatch', () => {
  it('copies the patch fields and merges props key by key', () => {
    const widget = input('name', { label: 'Name', props: { hint: 'x', icon: 'user' } });

    const patched = applyPatch(widget, {
      label: 'Full name',
      props: { icon: 'person' },
      size: 6,
      readonly: true,
    });

    expect(patched).toEqual(
      input('name', {
        label: 'Full name',
        props: { hint: 'x', icon: 'person' },
        size: 6,
        readonly: true,
      }),
    );
    // The original is copied, never modified.
    expect(widget.label).toBe('Name');
  });

  it('ignores the fields a patch does not set', () => {
    expect(applyPatch(input('a', { label: 'A' }), { label: undefined })).toEqual(
      input('a', { label: 'A' }),
    );
  });

  it('patches only the first widget of a list', () => {
    const patched = applyPatch([input('a'), input('b')], { label: 'First' });

    expect(patched).toEqual([input('a', { label: 'First' }), input('b')]);
  });

  it('leaves null and a missing patch alone', () => {
    expect(applyPatch(null, { label: 'x' })).toBeNull();
    const widget = input('a');
    expect(applyPatch(widget, undefined)).toBe(widget);
  });
});

describe('withIncludeCondition', () => {
  it('adds the condition to every widget of the result', () => {
    expect(withIncludeCondition(input('a'), '$form.x === 1')).toEqual(
      input('a', { include: { when: '$form.x === 1' } }),
    );
    expect(withIncludeCondition([input('a'), input('b')], 'c')).toEqual([
      input('a', { include: { when: 'c' } }),
      input('b', { include: { when: 'c' } }),
    ]);
  });

  it('combines with an existing when condition and leaves null alone', () => {
    expect(withIncludeCondition(input('a', { include: { when: 'first' } }), 'second')).toEqual(
      input('a', { include: { when: '(first) && second' } }),
    );
    expect(withIncludeCondition(null, 'c')).toBeNull();
  });
});

describe('removeDuplicateWidgets', () => {
  it('removes a later input with the same path, also inside layouts and templates', () => {
    const removed: string[] = [];
    const repeater = input('lines', {
      props: {
        template: {
          kind: 'layout',
          type: 'flex',
          children: [input('lines.items.name'), input('lines.items.name', { type: 'other' })],
        },
      },
    });
    const widgets = [
      input('name'),
      {
        kind: 'layout',
        type: 'flex',
        children: [input('name', { type: 'other' })],
      } as FormWidgetJson,
      repeater,
    ];

    const kept = removeDuplicateWidgets(widgets, (widget, field) =>
      removed.push(`${field}:${String(widget.path)}:${widget.type}`),
    );

    expect(removed).toEqual(['path:name:other', 'path:lines.items.name:other']);
    expect(kept[1].children).toEqual([]);
    expect((kept[2].props?.['template'] as FormWidgetJson).children).toEqual([
      input('lines.items.name'),
    ]);
  });

  it('removes a later widget with the same uid', () => {
    const removed: string[] = [];
    const kept = removeDuplicateWidgets(
      [
        { kind: 'display', type: 'note', uid: 'intro' },
        { kind: 'display', type: 'note', uid: 'intro' },
      ],
      (_widget, field) => removed.push(field),
    );

    expect(kept).toHaveLength(1);
    expect(removed).toEqual(['uid']);
  });
});

describe('cleanWidget', () => {
  it('removes undefined values and sorts the known keys', () => {
    const cleaned = cleanWidget({
      props: { hint: undefined, icon: 'mail' },
      validator: { required: true },
      label: 'Email',
      path: 'email',
      type: 'text',
      kind: 'input',
      uid: undefined,
      custom: 1,
      'validator.us': { required: false },
    });

    expect(Object.keys(cleaned)).toEqual([
      'kind',
      'type',
      'path',
      'label',
      'validator',
      'validator.us',
      'props',
      'custom',
    ]);
    expect(cleaned.props).toEqual({ icon: 'mail' });
  });

  it('cleans children and repeater templates', () => {
    const cleaned = cleanWidget({
      kind: 'input',
      type: 'repeater',
      path: 'lines',
      props: {
        template: {
          type: 'flex',
          kind: 'layout',
          children: [input('lines.items.a', { label: undefined })],
        },
      },
    });

    const template = cleaned.props?.['template'] as FormWidgetJson;
    expect(Object.keys(template)).toEqual(['kind', 'type', 'children']);
    expect(template.children?.[0]).toEqual(input('lines.items.a'));
    expect(Object.keys(template.children?.[0] ?? {})).not.toContain('label');
  });
});
