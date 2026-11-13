import { describe, expect, it } from 'vitest';
import { type State } from '../store/model';
import { initialize } from '../store/reducers/initialize';
import { expandSources } from './repeater';
import { collectWidgetUids, type WidgetUidEntry } from './widget-uid';

const heading = (fields: Record<string, unknown> = {}) => ({
  kind: 'display',
  type: 'heading',
  ...fields,
});
const textInput = (path: string, fields: Record<string, unknown> = {}) => ({
  kind: 'input',
  type: 'textinput',
  path,
  ...fields,
});
const flex = (children: unknown[]) => ({ kind: 'layout', type: 'flex', children });
const repeater = (path: string, children: unknown[], fields: Record<string, unknown> = {}) => ({
  kind: 'input',
  type: 'repeater',
  path,
  props: { template: flex(children), ...fields },
});

describe('collectWidgetUids', () => {
  it('gives each widget its written uid, else its derived uid for an input, else its position uid', () => {
    const entries = collectWidgetUids({
      form: [
        heading(),
        textInput('email'),
        textInput('home', { uid: 'phone' }),
        flex([heading({ uid: 'title' }), textInput('name', { uid: '' })]),
      ],
    });

    expect(entries).toEqual<WidgetUidEntry[]>([
      { uid: '#0', repeaterDepth: 0, pointer: '/form', origin: 'formRoot' },
      { uid: '#0.0', repeaterDepth: 0, pointer: '/form/0', origin: 'position' },
      { uid: 'email-textinput', repeaterDepth: 0, pointer: '/form/1', origin: 'derived' },
      { uid: 'phone', repeaterDepth: 0, pointer: '/form/2', origin: 'written' },
      { uid: '#0.3', repeaterDepth: 0, pointer: '/form/3', origin: 'position' },
      { uid: 'title', repeaterDepth: 0, pointer: '/form/3/children/0', origin: 'written' },
      {
        uid: 'name-textinput',
        repeaterDepth: 0,
        pointer: '/form/3/children/1',
        origin: 'derived',
      },
    ]);
  });

  it('puts the widgets of a repeater template one repeater depth below the repeater', () => {
    const entries = collectWidgetUids({
      form: [repeater('teams', [repeater('teams.items.devs', [heading()])])],
    });

    expect(entries.map(({ uid, repeaterDepth, pointer }) => [uid, repeaterDepth, pointer])).toEqual(
      [
        ['#0', 0, '/form'],
        ['teams-repeater', 0, '/form/0'],
        ['#0.0.t', 1, '/form/0/props/template'],
        ['teams.items.devs-repeater', 1, '/form/0/props/template/children/0'],
        ['#0.0.t.0.t', 2, '/form/0/props/template/children/0/props/template'],
        ['#0.0.t.0.t.0', 2, '/form/0/props/template/children/0/props/template/children/0'],
      ],
    );
  });

  it('skips chunk references, state templates and widgets that the form cannot decode', () => {
    const entries = collectWidgetUids({
      form: [
        { $ref: './contact.form-chunk.json' },
        heading(),
        repeater('rows', [], { 'template.mobile': flex([heading({ uid: 'mobile' })]) }),
        textInput('a', { uid: 5 }),
        { kind: 'input', type: 'textinput', path: 5 },
        { kind: 'input', type: null, path: 'b' },
      ],
    });

    expect(entries.map((entry) => entry.uid)).toEqual(['#0', '#0.1', 'rows-repeater', '#0.2.t']);
  });

  it('returns no entry when the form is not an array', () => {
    expect(collectWidgetUids({ form: flex([]) })).toEqual([]);
    expect(collectWidgetUids(undefined)).toEqual([]);
  });

  // Each repeater gets two rows, so the keys of a widget at repeater depth 2 are `uid[0][0]`,
  // `uid[0][1]`, `uid[1][0]` and `uid[1][1]`.
  it.each([
    {
      name: 'nested layouts',
      form: [
        heading(),
        flex([textInput('name'), flex([textInput('age', { uid: 'age' }), heading()])]),
        textInput('email'),
      ],
      data: {},
    },
    {
      name: 'a repeater',
      form: [
        textInput('title'),
        repeater('contacts', [
          heading(),
          textInput('contacts.items.email'),
          textInput('contacts.items.phone', { uid: 'phone' }),
          flex([textInput('contacts.items.main')]),
        ]),
      ],
      data: { contacts: [{}, {}] },
    },
    {
      name: 'a repeater inside a repeater',
      form: [
        repeater('teams', [
          textInput('teams.items.name'),
          repeater('teams.items.devs', [
            textInput('teams.items.devs.items.name'),
            heading({ uid: 'devTitle' }),
          ]),
        ]),
      ],
      data: { teams: [{ devs: [{}, {}] }, { devs: [{}, {}] }] },
    },
    {
      name: 'two repeaters next to each other',
      form: [
        repeater('home', [textInput('home.items.street')]),
        repeater('work', [textInput('work.items.street'), heading()]),
      ],
      data: { home: [{}, {}], work: [{}, {}] },
    },
  ])('gives the keys of the widgets that the form builds for $name', ({ form, data }) => {
    const state = initialize({ lang: 'en' } as State, {
      type: 'INITIALIZE',
      payload: { formDef: { form }, formName: 'uids' },
    });
    expect(state.formHealth).toEqual({ status: 'ok' });
    const { resolvedSources } = expandSources(state.flatForm, data);

    const expectedKeys = collectWidgetUids({ form }).flatMap((entry) =>
      rowSuffixes(entry.repeaterDepth).map((suffix) => `${entry.uid}${suffix}`),
    );

    expect(Object.keys(resolvedSources).sort()).toEqual(expectedKeys.sort());
  });
});

/** The row suffixes of a widget at a repeater depth when each repeater has two rows. */
function rowSuffixes(repeaterDepth: number): string[] {
  let suffixes = [''];
  for (let depth = 0; depth < repeaterDepth; depth++) {
    suffixes = suffixes.flatMap((suffix) => [`${suffix}[0]`, `${suffix}[1]`]);
  }
  return suffixes;
}
