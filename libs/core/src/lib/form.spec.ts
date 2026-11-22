import { describe, expect, it } from 'vitest';
import { formDefDecoder } from './form';

// Widgets without an explicit uid must get a stable, position-based uid so that decoding the same JSON twice
// (StrictMode re-initialize, a re-fetched form definition) produces the exact same uids everywhere,
// including inside repeater templates
describe('formDefDecoder - deterministic uids', () => {
  const makeRawFormDef = (): Record<string, any> =>
    JSON.parse(
      JSON.stringify({
        form: {
          kind: 'layout',
          type: 'flex',
          children: [
            { kind: 'display', type: 'text', props: { text: 'hello' } },
            { kind: 'input', type: 'text', path: 'name' },
            {
              kind: 'input',
              type: 'repeater',
              path: 'items',
              props: {
                template: {
                  kind: 'layout',
                  type: 'flex',
                  children: [
                    { kind: 'display', type: 'text', props: { text: 'row' } },
                    { kind: 'input', type: 'text', path: 'qty' },
                    {
                      kind: 'input',
                      type: 'repeater',
                      path: 'tasks',
                      props: {
                        template: {
                          kind: 'layout',
                          type: 'flex',
                          children: [{ kind: 'display', type: 'text', props: { text: 'nested' } }],
                        },
                      },
                    },
                  ],
                },
              },
            },
            { kind: 'action', type: 'button', actionType: 'submit' },
          ],
        },
      }),
    );

  const collectUids = (widget: any, uids: string[] = []): string[] => {
    uids.push(widget.uid);
    for (const child of widget.children ?? []) {
      collectUids(child, uids);
    }
    if (widget.type === 'repeater') {
      collectUids(widget.props.template, uids);
    }
    return uids;
  };

  it('assigns the same uids when decoding two copies of the same definition', () => {
    const firstDecode = formDefDecoder.parse(makeRawFormDef());
    const secondDecode = formDefDecoder.parse(makeRawFormDef());

    const firstUids = collectUids(firstDecode.form);
    const secondUids = collectUids(secondDecode.form);

    expect(firstUids).toEqual(secondUids);
  });

  it('assigns a non-empty, unique uid to every widget, template children included', () => {
    const decoded = formDefDecoder.parse(makeRawFormDef());
    const uids = collectUids(decoded.form);
    expect(uids).toHaveLength(11);
    for (const uid of uids) {
      expect(uid).toBeTruthy();
    }
    expect(new Set(uids).size).toBe(uids.length);
  });

  it('keeps explicit uids untouched', () => {
    const raw = makeRawFormDef();
    raw['form'].children[0].uid = 'myDisplay';
    const decoded = formDefDecoder.parse(raw);

    expect(collectUids(decoded.form)).toContain('myDisplay');
  });

  it('does not mutate the caller form definition', () => {
    const raw = makeRawFormDef();
    formDefDecoder.parse(raw);
    expect(raw).toEqual(makeRawFormDef());
  });
});

describe('formDefDecoder - a function in the definition', () => {
  const message =
    'A form definition is JSON and cannot contain a function. Write a widget as an object, a computed text as a "{{ }}" template, a condition as a "when" rule, a value for one state as a key with a state suffix, and an event handler as an event name.';

  const makeRawFormDef = (secondChild: unknown): Record<string, any> => ({
    form: {
      kind: 'layout',
      type: 'flex',
      children: [{ kind: 'input', type: 'text', path: 'name' }, secondChild],
    },
  });

  it('gives one issue with the path of a widget that is a function', () => {
    const result = formDefDecoder.decode(
      makeRawFormDef(() => ({ kind: 'display', type: 'text', props: { text: 'from a function' } })),
    );

    expect(result.isOk()).toBe(false);
    expect(result).toMatchObject({ issues: [{ message, path: ['form', 'children', 1] }] });
  });

  it('gives the path of a prop that is a function', () => {
    const result = formDefDecoder.decode(
      makeRawFormDef({ kind: 'display', type: 'text', props: { text: () => 'from a function' } }),
    );

    expect(result).toMatchObject({
      issues: [{ message, path: ['form', 'children', 1, 'props', 'text'] }],
    });
  });

  it('throws from parse with the location and the message', () => {
    expect(() => formDefDecoder.parse(makeRawFormDef(() => ({})))).toThrowError(
      `form.children[1]: ${message}`,
    );
  });

  it('keeps a function inside a prop value', () => {
    const formatLabel = () => 'A';
    const items = [{ label: formatLabel }];

    const decoded = formDefDecoder.parse(
      makeRawFormDef({ kind: 'display', type: 'text', props: { items } }),
    );

    expect(decoded.form.children[1].props?.['items']).toBe(items);
  });

  it('decodes the same definition when the widget is an object', () => {
    const result = formDefDecoder.decode(
      makeRawFormDef({ kind: 'display', type: 'text', props: { text: 'from an object' } }),
    );

    expect(result.isOk()).toBe(true);
  });
});
