import type { FormSubmitEvent } from '@golemui/core';
import {
  GameShell,
  GuiArtifact,
  ReturnBar,
  type GameApi,
  type GameConfig,
  type Framework,
} from '@golemui/demo-engine';
import { GuiForm, widgetLoaders } from '@golemui/gui-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  deriveFormDefinition,
  deriveFormDsl,
  type EndpointPayload,
  type FieldSchema,
  type FieldType,
  type RecordSchema,
} from './deriveFormDefinition';
import { ENDPOINTS, FIELD_TYPES, type EndpointId } from './endpoints';

const NETWORK_DELAY_MS = 140;
const SHAPE_EDIT_THRESHOLD = 2;
const BASE_FORMS: EndpointId[] = ['profile', 'orders', 'feedback'];

/* ─── Per-framework code targets ─────────────────────────────────────── */

// The install shown in the boss beat — the primary {gui.} package per framework
// (the full set lives in each templates/forms-as-data-* starter). Never the
// fictional `npm install golemui`.
const INSTALL_BY_FW: Record<Framework, string> = {
  react: 'npm i @golemui/gui-react',
  angular: 'npm i @golemui/gui-angular',
  vue: 'npm i @golemui/gui-vue',
  lit: 'npm i @golemui/gui-lit',
  vanilla: 'npm i @golemui/gui-lit',
};

/* ─── Scenes (content + cinematic flags) ─────────────────────────────── */

interface SashaScene {
  chapter: string; act?: string; title: string; quest?: string;
  boss?: boolean; bossTitle?: string; itemGet?: boolean;
  lines: string[]; counter?: string; cta?: string;
}

const SCENES: SashaScene[] = [
  { chapter: '00', title: 'CHOOSE YOUR HERO', quest: 'Pick your class',
    lines: ['BEFORE THE QUEST: A CHOICE.', 'GOLEMUI RUNS IN ANY FRAMEWORK. WHICH IS YOURS?'], cta: '▶ BEGIN' },
  { chapter: '01', act: 'ACT I', title: 'THE QUEST', quest: 'Code three forms by hand',
    lines: [] }, // dialog computed from forms built
  { chapter: '02', act: 'ACT II', title: 'THE SERVER!!', boss: true, bossTitle: '👹 THE SERVER',
    quest: 'Survive the mutating server',
    lines: ['YOUR USERS WILL DEMAND MORE — UP TO N ENDPOINTS.', 'AND EACH ONE IS DYNAMIC. THE SHAPES MUTATE.', 'HAND-CODE THAT. I DARE YOU.'], counter: 'N' },
  { chapter: '03', act: 'ACT III', title: 'ITEM GET', itemGet: true, quest: 'Claim the engine',
    lines: ['A LEGENDARY ENGINE IS BESTOWED UPON YOU.', 'IT IS CALLED GOLEMUI. IT HANDLES FORMS AS DATA—', '—MAP A SCHEMA, AND THE FORM RENDERS ITSELF.'], cta: 'WIELD IT ▶' },
  { chapter: '04', act: 'ACT IV', title: 'WIELD IT', quest: 'Be the backend — shapes are data',
    lines: ['YOU ARE THE BACKEND NOW. EDIT THE RESPONSE SHAPE—', 'RENAME A FIELD, CHANGE A TYPE, ADD ONE. THE APP REBUILDS.', 'THEN SAVE: A TYPED PAYLOAD COMES STRAIGHT BACK.'], cta: 'TAKE ME TO THE APP ▶' },
];

const REVEAL_PAYLOAD = `{
  data:   { name: "Ada", country: "GB", ... },
  schema: { name: "string", country: "enum", ... }
}`;

const BASE_FORM_DEFS: { id: EndpointId; label: string }[] = [
  { id: 'profile', label: 'Code the “My Profile”' },
  { id: 'orders', label: 'Code the “My Orders”' },
  { id: 'feedback', label: 'Code the “Feedback”' },
];

// Scene 1 — the dialog shifts as the three forms get coded; the third one
// triggers the fake-victory tease right before THE SERVER lands.
function questDialog(n: number): { lines: string[]; counter?: string; cta?: string } {
  if (n >= 3) {
    return {
      lines: ['Well DONE! See? Building forms is THAT easy.', 'Anyone could crank these out all day… right?', '…RIGHT?'],
      counter: '✓✓✓', cta: 'RIGHT…? ▶',
    };
  }
  const lines =
    n === 2
      ? ['TWO whole forms. Look at you go.', 'One to go. Try to contain yourself.']
      : n === 1
        ? ['…oh. You actually coded one. Adorable.', 'Only two more. Tick. Tock.']
        : ['Ah… a CHALLENGER. So you would BUILD APPS?', 'Cute. Prove it — code me three forms by hand.', 'Profile, Orders, Feedback. Try to stay awake.'];
  return { lines, counter: `${n}/3`, cta: undefined };
}

/* ─── Record builder helpers ─────────────────────────────────────────── */

type RecordRow = { id: string; name: string; field: FieldSchema; value: string };

function valueToString(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return String(v);
}
function stringToValue(s: string, type: FieldType): unknown {
  if (type === 'number') return s === '' ? 0 : Number(s);
  if (type === 'boolean') return s.trim().toLowerCase() === 'true';
  return s;
}
function rowsFromPayload(payload: EndpointPayload): RecordRow[] {
  return Object.entries(payload.schema).map(([name, field]) => ({
    id: crypto.randomUUID(),
    name,
    field,
    value: valueToString(payload.data[name]),
  }));
}
// Turn a field key into a readable label (snake/kebab/camel → Title-ish).
function humanize(key: string): string {
  const s = key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : key;
}
function buildPayload(rows: RecordRow[]): EndpointPayload {
  const schema: RecordSchema = {};
  const data: Record<string, unknown> = {};
  for (const r of rows) {
    const key = r.name.trim();
    if (!key) continue;
    // Always give the field a label — user-added rows only edit the key, so an
    // empty label would render blank (and a broken boolean toggle).
    const field: FieldSchema = {
      ...r.field,
      label: r.field.label?.trim() ? r.field.label : humanize(key),
    };
    // Enum options need a value to drive the data; drop half-typed (blank-value)
    // options so a freshly-added option never renders as an empty dropdown item,
    // and fall back to the value when its label hasn't been typed yet.
    if (field.type === 'enum') {
      field.options = (field.options ?? [])
        .map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
        .filter((o) => o.value.trim() !== '')
        .map((o) => ({ value: o.value, label: o.label.trim() ? o.label : o.value }));
    }
    schema[key] = field;
    data[key] = stringToValue(r.value, r.field.type);
  }
  return { schema, data };
}
// The form's remount key — its STRUCTURE (fields, types, options), derived from
// the built schema so half-typed blank options don't churn it.
function schemaKey(schema: RecordSchema): string {
  return Object.entries(schema)
    .map(
      ([name, f]) =>
        `${name}:${f.type}:${(f.options ?? [])
          .map((o) => (typeof o === 'string' ? o : `${o.value}=${o.label}`))
          .join('|')}`,
    )
    .join(',');
}

// Lightweight JSON syntax highlight for the middle column — keys / strings /
// keywords / numbers / punctuation, matching the {gui.} code-window palette.
function highlightJson(json: string): ReactNode[] {
  const re = /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)|([{}[\],])/g;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(json))) {
    if (m.index > last) out.push(json.slice(last, m.index));
    if (m[1]) out.push(<span key={k++} className="t-key">{m[1]}</span>);
    else if (m[2]) out.push(<span key={k++} className="t-str">{m[2]}</span>);
    else if (m[3]) out.push(<span key={k++} className="t-kw">{m[3]}</span>);
    else if (m[4]) out.push(<span key={k++} className="t-num">{m[4]}</span>);
    else out.push(<span key={k++} className="t-punc">{m[0]}</span>);
    last = re.lastIndex;
  }
  if (last < json.length) out.push(json.slice(last));
  return out;
}

/* ─── Launch params ──────────────────────────────────────────────────── */

const PARAMS =
  typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
// App-direct by default — the runnable app shows immediately. The guided 8-bit
// walk is opt-in via ?mode=walk (the "Play the quest" CTA on /demos).
const START_BARE = PARAMS.get('mode') !== 'walk';
const FW_IDS: Framework[] = ['react', 'angular', 'lit', 'vue', 'vanilla'];
const START_FW = FW_IDS.find((f) => f === PARAMS.get('fw')) ?? null;

/* ─── App — thin orchestrator over the shared engine ─────────────────── */

export function App() {
  const [endpointRows, setEndpointRows] = useState<Record<string, RecordRow[]>>({});
  const [hasResponded, setHasResponded] = useState(START_BARE);
  const [tab, setTab] = useState<string | null>(START_BARE ? 'profile' : null);
  const [shapeEdits, setShapeEdits] = useState(0);
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null);
  const [pulse, setPulse] = useState(false);

  // Fetch / hydrate rows on tab change (simulated network for the base forms).
  useEffect(() => {
    if (tab == null) return;
    const ep = ENDPOINTS.find((e) => e.id === tab);
    if (!ep) return;
    if (endpointRows[tab]) {
      setHasResponded(true);
      return;
    }
    let cancelled = false;
    setHasResponded(false);
    const t = setTimeout(() => {
      if (cancelled) return;
      setEndpointRows((prev) => ({ ...prev, [tab]: rowsFromPayload(ep.payload) }));
      setHasResponded(true);
    }, NETWORK_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [tab, endpointRows]);

  // Each edit flashes the form — makes cause→effect obvious.
  useEffect(() => {
    if (shapeEdits === 0) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 650);
    return () => clearTimeout(t);
  }, [shapeEdits]);

  const rows = (tab && endpointRows[tab]) || [];
  const derivedPayload = useMemo(() => buildPayload(rows), [rows]);
  const formMountKey = useMemo(() => schemaKey(derivedPayload.schema), [derivedPayload]);
  // Stable config — only rebuilt when the shape/data actually changes, so the
  // form store isn't re-initialized on every unrelated render (e.g. the pulse).
  const guiConfig = useMemo(
    () => ({
      formDef: deriveFormDefinition(derivedPayload.schema),
      data: derivedPayload.data,
      formConfig: { widgetLoaders },
    }),
    [derivedPayload],
  );
  const hasFields = rows.some((r) => r.name.trim());
  const formsBuilt = Object.values(endpointRows).filter((r) => r.length > 0).length;
  const baseFormsBuilt = BASE_FORMS.filter((id) => endpointRows[id]?.length).length;

  function handleTabClick(id: string) {
    setTab(id);
    setSubmitted(null);
  }
  function bumpEdits() {
    setShapeEdits((n) => n + 1);
    setSubmitted(null);
  }
  function patchTabRows(updater: (rs: RecordRow[]) => RecordRow[]) {
    if (!tab) return;
    setEndpointRows((prev) => ({ ...prev, [tab]: updater(prev[tab] ?? []) }));
  }
  function updateRow(id: string, patch: Partial<RecordRow>) {
    patchTabRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    bumpEdits();
  }
  function updateField(id: string, patch: Partial<FieldSchema>) {
    patchTabRows((rs) => rs.map((r) => (r.id === id ? { ...r, field: { ...r.field, ...patch } } : r)));
    bumpEdits();
  }
  function removeRow(id: string) {
    patchTabRows((rs) => rs.filter((r) => r.id !== id));
    bumpEdits();
  }
  function addRow() {
    patchTabRows((rs) => [
      ...rs,
      { id: crypto.randomUUID(), name: '', field: { type: 'string', label: '' }, value: '' },
    ]);
    bumpEdits();
  }

  /* ── Stage pieces ── */

  function recordBuilderCard(api: GameApi) {
    return (
      <article className="card card--endpoint">
        <div className="card-head">
          {api.bare ? (
            <span className="server-resp">
              <span className="card-tag">◢ SERVER</span>
              <span className="sr-method">GET</span>
              <code className="sr-path">
                {ENDPOINTS.find((e) => e.id === tab)?.path ?? '/api/profile/me'}
              </code>
              <span className="sr-status">200 OK</span>
            </span>
          ) : (
            <span className="card-tag">📡 MOCK BACKEND</span>
          )}
        </div>
        <div className="card-body endpoint-body">
          {!api.bare && (
            <p className="endpoint-blurb">
              You are the backend. Edit the response shape — rename a field, change a type, add a
              new one. The App rebuilds itself.
            </p>
          )}
          {api.bare && (
            <p className="server-hint">
              This is your backend&rsquo;s JSON response. <strong>Edit any cell</strong> — rename a
              field, change a type, add one — and watch GolemUI rebuild the form.
            </p>
          )}
          <div className="record-builder">
            {api.bare && (
              <div className="record-head" aria-hidden="true">
                <span>FIELD</span>
                <span>TYPE</span>
                <span>VALUE</span>
                <span />
              </div>
            )}
            {rows.map((row) => (
              <RecordFieldRow
                key={row.id}
                row={row}
                onName={(name) => updateRow(row.id, { name })}
                onType={(type) =>
                  updateField(row.id, {
                    type,
                    format: type === 'string' ? row.field.format : undefined,
                    options: type === 'enum' ? row.field.options : undefined,
                  })
                }
                onValue={(value) => updateRow(row.id, { value })}
                onOptions={(options) => updateField(row.id, { options })}
                onRemove={() => removeRow(row.id)}
              />
            ))}
            <button type="button" className="add-row" onClick={addRow}>
              + ADD FIELD
            </button>
          </div>
        </div>
      </article>
    );
  }

  // Middle column — the GolemUI JSON definition the SERVER shape produces. The
  // honest "forms as data" beat: the response IS the form definition, and the
  // right column renders exactly this. Regenerates live as the shape is edited.
  function jsonDslCard() {
    const json = JSON.stringify(deriveFormDsl(derivedPayload.schema), null, 2);
    return (
      <article className="card card--code">
        <div className="card-head">
          <span className="card-tag">◈ JSON</span>
          <span className="card-sub">
            the <code>{'{gui.}'}</code> definition — derived from the shape
          </span>
        </div>
        <div className="card-body code-body">
          <div className="code-banner" role="group" aria-label="The GolemUI JSON definition">
            <pre className={`cb-code${pulse ? ' is-pulse' : ''}`}>
              <code>{highlightJson(json)}</code>
            </pre>
          </div>
        </div>
      </article>
    );
  }

  function appCard(api: GameApi, opts: { solo: boolean; showReturn: boolean }) {
    const tabsClickable = api.bare || api.scene >= 4;
    return (
      <article className={`card card--app${opts.solo ? ' card--app-solo' : ''}`}>
        {api.bare && (
          <div className="card-head card-head--form">
            <span className="card-tag">▶ THE FORM</span>
            <span className="card-sub">renders the form from that data — no form code</span>
            <span className={`form-live${pulse ? ' is-on' : ''}`} aria-hidden="true">
              ● {pulse ? 'RE-RENDERED' : 'LIVE'}
            </span>
          </div>
        )}
        <nav className="app-tabs" role="tablist" aria-label="App routes">
          {ENDPOINTS.map((e) => (
            <button
              key={e.id}
              type="button"
              role="tab"
              aria-selected={e.id === tab}
              aria-disabled={!tabsClickable}
              className={[
                'app-tab',
                e.id === tab ? 'is-active' : '',
                !tabsClickable ? 'is-locked' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={tabsClickable ? () => handleTabClick(e.id) : undefined}
            >
              {e.label}
            </button>
          ))}
        </nav>
        <div className={`card-body app-host${pulse ? ' is-rebuilt' : ''}`}>
          {hasFields ? (
            <GuiForm
              key={formMountKey}
              config={guiConfig}
              formSubmit={(e: FormSubmitEvent) => setSubmitted(e.data)}
            />
          ) : (
            <div className="app-empty">
              <p>{api.scene === 1 ? 'Pick a form to code — from the menu below.' : 'Forge fields on the left.'}</p>
            </div>
          )}
          {opts.showReturn && hasFields && (
            <ReturnBar
              data={submitted}
              filledNote="typed straight from the data — numbers, booleans, dates, whatever the shape. No parsing on your end."
              idleNote={
                <>
                  Hit <strong>Save</strong> — the form hands its <strong>typed</strong> payload
                  straight back, valid against whatever rules the schema declared.
                </>
              }
            />
          )}
        </div>
      </article>
    );
  }

  function renderWalkStage(api: GameApi) {
    if (api.scene === 1) return appCard(api, { solo: true, showReturn: false });
    if (api.scene === 2) return <GuiArtifact />;
    if (api.scene === 3) return appCard(api, { solo: true, showReturn: false });
    // Act IV — wield: be the backend, edit shapes, Save → typed payload.
    return (
      <>
        {recordBuilderCard(api)}
        {appCard(api, { solo: false, showReturn: true })}
      </>
    );
  }

  const config: GameConfig = {
    shellClass: 'sasha-shell',
    scenes: SCENES,
    startBare: START_BARE,
    startFramework: START_FW,
    title: 'FORMS AS DATA',
    bareTitle: 'FORMS AS DATA',
    bareQuestTease: 'Want the story? Out-build THE SERVER!! in a quick 8-bit quest.',
    lines: (api) => (api.scene === 1 ? questDialog(baseFormsBuilt).lines : SCENES[api.scene]?.lines ?? []),
    counter: (api) => (api.scene === 1 ? questDialog(baseFormsBuilt).counter : SCENES[api.scene]?.counter),
    cta: (api) => (api.scene === 1 ? questDialog(baseFormsBuilt).cta : SCENES[api.scene]?.cta),
    options: (api) => {
      if (api.bare) return [];
      if (api.scene === 1) {
        return BASE_FORM_DEFS.filter((d) => !endpointRows[d.id]?.length).map((d, i) => ({
          key: String(i + 1),
          label: d.label,
          action: () => handleTabClick(d.id),
        }));
      }
      if (api.scene === 2) {
        return [
          { key: '1', label: INSTALL_BY_FW[api.framework ?? 'react'], action: api.next },
          { key: '2', label: 'Nah… I’ll do it by hand', action: api.panic },
        ];
      }
      return [];
    },
    engagement: (api) => {
      if (api.scene === 0) return api.framework !== null;
      if (api.scene === 1) return baseFormsBuilt >= 3 && hasResponded;
      if (api.scene === 2) return false;
      if (api.scene === 4) return shapeEdits >= SHAPE_EDIT_THRESHOLD;
      return true;
    },
    stats: (api) => [
      { label: 'FORMS', value: formsBuilt, accent: 'info' },
      { label: 'LOC', value: api.frenzy ? api.frenzyVal : formsBuilt * 89, frenzy: api.frenzy, accent: 'warning' },
    ],
    reveal: () => ({
      title: 'THE SERVER!!',
      subtitle: 'UP TO N ENDPOINTS',
      payload: REVEAL_PAYLOAD,
      footer: 'EACH ONE MUTATES · NOW WHAT?',
    }),
    zelda: { name: 'GOLEMUI', spell: 'THE FORM ENGINE' },
    gameOver: (v) => ({
      statLine: `${v} LINES HAND-WRITTEN · 0 SHIPPED`,
      sub: 'The forms multiplied. You did not.',
    }),
    onScene: (scene) => {
      if (scene >= 4 && tab == null) setTab('profile');
    },
    onEnterBare: () => {
      setTab((t) => t ?? 'profile');
      setSubmitted(null);
    },
    onRestart: () => {
      setEndpointRows({});
      setHasResponded(false);
      setTab(null);
      setShapeEdits(0);
      setSubmitted(null);
    },
    renderStage: renderWalkStage,
    renderBare: (api) => (
      <div className="bare-hero">
        {recordBuilderCard(api)}
        {jsonDslCard()}
        {appCard(api, { solo: false, showReturn: true })}
      </div>
    ),
  };

  return <GameShell {...config} />;
}

/* ─── RecordFieldRow ─────────────────────────────────────────────────── */

type OptionPair = { label: string; value: string };

interface RecordFieldRowProps {
  row: RecordRow;
  onName: (s: string) => void;
  onType: (t: FieldType) => void;
  onValue: (s: string) => void;
  onOptions: (options: OptionPair[]) => void;
  onRemove: () => void;
}

function RecordFieldRow({ row, onName, onType, onValue, onOptions, onRemove }: RecordFieldRowProps) {
  // Normalize options to {value,label} pairs — older shapes may carry bare
  // strings; the editor always edits both fields so a value alone is never
  // enough to drive the data, and the label drives what the dropdown shows.
  const opts: OptionPair[] = (row.field.options ?? []).map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o,
  );
  const patchOpt = (i: number, patch: Partial<OptionPair>) =>
    onOptions(opts.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  return (
    <div className="record-row">
      <input
        className="rr-name"
        value={row.name}
        placeholder="field name"
        onChange={(e) => onName(e.target.value)}
      />
      <select
        className="rr-type"
        value={row.field.type}
        onChange={(e) => onType(e.target.value as FieldType)}
      >
        {FIELD_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <input
        className="rr-value"
        value={row.value}
        placeholder="value"
        onChange={(e) => onValue(e.target.value)}
      />
      <button type="button" className="rr-remove" onClick={onRemove} aria-label="Remove field">
        ✕
      </button>
      {row.field.type === 'enum' && (
        <div className="rr-options">
          <span className="rr-options-cap">options</span>
          {opts.map((opt, i) => (
            <div className="rr-option" key={i}>
              <input
                className="rr-opt-value"
                placeholder="value"
                value={opt.value}
                onChange={(e) => patchOpt(i, { value: e.target.value })}
              />
              <input
                className="rr-opt-label"
                placeholder="label"
                value={opt.label}
                onChange={(e) => patchOpt(i, { label: e.target.value })}
              />
              <button
                type="button"
                className="rr-opt-remove"
                aria-label="Remove option"
                onClick={() => onOptions(opts.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            className="rr-opt-add"
            onClick={() => onOptions([...opts, { value: '', label: '' }])}
          >
            + add option
          </button>
        </div>
      )}
    </div>
  );
}
