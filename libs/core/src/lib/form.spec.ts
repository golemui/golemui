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

// A function widget's uid is stored on the function object. It must be position-based, never random,
// so that two processes decoding the same definition (a server render and the client hydrating it)
// agree on it without sharing the function object
describe('formDefDecoder - deterministic function widget uids', () => {
  // Fresh function objects on every call, like a second process decoding the same source
  const makeRawFormDefWithFunction = (): Record<string, any> => ({
    form: {
      kind: 'layout',
      type: 'flex',
      children: [
        { kind: 'input', type: 'text', path: 'name' },
        () => ({ kind: 'display', type: 'text', props: { text: 'from a function' } }),
      ],
    },
  });

  it('assigns the same position uid across decodes of fresh function objects', () => {
    const firstDecode = formDefDecoder.parse(makeRawFormDefWithFunction());
    const secondDecode = formDefDecoder.parse(makeRawFormDefWithFunction());

    expect(firstDecode.form.children[1].uid).toBe(secondDecode.form.children[1].uid);
  });

  it("marks the function widget uid with a final 'f' segment", () => {
    const decoded = formDefDecoder.parse(makeRawFormDefWithFunction());
    expect(decoded.form.children[1].uid).toBe('#0.1.f');
  });

  it('keeps the first uid when the same function object is decoded again at another position', () => {
    const raw = makeRawFormDefWithFunction();
    const sharedFunction = raw['form'].children[1];
    formDefDecoder.parse(raw);

    const rawWithFunctionFirst: Record<string, any> = {
      form: { kind: 'layout', type: 'flex', children: [sharedFunction] },
    };
    const decoded = formDefDecoder.parse(rawWithFunctionFirst);

    expect(decoded.form.children[0].uid).toBe('#0.1.f');
  });

  it('keeps a uid supplied by the widget the function returns', () => {
    const raw: Record<string, any> = {
      form: {
        kind: 'layout',
        type: 'flex',
        children: [() => ({ kind: 'display', type: 'text', uid: 'explicitUid', props: {} })],
      },
    };
    const decoded = formDefDecoder.parse(raw);

    expect(decoded.form.children[0].uid).toBe('explicitUid');
  });
});
