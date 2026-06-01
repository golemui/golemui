import type { FormSubmitEvent } from '@golemui/core';
import { GuiForm, widgetLoaders } from '@golemui/gui-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  deriveFormDefinition,
  type EndpointPayload,
  type FieldSchema,
  type FieldType,
  type RecordSchema,
} from './deriveFormDefinition';
import {
  ENDPOINTS,
  FIELD_TYPES,
  type Endpoint,
  type EndpointId,
} from './endpoints';

const NETWORK_DELAY_MS = 140;
const REVEAL_DURATION_MS = 2900; // matches the CSS overlay-out (no dead tail)
const ZELDA_DURATION_MS = 3400;
const MAX_ENDPOINTS = 5;

/* ─── Characters ─────────────────────────────────────────────────────── */

type Framework = 'react' | 'angular' | 'lit' | 'vue' | 'vanilla';

interface Character {
  id: Framework;
  name: string;
  klass: string;
  color: string;
  shadow: string;
  monogram: string;
}

const CHARACTERS: Character[] = [
  { id: 'react',   name: 'REACT',   klass: 'HOOK CASTER',     color: '#61dafb', shadow: '#0e7a9e', monogram: 'R' },
  { id: 'angular', name: 'ANGULAR', klass: 'DI PALADIN',      color: '#dd0031', shadow: '#7a0019', monogram: 'A' },
  { id: 'lit',     name: 'LIT',     klass: 'WEB-NATIVE MAGE', color: '#324fff', shadow: '#1a2c99', monogram: 'L' },
  { id: 'vue',     name: 'VUE',     klass: 'REACTIVE RANGER', color: '#41b883', shadow: '#1f6e4d', monogram: 'V' },
  { id: 'vanilla', name: 'JS',      klass: 'VANILLA ROGUE',   color: '#f7df1e', shadow: '#8a7a00', monogram: '{}' },
];

// Each framework's runnable forms-as-data starter (opened by VIEW THE CODE),
// and the one line that mounts the form in that framework. The mapper itself
// is identical everywhere — only the host changes.
const TEMPLATE_BY_FW: Record<Framework, string> = {
  react: 'forms-as-data',
  angular: 'forms-as-data-angular',
  lit: 'forms-as-data-lit',
  vue: 'forms-as-data-vue',
  vanilla: 'forms-as-data-js',
};

const MOUNT_BY_FW: Record<Framework, string> = {
  react: '<GuiForm config={config} formSubmit={onSubmit} />',
  angular: '<gui-form [config]="config" (formSubmit)="onSubmit($event)">',
  vue: '<GuiForm :config="config" @form-submit="onSubmit" />',
  lit: '<gui-form .config=${config} @formSubmit=${onSubmit}>',
  vanilla: "form.config = config;\nform.addEventListener('formSubmit', onSubmit);",
};

/* ─── Scenes ─────────────────────────────────────────────────────────── */

type SceneId = 0 | 1 | 2 | 3 | 4;

// A choice presented inside the prompt — activatable by keyboard or mouse.
interface DialogOption {
  key: string;
  label: string;
  done?: boolean;
  action: () => void;
}

interface SceneMeta {
  id: SceneId;
  chapter: string;
  title: string;
}

const SCENES: SceneMeta[] = [
  { id: 0, chapter: '00', title: 'CHOOSE YOUR HERO' },
  { id: 1, chapter: '01', title: 'THE QUEST' },
  { id: 2, chapter: '02', title: 'THE SERVER!!' },
  { id: 3, chapter: '03', title: 'ITEM GET' },
  { id: 4, chapter: '04', title: 'WIELD IT' },
];

const ENDING_META = { chapter: '??', title: 'TO BE CONTINUED' };
const ENDING_LINES = [
  'THE SERVER FLED INTO THE NIGHT.',
  'YOUR FORMS STAND TALL — NONE WERE HAND-WRITTEN.',
  '… THE REST OF THE TALE AWAITS A FUTURE COMMIT.',
];

/* ─── Record builder helpers ─────────────────────────────────────────── */

type RecordRow = {
  id: string;
  name: string;
  field: FieldSchema;
  value: string;
};

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

function buildPayload(rows: RecordRow[]): EndpointPayload {
  const schema: RecordSchema = {};
  const data: Record<string, unknown> = {};
  for (const r of rows) {
    const key = r.name.trim();
    if (!key) continue;
    schema[key] = r.field;
    data[key] = stringToValue(r.value, r.field.type);
  }
  return { schema, data };
}

function schemaKey(rows: RecordRow[]): string {
  return rows
    .filter((r) => r.name.trim())
    .map(
      (r) =>
        `${r.name}:${r.field.type}:${(r.field.options ?? [])
          .map((o) => (typeof o === 'string' ? o : o.value))
          .join('|')}`,
    )
    .join(',');
}

/* ─── App ────────────────────────────────────────────────────────────── */

const SHAPE_EDIT_THRESHOLD = 2;
const SWORD_UNLOCK_SCENE = 3;

// Launch params from /demos. ?mode=bare → sandbox; ?fw=<framework> → hero
// already chosen on the adventure-select screen, so skip CH.00.
const PARAMS =
  typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();
const START_BARE = PARAMS.get('mode') === 'bare';
const FW_IDS: Framework[] = ['react', 'angular', 'lit', 'vue', 'vanilla'];
const START_FW = FW_IDS.find((f) => f === PARAMS.get('fw')) ?? null;

const inIframe = typeof window !== 'undefined' && window.parent !== window;

export function App() {
  const [sceneId, setSceneId] = useState<SceneId>(
    START_FW && !START_BARE ? 1 : 0,
  );
  const [bareMode, setBareMode] = useState(START_BARE);
  const [reachedEnding, setReachedEnding] = useState(false);
  const [framework, setFramework] = useState<Framework | null>(
    START_BARE ? START_FW ?? 'react' : START_FW,
  );
  const [tab, setTab] = useState<string | null>(START_BARE ? 'profile' : null);
  const [endpointRows, setEndpointRows] = useState<Record<string, RecordRow[]>>({});
  const [customEndpoints, setCustomEndpoints] = useState<Endpoint[]>([]);
  const [hasResponded, setHasResponded] = useState(false);
  const [shapeEdits, setShapeEdits] = useState(0);
  const [seenReveal, setSeenReveal] = useState(false);
  const [revealActive, setRevealActive] = useState(false);
  const [seenZelda, setSeenZelda] = useState(false);
  const [zeldaActive, setZeldaActive] = useState(false);
  const [byHand, setByHand] = useState(false); // "do it by hand" frenzy
  const [frenzyLoc, setFrenzyLoc] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false); // quest complete screen
  const [typingDone, setTypingDone] = useState(false); // top prompt finished
  const [rebuiltPulse, setRebuiltPulse] = useState(false); // flashes the form on each edit
  const [mapType, setMapType] = useState<FieldType | null>(null); // last-edited field type — pulses its case in the mapper
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null); // the typed payload Save handed back

  // Visible endpoints — all three forms are available from the start.
  const sceneNumber = reachedEnding ? 99 : (sceneId as number);
  const visibleEndpoints: Endpoint[] = useMemo(
    () => [...ENDPOINTS, ...customEndpoints],
    [customEndpoints],
  );

  // Boss attack reveal — fires on entering CH.02 (THE SERVER).
  useEffect(() => {
    if (sceneId !== 2 || seenReveal || reachedEnding) return;
    setRevealActive(true);
    const t = setTimeout(() => {
      setRevealActive(false);
      setSeenReveal(true);
    }, REVEAL_DURATION_MS);
    return () => clearTimeout(t);
  }, [sceneId, seenReveal, reachedEnding]);

  // Zelda sword cinematic on first scene-3 entry
  useEffect(() => {
    if (sceneId !== 3 || seenZelda || reachedEnding) return;
    setZeldaActive(true);
    const t = setTimeout(() => {
      setZeldaActive(false);
      setSeenZelda(true);
    }, ZELDA_DURATION_MS);
    return () => clearTimeout(t);
  }, [sceneId, seenZelda, reachedEnding]);

  // "Do it by hand" — counters spiral out of control, then GAME OVER.
  useEffect(() => {
    if (!byHand) return;
    let v = 0;
    const spin = setInterval(() => {
      v += 90 + Math.floor(Math.random() * 320);
      setFrenzyLoc(v);
    }, 45);
    const over = setTimeout(() => {
      clearInterval(spin);
      setByHand(false);
      setGameOver(true);
    }, 2300);
    return () => {
      clearInterval(spin);
      clearTimeout(over);
    };
  }, [byHand]);

  // Each edit to the data flashes the form — makes the cause→effect obvious.
  useEffect(() => {
    if (!bareMode || shapeEdits === 0) return;
    setRebuiltPulse(true);
    const t = setTimeout(() => setRebuiltPulse(false), 650);
    return () => clearTimeout(t);
  }, [shapeEdits, bareMode]);

  // Fetch / hydrate rows on tab change
  useEffect(() => {
    if (tab == null) return;
    const ep = visibleEndpoints.find((e) => e.id === tab);
    if (!ep) return;

    // If we already have rows for this tab, just restore them (no refetch).
    if (endpointRows[tab]) {
      setHasResponded(true);
      return;
    }

    // Custom endpoint — no network, immediate.
    if (tab.startsWith('custom-')) {
      setEndpointRows((prev) => ({ ...prev, [tab]: [] }));
      setHasResponded(true);
      return;
    }

    // Base endpoint — simulated network.
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
  }, [tab, visibleEndpoints, endpointRows]);

  const endpoint = useMemo<Endpoint | null>(
    () => (tab ? visibleEndpoints.find((e) => e.id === tab) ?? null : null),
    [tab, visibleEndpoints],
  );

  const character = useMemo<Character | null>(
    () => (framework ? CHARACTERS.find((c) => c.id === framework)! : null),
    [framework],
  );

  const rows = (tab && endpointRows[tab]) || [];
  const derivedPayload = useMemo(() => buildPayload(rows), [rows]);
  const formMountKey = useMemo(() => schemaKey(rows), [rows]);

  function handleTabClick(id: string) {
    setTab(id);
    setSubmitted(null); // the readout belongs to the form you're leaving
  }

  function bumpEdits() {
    setShapeEdits((n) => n + 1);
    setSubmitted(null); // shape/value changed — the last payload is stale
  }

  // Record the field type just touched so the mapper can pulse its case.
  function noteEdit(type: FieldType) {
    setMapType(type);
  }

  function patchTabRows(updater: (rs: RecordRow[]) => RecordRow[]) {
    if (!tab) return;
    setEndpointRows((prev) => ({
      ...prev,
      [tab]: updater(prev[tab] ?? []),
    }));
  }

  function updateRow(id: string, patch: Partial<RecordRow>) {
    patchTabRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    bumpEdits();
  }

  function updateField(id: string, patch: Partial<FieldSchema>) {
    patchTabRows((rs) =>
      rs.map((r) =>
        r.id === id ? { ...r, field: { ...r.field, ...patch } } : r,
      ),
    );
    bumpEdits();
  }

  function removeRow(id: string) {
    patchTabRows((rs) => rs.filter((r) => r.id !== id));
    bumpEdits();
  }

  function addRow() {
    patchTabRows((rs) => [
      ...rs,
      {
        id: crypto.randomUUID(),
        name: '',
        field: { type: 'string', label: '' },
        value: '',
      },
    ]);
    bumpEdits();
  }

  function addEndpoint() {
    if (visibleEndpoints.length >= MAX_ENDPOINTS) return;
    const n = customEndpoints.length + 1;
    const id = `custom-${n}`;
    const newEp = {
      id: id as EndpointId,
      method: 'GET' as const,
      path: `/api/custom/${n}`,
      label: `Endpoint #${n + 3}`,
      blurb: 'A user-forged shape.',
      payload: { data: {}, schema: {} },
    };
    setCustomEndpoints((cs) => [...cs, newEp]);
    setTab(id);
    bumpEdits();
  }

  const scene = reachedEnding ? null : SCENES[sceneId];

  // The quest — count how many of the three forms have been forged.
  const baseFormsBuilt = (['profile', 'orders', 'feedback'] as const).filter(
    (id) => endpointRows[id] && endpointRows[id].length > 0,
  ).length;

  const isBoss = !reachedEnding && !bareMode && sceneId === 2;

  const engagementMet = (() => {
    if (reachedEnding) return false;
    if (sceneId === 0) return framework !== null;
    if (sceneId === 1) return baseFormsBuilt >= 3 && hasResponded;
    if (sceneId === 2) return !revealActive;
    if (sceneId === 3) return !zeldaActive;
    if (sceneId === 4) return shapeEdits >= SHAPE_EDIT_THRESHOLD;
    return false;
  })();

  function goScene(id: SceneId) {
    setSceneId(id);
  }

  function next() {
    if (!engagementMet) return;
    // CH.03 ITEM GET "WIELD IT" → the victory screen.
    if (sceneId === 3) {
      setVictory(true);
      return;
    }
    goScene(((sceneId as number) + 1) as SceneId);
  }

  // Victory → "take me to the app": drop all gaming chrome, full app sandbox.
  function goToApp() {
    setVictory(false);
    setBareMode(true);
    setRevealActive(false);
    setZeldaActive(false);
    setSeenReveal(true);
    setSeenZelda(true);
    if (!framework) setFramework('react');
    setTab((t) => t ?? 'profile');
    // Hand off to the host page: show the app embedded in the normal site
    // chrome (header + Docs reachable), keeping the forms just built.
    if (inIframe) window.parent.postMessage({ type: 'golemui-demo-embed' }, '*');
  }

  // "View the code" — opens THIS example in StackBlitz (the home page uses the
  // same mechanism). Each framework has its own runnable forms-as-data starter
  // under templates/, so the code matches the framework the user picked.
  function openCode() {
    const template = TEMPLATE_BY_FW[framework ?? 'react'];
    window.open(
      `https://stackblitz.com/github/golemui/golemui/tree/main/templates/${template}`,
      '_blank',
      'noopener',
    );
  }

  // Leave the bare app — back to /demos if embedded, else restart the walk.
  function exitApp() {
    if (inIframe) {
      window.parent.postMessage({ type: 'golemui-demo-exit' }, '*');
    } else {
      restart();
    }
  }

  function prev() {
    if (reachedEnding) {
      setReachedEnding(false);
      return;
    }
    if (sceneId > 0) goScene(((sceneId as number) - 1) as SceneId);
  }

  // Fat ✕ — skip the walk straight to the app, embedded in the normal site
  // (same destination as "take me to the app").
  function skipToBare() {
    setBareMode(true);
    setRevealActive(false);
    setZeldaActive(false);
    setSeenReveal(true);
    setSeenZelda(true);
    if (!framework) setFramework('react');
    setTab((t) => t ?? 'profile');
    if (inIframe) window.parent.postMessage({ type: 'golemui-demo-embed' }, '*');
  }

  function restart() {
    setSceneId(0);
    setBareMode(false);
    setReachedEnding(false);
    setFramework(null);
    setTab(null);
    setEndpointRows({});
    setCustomEndpoints([]);
    setHasResponded(false);
    setShapeEdits(0);
    setSeenReveal(false);
    setRevealActive(false);
    setSeenZelda(false);
    setZeldaActive(false);
    setByHand(false);
    setFrenzyLoc(0);
    setGameOver(false);
  }

  function doItByHand() {
    if (byHand || gameOver) return;
    setByHand(true);
  }

  // Game Over → "try again": drop straight back to the Server's choice —
  // keep the forms already forged, skip the cinematic. No re-grinding.
  function tryAgain() {
    setGameOver(false);
    setByHand(false);
    setFrenzyLoc(0);
    setSceneId(2);
    setSeenReveal(true);
    setRevealActive(false);
  }

  /* ── Dialog content (computed from state) ── */
  const dialog = (() => {
    if (reachedEnding) {
      return { lines: ENDING_LINES, counter: undefined as string | undefined, cta: undefined as string | undefined };
    }
    switch (sceneId) {
      case 0:
        return {
          lines: [
            'BEFORE THE QUEST: A CHOICE.',
            'GOLEMUI RUNS IN ANY FRAMEWORK. WHICH IS YOURS?',
          ],
          counter: undefined,
          cta: character ? `▶ BEGIN AS ${character.name}` : '▶ BEGIN',
        };
      case 1: {
        const n = baseFormsBuilt;
        if (n >= 3) {
          // The fake-victory tease — one golden button before the Server lands.
          return {
            lines: [
              'Well DONE! See? Building forms is THAT easy.',
              'Anyone could crank these out all day… right?',
              '…RIGHT?',
            ],
            counter: '✓✓✓',
            cta: 'RIGHT…? ▶',
          };
        }
        const lines =
          n === 2
            ? ['TWO whole forms. Look at you go.', 'One to go. Try to contain yourself.']
            : n === 1
              ? ['…oh. You actually coded one. Adorable.', 'Only two more. Tick. Tock.']
              : [
                  'Ah… a CHALLENGER. So you would BUILD APPS?',
                  'Cute. Prove it — code me three forms by hand.',
                  'Profile, Orders, Feedback. Try to stay awake.',
                ];
        return { lines, counter: `${n}/3`, cta: undefined };
      }
      case 2:
        return {
          lines: [
            'YOUR USERS WILL DEMAND MORE — UP TO N ENDPOINTS.',
            'AND EACH ONE IS DYNAMIC. THE SHAPES MUTATE.',
            'HAND-CODE THAT. I DARE YOU.',
          ],
          counter: 'N',
          cta: undefined, // the npm-install button is the CTA here
        };
      case 3:
        return {
          lines: [
            'A LEGENDARY ENGINE IS BESTOWED UPON YOU.',
            'IT IS CALLED GOLEMUI. IT HANDLES FORMS AS DATA—',
            '—MAP A SCHEMA, AND THE FORM RENDERS ITSELF.',
          ],
          counter: undefined,
          cta: 'CLAIM IT ▶',
        };
      case 4:
        return {
          lines: [
            'YOU ARE THE BACKEND NOW.',
            'EDIT SHAPES. FORGE NEW ENDPOINTS (UP TO 5).',
            'THE APP REBUILDS ITSELF. NO FORM CODE WAS HARMED.',
          ],
          counter: undefined,
          cta: 'FINISH ▶',
        };
      default:
        return { lines: [], counter: undefined, cta: undefined };
    }
  })();

  const hasFields = rows.some((r) => r.name.trim());
  const showCharacterSelect = sceneId === 0 && !reachedEnding && !bareMode;
  const showRecordBuilder = bareMode || sceneId === 4 || reachedEnding;
  const showAppCard = bareMode || sceneId >= 1 || reachedEnding;
  const swordUnlocked =
    bareMode || reachedEnding || sceneNumber >= SWORD_UNLOCK_SCENE;
  const canAddEndpoint =
    (bareMode || reachedEnding || sceneNumber >= 4) &&
    visibleEndpoints.length < MAX_ENDPOINTS;
  const showDialog = !bareMode;

  const chapter = reachedEnding ? ENDING_META.chapter : scene!.chapter;
  const title = reachedEnding ? ENDING_META.title : scene!.title;

  // Tabs are display-only during the guided walk — all input flows through the
  // prompt. Free clicking returns in the wield scene / sandbox.
  const tabsClickable = bareMode || reachedEnding || sceneId >= 4;

  // The walk's choices live inside the prompt (keyboard or mouse).
  const options: DialogOption[] = (() => {
    if (reachedEnding || bareMode) return [];
    if (sceneId === 1) {
      // Forms drop out of the menu as they're coded — once the last one is
      // gone the Server's "RIGHT?" tease is all that's left.
      const defs: { id: EndpointId; label: string }[] = [
        { id: 'profile', label: 'Code the “My Profile”' },
        { id: 'orders', label: 'Code the “My Orders”' },
        { id: 'feedback', label: 'Code the “Feedback”' },
      ];
      return defs
        .filter((d) => !endpointRows[d.id]?.length)
        .map((d, i) => ({
          key: String(i + 1),
          label: d.label,
          action: () => handleTabClick(d.id),
        }));
    }
    if (sceneId === 2) {
      if (revealActive) return []; // hold during the cinematic
      return [
        { key: '1', label: 'npm install golemui', action: next },
        { key: '2', label: 'Nah… I’ll do it by hand', action: doItByHand },
      ];
    }
    return [];
  })();

  // RPG-style stats — forms conjured, and the form code you DIDN'T write.
  const formsBuilt = Object.values(endpointRows).filter(
    (r) => r.length > 0,
  ).length;
  // Lines you'd have hand-written (~89/form, echoing the home comparison) —
  // grows per form; the "do it by hand" frenzy sends it spiralling.
  const locShown = byHand || gameOver ? frenzyLoc : formsBuilt * 89;

  return (
    <main
      className={`sasha-shell scene-${sceneId}${reachedEnding ? ' is-ending' : ''}${swordUnlocked ? ' has-sword' : ''}${isBoss ? ' is-boss' : ''}${bareMode ? ' is-bare' : ''}`}
    >
      {bareMode && (
        <header className="bare-bar">
          <div className="bare-bar-info">
            <span className="bare-logo">{'{gui.}'}</span>
            <span className="bare-title">FORMS AS DATA</span>
          </div>
          <div
            className="bare-fw"
            role="radiogroup"
            aria-label="Framework — switches the live form, the mount line, and VIEW THE CODE"
          >
            <span className="bare-fw-label">▸ YOUR FRAMEWORK</span>
            <div className="bare-fw-tiles">
              {CHARACTERS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={framework === c.id}
                  className={`bare-fw-tile ${framework === c.id ? 'is-selected' : ''}`}
                  style={
                    {
                      '--fw-color': c.color,
                      '--fw-shadow': c.shadow,
                    } as React.CSSProperties
                  }
                  onClick={() => setFramework(c.id)}
                  title={`See this demo in ${c.name}`}
                >
                  <span className="bare-fw-portrait" aria-hidden="true">
                    <span className="bare-fw-mono">{c.monogram}</span>
                  </span>
                  <span className="bare-fw-name">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="bare-bar-actions">
            <button type="button" className="bare-code-btn" onClick={openCode}>
              ⌁ VIEW THE {character ? character.name : ''} CODE
            </button>
            <button
              type="button"
              className="bare-exit"
              onClick={exitApp}
              title="Exit"
              aria-label="Exit the demo"
            >
              ✕
            </button>
          </div>
        </header>
      )}

      {showDialog && (
        <DialogBox
          chapter={chapter}
          title={title}
          lines={dialog.lines}
          counter={dialog.counter}
          onTypingDone={setTypingDone}
          isBoss={isBoss}
          hold={revealActive || zeldaActive}
          onSkip={skipToBare}
        />
      )}

      <section className="sasha-stage">
        {showCharacterSelect && (
          <CharacterSelect
            selected={framework}
            onSelect={(id) => setFramework(id)}
          />
        )}

        {isBoss && !revealActive && <GuiArtifact />}

        {showRecordBuilder && (
          <article className="card card--endpoint">
            <div className="card-head">
              <span className="card-tag">{bareMode ? '◢ YOUR DATA' : '📡 MOCK BACKEND'}</span>
              {endpoint && (
                <>
                  <span className="card-method">{endpoint.method}</span>
                  <span className="card-path">{endpoint.path}</span>
                </>
              )}
              {bareMode && (
                <span className="card-sub">edit any cell — the form follows</span>
              )}
            </div>
            <div className="card-body endpoint-body">
              {!bareMode && (
                <p className="endpoint-blurb">
                  You are the backend. Edit the response shape — rename a field,
                  change a type, add a new one. The App rebuilds itself.
                </p>
              )}
              {bareMode && (
                <div className="try-it">
                  <span className="try-it-bolt">⚡</span>
                  <span className="try-it-text">
                    <strong>Try it:</strong> edit a value, switch a type, or
                    add a field — the form on the right rebuilds the instant you
                    do. <strong>No new code.</strong>
                  </span>
                </div>
              )}
              <div className="record-builder">
                {bareMode && (
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
                    onName={(name) => {
                      noteEdit(row.field.type);
                      updateRow(row.id, { name });
                    }}
                    onType={(type) => {
                      noteEdit(type);
                      updateField(row.id, {
                        type,
                        format:
                          type === 'string' ? row.field.format : undefined,
                        options:
                          type === 'enum' ? row.field.options : undefined,
                      });
                    }}
                    onValue={(value) => {
                      noteEdit(row.field.type);
                      updateRow(row.id, { value });
                    }}
                    onOptions={(opts) => {
                      noteEdit('enum');
                      updateField(row.id, {
                        options: opts
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      });
                    }}
                    onRemove={() => removeRow(row.id)}
                  />
                ))}
                <button type="button" className="add-row" onClick={addRow}>
                  + ADD FIELD
                </button>
              </div>
            </div>
          </article>
        )}

        {bareMode && (
          <MapperPanel
            activeType={mapType}
            pulse={rebuiltPulse}
            mount={MOUNT_BY_FW[framework ?? 'react']}
            frameworkName={character?.name ?? 'REACT'}
          />
        )}

        {showAppCard && !isBoss && (
          <article
            className={[
              'card card--app',
              !showRecordBuilder ? 'card--app-solo' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {bareMode && (
              <div className="card-head card-head--form">
                <span className="card-tag">▶ THE FORM</span>
                <span className="card-sub">
                  rendered by <code>{'{gui.}'}</code> — no form code
                </span>
                <span
                  className={`form-live${rebuiltPulse ? ' is-on' : ''}`}
                  aria-hidden="true"
                >
                  ● {rebuiltPulse ? 'REBUILT' : 'LIVE'}
                </span>
              </div>
            )}
            <nav className="app-tabs" role="tablist" aria-label="App routes">
              {visibleEndpoints.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  role="tab"
                  aria-selected={e.id === tab}
                  aria-disabled={!tabsClickable}
                  className={[
                    'app-tab',
                    e.id === tab ? 'is-active' : '',
                    e.id.startsWith('custom-') ? 'is-custom' : '',
                    !tabsClickable ? 'is-locked' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={
                    tabsClickable ? () => handleTabClick(e.id) : undefined
                  }
                >
                  {e.label}
                </button>
              ))}
              {canAddEndpoint && (
                <button
                  type="button"
                  className="app-tab app-tab--add"
                  onClick={addEndpoint}
                  title={`Forge a new endpoint (${visibleEndpoints.length}/${MAX_ENDPOINTS})`}
                >
                  + FORGE ENDPOINT
                </button>
              )}
            </nav>
            <div
              className={`card-body app-host${rebuiltPulse ? ' is-rebuilt' : ''}`}
            >
              {hasFields ? (
                <GuiForm
                  key={formMountKey}
                  config={{
                    formDef: deriveFormDefinition(derivedPayload.schema),
                    data: derivedPayload.data,
                    formConfig: { widgetLoaders },
                  }}
                  formSubmit={(e: FormSubmitEvent) => setSubmitted(e.data)}
                />
              ) : showRecordBuilder ? (
                <div className="app-empty">
                  <p>Forge fields on the left.</p>
                </div>
              ) : null}
              {bareMode && hasFields && <ReturnBar data={submitted} />}
            </div>
          </article>
        )}

      </section>

      {!bareMode && (
        <BattleBar
          forms={formsBuilt}
          loc={locShown}
          frenzy={byHand || gameOver}
          options={options}
          typingDone={typingDone}
          cta={dialog.cta}
          engagementMet={engagementMet}
          onNext={next}
          onPrev={prev}
          canPrev={reachedEnding || sceneId > 0}
          atEnding={reachedEnding}
          isBoss={isBoss}
          bossWaitsForInstall={isBoss}
          character={character}
          swordUnlocked={swordUnlocked}
          bare={bareMode}
          locked={revealActive || zeldaActive || gameOver || victory}
          onRestart={restart}
        />
      )}

      {/* Cinematics + end screens cover the whole frame */}
      {revealActive && <RevealOverlay endpoint={endpoint} />}
      {zeldaActive && <ZeldaOverlay />}
      {gameOver && <GameOver lines={frenzyLoc} onRetry={tryAgain} />}
      {victory && <Victory onApp={goToApp} />}

    </main>
  );
}

/* ─── useTypewriter ──────────────────────────────────────────────────── */

// Constant characters-per-second cadence — every prompt types at the SAME
// visual speed regardless of length, driven by requestAnimationFrame off
// wall-clock. No setInterval drift, no timers stacking across re-renders.
function useTypewriter(
  text: string,
  cps = 38, // 8-bit dialogue cadence
  hold = false, // freeze at 0 while a cinematic overlay covers the box
): { shown: string; done: boolean } {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(0);
    if (!text || hold) return;
    let raf = 0;
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const n = Math.floor(((ts - start) / 1000) * cps);
      if (n >= text.length) {
        setCount(text.length);
        return;
      }
      setCount(n);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [text, cps, hold]);
  return { shown: text.slice(0, count), done: count >= text.length };
}

/* ─── useOverlayConfirm ──────────────────────────────────────────────── */

// Enter / Space confirms an end-screen overlay (Game Over → retry, Victory →
// the app). Skips when a button is focused so it activates natively, no double.
function useOverlayConfirm(action: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const tag =
        (e.target instanceof HTMLElement ? e.target.tagName : '').toLowerCase();
      if (tag === 'button') return;
      e.preventDefault();
      action();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [action]);
}

/* ─── CharacterSelect ─────────────────────────────────────────────────── */

interface CharacterSelectProps {
  selected: Framework | null;
  onSelect: (id: Framework) => void;
}

function CharacterSelect({ selected, onSelect }: CharacterSelectProps) {
  return (
    <div className="char-select">
      <h2 className="char-select-title">CHOOSE YOUR FRAMEWORK</h2>
      <div className="char-grid">
        {CHARACTERS.map((c) => {
          const isSelected = c.id === selected;
          return (
            <button
              key={c.id}
              type="button"
              className={`char-tile ${isSelected ? 'is-selected' : ''}`}
              style={
                {
                  '--char-color': c.color,
                  '--char-shadow': c.shadow,
                } as React.CSSProperties
              }
              onClick={() => onSelect(c.id)}
            >
              <span className="char-portrait" aria-hidden="true">
                <span className="char-monogram">{c.monogram}</span>
              </span>
              <span className="char-name">{c.name}</span>
              <span className="char-klass">{c.klass}</span>
              {isSelected && <span className="char-cursor">►</span>}
            </button>
          );
        })}
      </div>
      <p className="char-hint">
        {selected
          ? `LOCKED IN. PRESS BEGIN TO CONTINUE. ▲`
          : `USE THE MOUSE. CLICK TO PICK. ▲`}
      </p>
    </div>
  );
}

/* ─── StatBox (compact RPG stat — number + label) ─────────────────────── */

interface StatBoxProps {
  kind: 'forms' | 'loc';
  value: number;
  frenzy: boolean;
}

function StatBox({ kind, value, frenzy }: StatBoxProps) {
  const numRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef(value);

  // Pop the number whenever it changes (a new form built bumps both stats).
  useEffect(() => {
    if (prevRef.current === value) return;
    prevRef.current = value;
    if (frenzy) return; // the frenzy shake already animates it
    const el = numRef.current;
    if (!el) return;
    el.classList.remove('is-bump');
    void el.offsetWidth;
    el.classList.add('is-bump');
  }, [value, frenzy]);

  return (
    <aside
      className={`stat-box stat-box--${kind} ${frenzy ? 'is-frenzy' : ''}`}
    >
      <div ref={numRef} className="sb-num">
        {value}
      </div>
      <div className="sb-label">{kind === 'forms' ? 'FORMS' : 'LOC'}</div>
    </aside>
  );
}

/* ─── GuiArtifact (CH.02 centre — the engine, not clickable) ──────────── */

function GuiArtifact() {
  return (
    <div className="gui-artifact" aria-hidden="true">
      <span className="ga-rays" />
      <span className="ga-sigil">{'{gui.}'}</span>
      <span className="ga-cap">THE ENGINE AWAITS</span>
    </div>
  );
}

/* ─── MapperPanel (bare centre — the whole job, on screen) ─────────────── */

// The one mapper that replaces every per-field form. Identical in every
// framework (`gui.inputs.*`); only the mount line below changes. Whichever
// field type you just edited, its case pulses — "this single line earns it."
const MAP_CASES: { type: FieldType; code: string }[] = [
  { type: 'number', code: "case 'number':  gui.inputs.numberInput(path)" },
  { type: 'date', code: "case 'date':    gui.inputs.datePicker(path)" },
  { type: 'boolean', code: "case 'boolean': gui.inputs.booleanInput(path)" },
  { type: 'enum', code: "case 'enum':    gui.inputs.dropdown(path, {items})" },
  { type: 'string', code: 'default:        gui.inputs.textInput(path)' },
];

interface MapperPanelProps {
  activeType: FieldType | null;
  pulse: boolean;
  mount: string;
  frameworkName: string;
}

// The middle card — the pitch. A {gui.} form is *data*: a serializable
// definition. This demo MAPS a typed record into one (the switch), but the
// definition could equally ship straight from the server. That's the hook.
function MapperPanel({ activeType, pulse, mount, frameworkName }: MapperPanelProps) {
  return (
    <article className="card card--mapper">
      <div className="card-head">
        <span className="card-tag">◇ {'{gui.}'}</span>
        <span className="card-sub">a form is just data</span>
      </div>
      <div className="card-body mapper-body">
        <p className="mp-lead">
          A GolemUI form is a <strong>serializable definition</strong> — not
          markup, not components. Two ways to turn your backend into one:
        </p>

        <div className="mp-mode">
          <div className="mp-mode-head">
            <span className="mp-mode-num">1</span>
            <span className="mp-mode-name">MAP IT</span>
            <span className="mp-mode-tag">this demo</span>
          </div>
          <p className="mp-mode-text">
            The server sends a typed record; one switch maps each field to an
            input — <strong>written once</strong>, identical in every framework:
          </p>
          <pre className="mp-code">
            <code>
              {MAP_CASES.map((c) => (
                <span
                  key={c.type}
                  className={`mp-line${pulse && activeType === c.type ? ' is-pulse' : ''}`}
                >
                  {c.code + '\n'}
                </span>
              ))}
            </code>
          </pre>
        </div>

        <div className="mp-mode mp-mode--alt">
          <div className="mp-mode-head">
            <span className="mp-mode-num">2</span>
            <span className="mp-mode-name">…OR SHIP IT WHOLE</span>
          </div>
          <p className="mp-mode-text">
            Skip the mapper entirely: your server can send the{' '}
            <strong>form definition itself</strong> — it&rsquo;s plain JSON.{' '}
            <code>{'{gui.}'}</code> renders it as-is. <strong>No client form
            code at all.</strong>
          </p>
        </div>

        <div className="mp-mount-block">
          <span className="mp-mount-cap" aria-hidden="true">
            mounted in {frameworkName}
          </span>
          <pre className="mp-mount">
            <code>{mount}</code>
          </pre>
        </div>
      </div>
    </article>
  );
}

/* ─── ReturnBar (under Save — the validated, typed payload) ────────────── */

// Content-unaware on purpose: Save hands back whatever shape the form holds,
// already typed. The engine enforces whatever rules the schema declared — no
// field is special-cased here.
function ReturnBar({ data }: { data: Record<string, unknown> | null }) {
  return (
    <div className={`return-bar${data ? ' is-filled' : ''}`}>
      {data ? (
        <>
          <span className="rb-cap">✓ YOUR BACKEND RECEIVES</span>
          <code className="rb-json">{JSON.stringify(data, null, 2)}</code>
          <span className="rb-note">
            typed straight from the data — numbers, booleans, dates, whatever
            the shape. No parsing on your end.
          </span>
        </>
      ) : (
        <>
          <span className="rb-cap rb-cap--idle">▶ THE RETURN TRIP</span>
          <span className="rb-note">
            Hit <strong>Save</strong> — the form hands its <strong>typed</strong>{' '}
            payload straight back, valid against whatever rules the schema
            declared.
          </span>
        </>
      )}
    </div>
  );
}

/* ─── GameOver overlay ────────────────────────────────────────────────── */

interface GameOverProps {
  lines: number;
  onRetry: () => void;
}

function GameOver({ lines, onRetry }: GameOverProps) {
  useOverlayConfirm(onRetry);
  return (
    <div className="gameover-overlay">
      <div className="go-scan" />
      <div className="go-stack">
        <div className="go-pretitle">✦ YOU CHOSE … POORLY ✦</div>
        <h1 className="go-title">GAME&nbsp;OVER</h1>
        <div className="go-stat">{lines} LINES HAND-WRITTEN · 0 SHIPPED</div>
        <div className="go-sub">The forms multiplied. You did not.</div>
        <button type="button" className="go-retry" onClick={onRetry}>
          ▶ TRY AGAIN
        </button>
      </div>
    </div>
  );
}

/* ─── Victory (quest complete → take me to the app) ───────────────────── */

interface VictoryProps {
  onApp: () => void;
}

function Victory({ onApp }: VictoryProps) {
  useOverlayConfirm(onApp);
  return (
    <div className="victory-overlay">
      <div className="vo-rays" />
      <div className="vo-stack">
        <div className="vo-pretitle">★ QUEST COMPLETE ★</div>
        <h1 className="vo-title">CONGRATULATIONS!</h1>
        <div className="vo-sub">
          You claimed <span className="vo-sigil">{'{gui.}'}</span> — and now you
          ship not just three forms, but as many as THE SERVER can throw at you.
          Every one without a line of form code.
        </div>
        <button type="button" className="go-retry vo-cta" onClick={onApp}>
          ▶ TAKE ME TO THE APP
        </button>
      </div>
    </div>
  );
}

/* ─── RevealOverlay (THE SERVER!! boss attack) ────────────────────────── */

interface RevealOverlayProps {
  endpoint: Endpoint | null;
}

function RevealOverlay({ endpoint }: RevealOverlayProps) {
  const payloadText = useMemo(() => {
    if (!endpoint) return '{ data, schema }';
    const schemaKeys = Object.keys(endpoint.payload.schema).slice(0, 4);
    if (schemaKeys.length === 0) return '{ data, schema }';
    const dataPreview = schemaKeys
      .map((k) => `    ${k}: ${JSON.stringify(endpoint.payload.data[k])}`)
      .join(',\n');
    const schemaPreview = schemaKeys
      .map((k) => `    ${k}: "${endpoint.payload.schema[k].type}"`)
      .join(',\n');
    return `{\n  data: {\n${dataPreview}\n  },\n  schema: {\n${schemaPreview}\n  }\n}`;
  }, [endpoint]);

  return (
    <div className="reveal-overlay" aria-hidden="true">
      <div className="reveal-flash" />
      <div className="reveal-vignette" />
      <div className="reveal-stack">
        <div className="reveal-pretitle">⚠ A WILD BOSS APPEARS ⚠</div>
        <h1 className="reveal-title">THE&nbsp;SERVER!!</h1>
        <div className="reveal-subtitle">UP TO N ENDPOINTS</div>
        <pre className="reveal-payload">{payloadText}</pre>
        <div className="reveal-footer">EACH ONE MUTATES · NOW WHAT?</div>
      </div>
      <div className="reveal-bolt reveal-bolt--1" />
      <div className="reveal-bolt reveal-bolt--2" />
      <div className="reveal-bolt reveal-bolt--3" />
    </div>
  );
}

/* ─── ZeldaOverlay (ITEM GET) ─────────────────────────────────────────── */

function ZeldaOverlay() {
  return (
    <div className="zelda-overlay" aria-hidden="true">
      <div className="zelda-rays" />
      <div className="zelda-stack">
        <div className="zelda-pretitle">★ ITEM GET ★</div>
        <div className="zelda-artifact">
          <span className="zelda-sigil">{'{gui.}'}</span>
          <span className="zelda-glow" />
        </div>
        <div className="zelda-name">GOLEMUI</div>
        <div className="zelda-spell">THE FORM ENGINE</div>
      </div>
    </div>
  );
}

/* ─── DialogBox (TOP — enemy message) ─────────────────────────────────── */

interface DialogBoxProps {
  chapter: string;
  title: string;
  lines: string[];
  counter?: string;
  onTypingDone: (done: boolean) => void;
  isBoss: boolean;
  hold: boolean;
  onSkip: () => void;
}

function DialogBox({
  chapter,
  title,
  lines,
  counter,
  onTypingDone,
  isBoss,
  hold,
  onSkip,
}: DialogBoxProps) {
  const full = lines.join('\n');
  const { shown, done } = useTypewriter(full, 38, hold);
  const boxRef = useRef<HTMLDivElement>(null);

  // Report typing state up (so the command bar reveals options after the
  // enemy finishes "speaking") — fires twice per message, not per frame.
  useEffect(() => {
    onTypingDone(done);
  }, [done, onTypingDone]);

  // Shake + retype whenever the message changes (scene / interaction)
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    el.classList.remove('is-shaking');
    void el.offsetWidth;
    el.classList.add('is-shaking');
  }, [full]);

  // Focus on mount so the command keys work immediately (gives the iframe focus)
  useEffect(() => {
    boxRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <header className={`dialog-stage ${isBoss ? 'is-boss' : ''}`}>
      <div
        ref={boxRef}
        tabIndex={-1}
        className={`dialog-box ${isBoss ? 'is-boss' : ''}`}
      >
        <div className="dialog-nameplate">
          <span className="dialog-chapter">CH·{chapter}</span>
          <span className="dialog-title">
            {isBoss ? '👹 THE SERVER' : title}
          </span>
          {counter && <span className="dialog-counter">{counter}</span>}
        </div>

        <button
          type="button"
          className="dialog-skip"
          onClick={onSkip}
          title="Skip the walk — straight to the app"
          aria-label="Skip the walk — straight to the app"
        >
          SKIP <span className="skip-chevrons">▶▶▶</span>
        </button>

        <div className="dialog-body">
          <div className="dialog-type">
            {shown}
            {!done && <span className="type-caret">▋</span>}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ─── BattleBar (BOTTOM — player console: stats + command menu) ───────── */

interface BattleBarProps {
  forms: number;
  loc: number;
  frenzy: boolean;
  options: DialogOption[];
  typingDone: boolean;
  cta?: string;
  engagementMet: boolean;
  onNext: () => void;
  onPrev: () => void;
  canPrev: boolean;
  atEnding: boolean;
  isBoss: boolean;
  bossWaitsForInstall: boolean;
  character: Character | null;
  swordUnlocked: boolean;
  bare: boolean;
  locked: boolean;
  onRestart: () => void;
}

function BattleBar({
  forms,
  loc,
  frenzy,
  options,
  typingDone,
  cta,
  engagementMet,
  onNext,
  onPrev,
  canPrev,
  atEnding,
  isBoss,
  character,
  swordUnlocked,
  bare,
  locked,
  onRestart,
}: BattleBarProps) {
  const optionsReady = options.length > 0 && typingDone;

  // Keyboard cursor over the command options
  const [focus, setFocus] = useState(0);
  const focusRef = useRef(0);
  useEffect(() => {
    focusRef.current = focus;
  }, [focus]);
  useEffect(() => {
    setFocus(0);
  }, [options.length]);
  // Keyboard drives the whole console: arrows/number pick an option, and
  // Enter/Space fire the primary action — INCLUDING the golden CTA buttons
  // (I'M READY, FACE THE SERVER, WIELD IT, npm install, …). Stays out of the
  // way while a form field is focused.
  useEffect(() => {
    if (bare || locked) return;
    const onKey = (e: KeyboardEvent) => {
      const tag =
        (e.target instanceof HTMLElement ? e.target.tagName : '').toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

      if (optionsReady) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          setFocus((f) => Math.min(options.length - 1, f + 1));
          e.preventDefault();
          return;
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          setFocus((f) => Math.max(0, f - 1));
          e.preventDefault();
          return;
        }
        const idx = options.findIndex((o) => o.key === e.key);
        if (idx >= 0) {
          setFocus(idx);
          options[idx].action();
          e.preventDefault();
          return;
        }
      }

      if (e.key === 'Enter' || e.key === ' ') {
        // A focused button activates itself natively — don't double-fire.
        if (tag === 'button') return;
        if (atEnding) onRestart();
        else if (cta && engagementMet) onNext();
        else if (optionsReady) options[focusRef.current]?.action();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [options, optionsReady, cta, engagementMet, atEnding, bare, locked]);

  return (
    <footer
      className={`battle-frame ${isBoss ? 'is-boss' : ''}${bare ? ' is-bare' : ''}`}
    >
      <StatBox kind="forms" value={forms} frenzy={false} />

      <div className="command-box">
        <div className="command-cap">
          {bare ? '● SANDBOX' : '▸ YOUR MOVE'}
          {!bare && typingDone && <span className="blink cmd-blink">▌</span>}
        </div>

        <div className="command-main">
          {bare ? (
            <button type="button" className="pixel-btn is-ready" onClick={onRestart}>
              ↻ PLAY THE WALK <span className="blink">▶</span>
            </button>
          ) : !typingDone ? (
            // Hold every command — options AND golden CTAs — until the enemy
            // finishes "speaking". No button pops in over a half-typed line.
            <span className="dialog-hint">…</span>
          ) : optionsReady ? (
            <div className="cmd-options-wrap">
              <ul className="dialog-options" role="menu">
                {options.map((o, i) => (
                  <li key={o.key + o.label} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className={`dialog-option ${i === focus ? 'is-focused' : ''}${o.done ? ' is-done' : ''}`}
                      onClick={o.action}
                      onMouseEnter={() => setFocus(i)}
                    >
                      <span className="opt-cursor">{i === focus ? '▶' : ''}</span>
                      <span className="opt-key">{o.key}</span>
                      <span className="opt-label">{o.label}</span>
                      {o.done && <span className="opt-check">✓</span>}
                    </button>
                  </li>
                ))}
              </ul>
              {cta && engagementMet && (
                <button
                  type="button"
                  className="pixel-btn is-ready cmd-proceed"
                  onClick={onNext}
                >
                  {cta} <span className="blink">▶</span>
                </button>
              )}
            </div>
          ) : atEnding ? (
            <button type="button" className="pixel-btn is-ready" onClick={onRestart}>
              ↻ PLAY AGAIN <span className="blink">▶</span>
            </button>
          ) : (
            <button
              type="button"
              className={`pixel-btn ${engagementMet ? 'is-ready' : 'is-dim'}`}
              onClick={onNext}
              disabled={!engagementMet}
            >
              {cta ?? 'NEXT'} {engagementMet && <span className="blink">▶</span>}
            </button>
          )}
        </div>

        <div className="command-foot">
          {!bare && (
            <button
              type="button"
              className="mini-btn"
              onClick={onPrev}
              disabled={!canPrev}
            >
              ← PREV
            </button>
          )}
          {character && (
            <span
              className="nav-chip"
              style={{ borderColor: character.color, color: character.color }}
            >
              <span className="nav-chip-mono">{character.monogram}</span>
              {character.name}
            </span>
          )}
          {swordUnlocked && <span className="nav-sword">⚔ GOLEMUI</span>}
          {optionsReady && (
            <span className="dialog-hint">↑↓ + ⏎ · click · #</span>
          )}
          <span className="cmd-spacer" />
          {!bare && (
            <button
              type="button"
              className="mini-btn mini-btn--ghost"
              onClick={onRestart}
              title="Restart the walk"
            >
              ↻
            </button>
          )}
        </div>
      </div>

      <StatBox kind="loc" value={loc} frenzy={frenzy} />
    </footer>
  );
}

/* ─── RecordFieldRow ─────────────────────────────────────────────────── */

interface RecordFieldRowProps {
  row: RecordRow;
  onName: (s: string) => void;
  onType: (t: FieldType) => void;
  onValue: (s: string) => void;
  onOptions: (s: string) => void;
  onRemove: () => void;
}

function RecordFieldRow({
  row,
  onName,
  onType,
  onValue,
  onOptions,
  onRemove,
}: RecordFieldRowProps) {
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
      <button
        type="button"
        className="rr-remove"
        onClick={onRemove}
        aria-label="Remove field"
      >
        ✕
      </button>
      {row.field.type === 'enum' && (
        <div className="rr-detail">
          <label className="rr-detail-label">options</label>
          <input
            className="rr-detail-input"
            placeholder="comma, separated, values"
            value={(row.field.options ?? [])
              .map((o) => (typeof o === 'string' ? o : o.value))
              .join(', ')}
            onChange={(e) => onOptions(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
