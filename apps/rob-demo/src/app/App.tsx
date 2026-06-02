import type { FormSubmitEvent } from '@golemui/core';
import {
  GameShell,
  GuiArtifact,
  LangToggle,
  ReturnBar,
  type GameApi,
  type GameConfig,
  type Framework,
} from '@golemui/demo-engine';
import { GuiForm, widgetLoaders } from '@golemui/gui-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  BLOCKS,
  composeForm,
  composeTree,
  createLocalization,
  SEED_DATA,
  type BlockId,
  type Lang,
} from './composeForm';
import { CurrencyItemRenderer } from './CurrencyItemRenderer';

/* ─── Per-framework code targets ─────────────────────────────────────── */

const MOUNT_BY_FW: Record<Framework, string> = {
  react: '<GuiForm config={config} formSubmit={onSubmit} />',
  angular: '<gui-form [config]="config" (formSubmit)="onSubmit($event)">',
  vue: '<GuiForm :config="config" @form-submit="onSubmit" />',
  lit: '<gui-form .config=${config} @formSubmit=${onSubmit}>',
  vanilla: "form.config = config;\nform.addEventListener('formSubmit', onSubmit);",
};
const WIDGET_BY_FW: Record<Framework, string> = {
  react: 'itemRenderers: { currency: CurrencyChip }   // a React component',
  angular: 'itemRenderers: { currency: CurrencyChip }   // an Angular component',
  vue: 'itemRenderers: { currency: CurrencyChip }   // a Vue SFC',
  lit: 'itemRenderers: { currency: currencyChip }   // a Lit template',
  vanilla: 'itemRenderers: { currency: currencyChip }   // a DOM factory',
};

/* ─── Scenes (content + cinematic flags) ─────────────────────────────── */

interface RobScene {
  chapter: string; act?: string; title: string; quest?: string;
  boss?: boolean; bossTitle?: string; itemGet?: boolean;
  lines: string[]; cta?: string;
}

const SCENES: RobScene[] = [
  { chapter: '00', title: 'CHOOSE YOUR HERO', quest: 'Pick your class',
    lines: ['BEFORE THE JOB: A CHOICE.', 'GOLEMUI RUNS IN ANY FRAMEWORK. WHICH IS YOURS?'], cta: '▶ BEGIN' },
  { chapter: '01', act: 'ACT I', title: 'THE BRIEF', quest: 'Ship a signup form',
    lines: ['A client calls. “We need a form. Signup —', 'name, email, a country dropdown. Nothing fancy.”', '“…Friday?” Easy. Three inputs. You hand-roll it.'], cta: 'SHIP IT ▶' },
  { chapter: '02', act: 'ACT II', title: 'THE CALLBACK', quest: 'A 2nd form — don’t rewrite',
    lines: ['…they call back. “LOVE it. Now a CHECKOUT too.”', '“Same address fields. Same validation. Don’t rewrite it.”', 'You copy-paste the block. A flicker of doubt.'], cta: 'FINE… ▶' },
  { chapter: '03', act: 'ACT II', title: 'THE CREEP', quest: 'Make it react & branch',
    lines: ['“Oh — city should FOLLOW the country.”', '“And billing? Only show it when it DIFFERS.”', 'The wiring spaghetti is starting to smell.'], cta: 'UH-OH ▶' },
  { chapter: '04', act: 'ACT II', title: 'THE CLIENT!!', bossTitle: '👹 THE CLIENT', boss: true, quest: 'Survive the endless client',
    lines: ['AND OUR OWN CURRENCY WIDGET. AND, AND, AND—', 'THE REQUESTS NEVER STOP. NESTED. MUTATING.', 'HAND-CODE THIS TANGLE FOREVER? OR…'] },
  { chapter: '05', act: 'ACT III', title: 'ITEM GET', itemGet: true, quest: 'Claim the engine',
    lines: ['A LEGENDARY ENGINE IS BESTOWED UPON YOU.', 'IT IS CALLED GOLEMUI. EVERY UI IS COMPOSED—', '—LAYOUTS, INPUTS, ACTIONS. EVEN THE HARD PARTS.'], cta: 'WIELD IT ▶' },
  { chapter: '06', act: 'ACT III', title: 'REUSE', quest: 'Reuse one block, twice',
    lines: ['REUSE, they said. Write the address block ONCE,', 'then drop it into shipping AND billing — a block is', 'just a value. Your move:'], cta: 'NICE ▶' },
  { chapter: '07', act: 'ACT III', title: 'LOGIC', quest: 'Compose react + conditional',
    lines: ['LOGIC, they said. City should follow country; billing', 'shows only when it differs. Declared, not wired —', 'compose both:'], cta: 'KEEP GOING ▶' },
  { chapter: '08', act: 'ACT III', title: 'INTEGRATE', quest: 'Wrap your own widget',
    lines: ['YOUR widget, they said. Wrap your framework’s own', 'component as a custom renderer — like any other field.', 'Drop it in:'], cta: 'ALMOST ▶' },
  { chapter: '09', act: 'ACT IV', title: 'ONE MORE THING', quest: 'Ship it worldwide',
    lines: ['“…one more thing. It ships to 12 COUNTRIES.', 'And legal wants a clean ACCESSIBILITY pass. Monday.”', 'Relax. It already shipped that way — watch.'], cta: 'TAKE ME TO THE APP ▶' },
];

const SCENE_MOVES: Record<number, BlockId[]> = {
  6: ['address'],
  7: ['reactive', 'conditional'],
  8: ['currency'],
};
const MOVE_LABEL: Record<BlockId, string> = {
  address: 'Reuse the address block',
  reactive: 'Make city react to country',
  conditional: 'Add conditional billing',
  currency: 'Wrap your currency widget',
};
const REQS: { from: number; text: string }[] = [
  { from: 1, text: 'A signup form — name, email, country' },
  { from: 2, text: 'A checkout — reuse the address block' },
  { from: 3, text: 'City must follow country' },
  { from: 3, text: 'Billing — only when it differs' },
  { from: 4, text: 'Our own currency widget' },
  { from: 4, text: '…and more. Forever.' },
];

const ALL_BLOCKS = new Set<BlockId>(BLOCKS.map((b) => b.id));
// The install shown in the boss beat — the primary {gui.} package per framework
// (the full set lives in each starter template). Never the fictional `golemui`.
const INSTALL_BY_FW: Record<Framework, string> = {
  react: 'npm i @golemui/gui-react',
  angular: 'npm i @golemui/gui-angular',
  vue: 'npm i @golemui/gui-vue',
  lit: 'npm i @golemui/gui-lit',
  vanilla: 'npm i @golemui/gui-lit',
};
const PARAMS =
  typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
// App-direct by default — the guided walk is opt-in via ?mode=walk.
const START_BARE = PARAMS.get('mode') !== 'walk';
const FW_IDS: Framework[] = ['react', 'angular', 'lit', 'vue', 'vanilla'];
const START_FW = FW_IDS.find((f) => f === PARAMS.get('fw')) ?? null;

// The COMPOSE boxes, one per form SECTION (same names as the form headers), so a
// box ↔ a section ↔ its code is obvious. `contact` is always-on (base); the rest
// map to a toggleable block. `key` matches the section's first field for lighting.
const SECTION_BOXES: {
  key: string;
  section: string;
  hint: string;
  power?: string;
  blockId?: BlockId;
  locked?: boolean;
}[] = [
  { key: 'contact', section: 'Contact', hint: 'Name + email — the base of every form', locked: true },
  {
    key: 'address',
    section: 'Shipping address',
    hint: 'One reusable block, reused in shipping + billing',
    power: 'REUSE',
    blockId: 'address',
  },
  {
    key: 'reactive',
    section: 'Region',
    hint: 'One field drives another, live',
    power: 'REACTIVITY',
    blockId: 'reactive',
  },
  {
    key: 'conditional',
    section: 'Billing',
    hint: 'A section that appears on demand',
    power: 'CONDITIONAL',
    blockId: 'conditional',
  },
  {
    key: 'currency',
    section: 'Payment',
    hint: 'A custom-rendered dropdown',
    power: 'CUSTOM WIDGET',
    blockId: 'currency',
  },
];

// The data fields each block contributes. The form's data store seeds every
// field (so toggling stays instant), so on submit we keep only the fields that
// belong to currently-active blocks — a deselected block never leaks into the
// "your backend receives" payload. `country` is part of the always-on Region
// section; `city` only arrives with the reactive block.
const BASE_FIELDS = ['name', 'email', 'country'];
const BLOCK_FIELDS: Record<BlockId, string[]> = {
  address: ['shipStreet', 'shipPostcode'],
  reactive: ['city'],
  conditional: ['billingDiffers', 'billStreet', 'billPostcode'],
  currency: ['currency'],
};
function pickActiveFields(data: Record<string, unknown>, active: Set<BlockId>) {
  const allowed = new Set(BASE_FIELDS);
  active.forEach((b) => BLOCK_FIELDS[b].forEach((f) => allowed.add(f)));
  return Object.fromEntries(Object.entries(data).filter(([k]) => allowed.has(k)));
}

/* ─── App — thin orchestrator over the shared engine ─────────────────── */

export function App() {
  const [walkActive, setWalkActive] = useState<Set<BlockId>>(() => new Set());
  const [sandboxActive, setSandboxActive] = useState<Set<BlockId>>(() => new Set(ALL_BLOCKS));
  const [lang, setLang] = useState<Lang>('en');
  const [a11ySpot, setA11ySpot] = useState(false);
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null);
  const [pulse, setPulse] = useState(false);
  const [lastToggled, setLastToggled] = useState<BlockId | null>(null);
  const [flashNonce, setFlashNonce] = useState(0);
  // Hovering a box lights its section in the form + its code (the "what is what" cue).
  const [hoverSection, setHoverSection] = useState<string | null>(null);
  // Hover hints for the always-on, free blocks.
  const [localeFlash, setLocaleFlash] = useState(false);
  const [a11yHint, setA11yHint] = useState(false);

  useEffect(() => {
    if (lastToggled === null) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 700);
    return () => clearTimeout(t);
  }, [lastToggled, walkActive, sandboxActive]);

  function composeMove(id: BlockId) {
    setWalkActive((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
    setLastToggled(id);
  }
  function toggleBlock(id: BlockId) {
    setSandboxActive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setLastToggled(id);
    setFlashNonce((n) => n + 1);
    setSubmitted(null);
  }

  const activeFor = (api: GameApi) =>
    api.bare ? sandboxActive : api.scene >= 5 ? walkActive : new Set<BlockId>();

  function composeStage(api: GameApi, active: Set<BlockId>) {
    const fw = api.framework ?? 'react';
    return (
      <>
        <ComposePanel
          tree={composeTree(active)}
          pulse={pulse}
          lastToggled={lastToggled}
          mount={MOUNT_BY_FW[fw]}
          widget={WIDGET_BY_FW[fw]}
          frameworkName={fw.toUpperCase()}
        />
        <FormCard
          active={active}
          lang={lang}
          pulse={pulse}
          a11ySpot={a11ySpot}
          onLang={api.bare ? setLang : undefined}
          submitted={submitted}
          onSubmit={(e) => setSubmitted(pickActiveFields(e.data, active))}
        />
      </>
    );
  }

  const config: GameConfig = {
    shellClass: 'rob-shell',
    scenes: SCENES,
    startBare: START_BARE,
    startFramework: START_FW,
    title: 'FORMS COMPOSE',
    bareTitle: 'FORMS COMPOSE',
    bareQuestTease: 'Want the story? Survive THE CLIENT!! in a quick 8-bit quest.',
    lines: (api) => SCENES[api.scene]?.lines ?? [],
    cta: (api) => SCENES[api.scene]?.cta,
    options: (api) => {
      if (api.bare) return [];
      if (api.scene === 4) {
        return [
          { key: '1', label: INSTALL_BY_FW[api.framework ?? 'react'], action: api.next },
          { key: '2', label: 'Nah… I’ll hand-roll it', action: api.panic },
        ];
      }
      const moves = SCENE_MOVES[api.scene];
      if (moves) {
        return moves
          .filter((m) => !walkActive.has(m))
          .map((m, i) => ({ key: String(i + 1), label: `▸ ${MOVE_LABEL[m]}`, action: () => composeMove(m) }));
      }
      return [];
    },
    engagement: (api) => {
      if (api.scene === 0) return api.framework !== null;
      if (api.scene === 4) return false;
      const moves = SCENE_MOVES[api.scene];
      if (moves) return moves.every((m) => walkActive.has(m));
      return true;
    },
    stats: (api) => {
      const blocks = activeFor(api).size;
      const painLoc = [0, 60, 150, 280, 280][api.scene] ?? 0;
      const isPain = api.scene >= 1 && api.scene <= 4;
      const loc = api.frenzy ? api.frenzyVal : isPain ? painLoc : 24 + blocks * 6;
      return [
        { label: 'BLOCKS', value: blocks, accent: 'info' },
        { label: 'LOC', value: loc, frenzy: api.frenzy, accent: 'warning' },
      ];
    },
    reveal: () => ({
      title: 'THE CLIENT!!',
      subtitle: 'REQUIREMENTS · NEVER · STOP',
      payload: `+ reuse the address block
+ city follows country   (reactive)
+ billing — only if it differs   (conditional)
+ our own currency widget   (custom)
+ … and tomorrow, more`,
      footer: 'NESTED · MUTATING · NOW WHAT?',
    }),
    zelda: { name: 'GOLEMUI', spell: 'THE COMPOSITION ENGINE' },
    gameOver: (v) => ({
      statLine: `${v} LINES OF TANGLED JSX · 0 SHIPPED`,
      sub: 'The requirements composed. Your code did not.',
    }),
    stageClass: (api) => (!api.bare && api.scene >= 5 ? 'is-compose' : ''),
    onScene: (scene) => {
      if (scene === 9) {
        setA11ySpot(true);
        window.setTimeout(() => setLang('ja'), 1600);
      } else {
        setA11ySpot(false);
      }
    },
    onEnterBare: () => {
      setSandboxActive(new Set(ALL_BLOCKS));
      setA11ySpot(false);
    },
    onRestart: () => {
      setWalkActive(new Set());
      setLang('en');
      setA11ySpot(false);
      setSubmitted(null);
    },
    renderStage: (api) => {
      if (api.scene >= 1 && api.scene <= 3) return <RequirementsPanel scene={api.scene} />;
      if (api.scene === 4) return <GuiArtifact />;
      if (api.scene >= 5) return composeStage(api, activeFor(api));
      return null;
    },
    renderBare: () => (
      <div className="bare-hero">
        <article className="card card--compose">
          <div className="card-head">
            <span className="card-tag">◢ COMPOSE</span>
            <span className="card-sub">your form, assembled from reusable blocks</span>
          </div>
          <div className="card-body compose-body">
            <p className="compose-hint">
              You don&rsquo;t hand-roll this form — you <strong>compose</strong> it from blocks.
              Toggle one and GolemUI recomposes the form live. Even the hard parts — reactivity,
              conditionals, custom widgets — are just more blocks.
            </p>
            <div className="block-list">
              {SECTION_BOXES.map((s) => {
                const bid = s.blockId;
                const on = s.locked || (bid ? sandboxActive.has(bid) : false);
                return (
                  <button
                    key={s.key}
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-disabled={!bid}
                    className={`block-toggle ${on ? 'is-on' : ''}${s.locked ? ' is-base' : ''}`}
                    onClick={bid ? () => toggleBlock(bid) : undefined}
                    onMouseEnter={() => setHoverSection(s.key)}
                    onMouseLeave={() => setHoverSection(null)}
                    onFocus={() => setHoverSection(s.key)}
                    onBlur={() => setHoverSection(null)}
                  >
                    <span className="bt-box" aria-hidden="true">
                      {on ? '✓' : ''}
                    </span>
                    <span className="bt-text">
                      <span className="bt-label bt-label--section">{s.section}</span>
                      <span className="bt-hint">{s.hint}</span>
                    </span>
                    <span className="bt-power">{s.power ?? 'ALWAYS ON'}</span>
                  </button>
                );
              })}

              {/* Accessibility + Localization come free — full blocks, but locked
                 on. Hovering each shows how to experience it. */}
              <div
                className="block-toggle is-free"
                role="switch"
                aria-checked="true"
                aria-disabled="true"
                tabIndex={0}
                onMouseEnter={() => setA11yHint(true)}
                onMouseLeave={() => setA11yHint(false)}
                onFocus={() => setA11yHint(true)}
                onBlur={() => setA11yHint(false)}
              >
                <span className="bt-box" aria-hidden="true">
                  ✓
                </span>
                <span className="bt-text">
                  <span className="bt-label">♿ Accessibility</span>
                  <span className="bt-hint">Roles, labels, keyboard &amp; focus — hover, then Tab the form</span>
                </span>
                <span className="bt-power bt-power--free">FREE</span>
              </div>
              <div
                className="block-toggle is-free"
                role="switch"
                aria-checked="true"
                aria-disabled="true"
                tabIndex={0}
                onMouseEnter={() => setLocaleFlash(true)}
                onMouseLeave={() => setLocaleFlash(false)}
                onFocus={() => setLocaleFlash(true)}
                onBlur={() => setLocaleFlash(false)}
              >
                <span className="bt-box" aria-hidden="true">
                  ✓
                </span>
                <span className="bt-text">
                  <span className="bt-label">🌐 Localization</span>
                  <span className="bt-hint">Every label is data — hover, then flip EN / 日本語</span>
                </span>
                <span className="bt-power bt-power--free">FREE</span>
              </div>
            </div>
          </div>
        </article>
        <article className="card card--code">
          <div className="card-head">
            <span className="card-tag">◈ CODE</span>
            <span className="card-sub">
              my-form.ts — the <code>{'{gui.}'}</code> definition
            </span>
          </div>
          <div className="card-body code-body">
            <CodeBanner
              active={sandboxActive}
              lastToggled={lastToggled}
              pulse={pulse}
              hoverSection={hoverSection}
            />
          </div>
        </article>
        <FormCard
          active={sandboxActive}
          lang={lang}
          pulse={pulse}
          a11ySpot={a11ySpot}
          onLang={setLang}
          submitted={submitted}
          onSubmit={(e) => setSubmitted(pickActiveFields(e.data, sandboxActive))}
          flashBlock={lastToggled}
          flashNonce={flashNonce}
          hoverSection={hoverSection}
          localeFlash={localeFlash}
          a11yHint={a11yHint}
        />
      </div>
    ),
  };

  return <GameShell {...config} />;
}

/* ─── CodeBanner (full-width strip under the bare hero) ───────────────────
   Shows the composed {gui.} definition. Each line belongs to a section; the line
   dims when its block is off, pulses when toggled, and lights when you hover its
   box — so box → code → form is one connected chain. */
type CodeOwner = BlockId | 'base' | 'contact';
const CODE_LINES: { owner: CodeOwner; depth: number; text: string }[] = [
  { owner: 'base', depth: 0, text: 'gui.layouts.column([' },
  { owner: 'contact', depth: 1, text: "gui.inputs.textInput('name')," },
  { owner: 'contact', depth: 1, text: "gui.inputs.textInput('email', { validator })," },
  { owner: 'address', depth: 1, text: "...address('ship'),          // one reusable block" },
  { owner: 'reactive', depth: 1, text: "gui.inputs.dropdown('country', { onChange: setCity })," },
  { owner: 'reactive', depth: 1, text: "gui.inputs.radiogroup('city', { when: '$country' })," },
  { owner: 'conditional', depth: 1, text: "gui.inputs.checkbox('billingDiffers')," },
  { owner: 'conditional', depth: 1, text: "...address('bill'),          // reused, when billing differs" },
  { owner: 'currency', depth: 1, text: "gui.inputs.dropdown('currency', { itemRenderer })," },
  { owner: 'base', depth: 1, text: "gui.actions.button({ actionType: 'submit' })," },
  { owner: 'base', depth: 0, text: '])' },
];

const CODE_NS = new Set(['layouts', 'inputs', 'actions', 'displays']);
const CODE_FN = new Set([
  'column', 'verticalFlex', 'textInput', 'dropdown', 'radiogroup', 'checkbox', 'button', 'display', 'address',
]);

// Lightweight syntax highlight — gui / namespaces / calls / strings / comments.
function highlightCode(text: string, kp: string): ReactNode[] {
  const ci = text.indexOf('//');
  const code = ci >= 0 ? text.slice(0, ci) : text;
  const comment = ci >= 0 ? text.slice(ci) : '';
  const out: ReactNode[] = [];
  const re = /('[^']*')|([A-Za-z_$][\w$]*)|(\s+)|([^\sA-Za-z_$']+)/g;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(code))) {
    if (m[1]) out.push(<span key={kp + k++} className="t-str">{m[1]}</span>);
    else if (m[2]) {
      const w = m[2];
      const cls = w === 'gui' ? 't-gui' : CODE_NS.has(w) ? 't-ns' : CODE_FN.has(w) ? 't-fn' : 't-id';
      out.push(<span key={kp + k++} className={cls}>{w}</span>);
    } else if (m[3]) out.push(m[3]);
    else out.push(<span key={kp + k++} className="t-punc">{m[4]}</span>);
  }
  if (comment) out.push(<span key={kp + 'c'} className="t-comment">{comment}</span>);
  return out;
}

function CodeBanner({
  active,
  lastToggled,
  pulse,
  hoverSection,
}: {
  active: Set<BlockId>;
  lastToggled: BlockId | null;
  pulse: boolean;
  hoverSection?: string | null;
}) {
  return (
    <div className="code-banner" role="group" aria-label="The composed {gui.} definition">
      <pre className="cb-code">
        <code>
          {CODE_LINES.map((ln, i) => {
            const on =
              ln.owner === 'base' || ln.owner === 'contact' || active.has(ln.owner as BlockId);
            const hot = hoverSection != null && ln.owner === hoverSection;
            const pulsing = pulse && ln.owner === lastToggled;
            return (
              <span
                key={i}
                className={`cb-line${on ? '' : ' is-off'}${hot ? ' is-hot' : ''}${
                  pulsing ? ' is-pulse' : ''
                }`}
              >
                {'  '.repeat(ln.depth)}
                {highlightCode(ln.text, i + '-')}
                {'\n'}
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

/* ─── ComposePanel (middle — the composition, on screen) ──────────────── */

interface ComposePanelProps {
  tree: ReturnType<typeof composeTree>;
  pulse: boolean;
  lastToggled: BlockId | null;
  mount: string;
  widget: string;
  frameworkName: string;
}

function ComposePanel({ tree, pulse, lastToggled, mount, widget, frameworkName }: ComposePanelProps) {
  return (
    <article className="card card--compose-tree">
      <div className="card-head">
        <span className="card-tag">◇ {'{gui.}'}</span>
        <span className="card-sub">the code is the structure</span>
      </div>
      <div className="card-body tree-body">
        <p className="tree-lead">
          Every UI is <strong>composed</strong> from primitives. This whole form
          is one tree — and a block is just a value you reuse:
        </p>
        <pre className="tree-code">
          <code>
            {tree.map((ln, i) => (
              <span
                key={i}
                className={`tree-line${pulse && ln.owner === lastToggled ? ' is-pulse' : ''}`}
              >
                {'  '.repeat(ln.depth) + ln.text + '\n'}
              </span>
            ))}
          </code>
        </pre>
        <div className="mp-mount-block">
          <span className="mp-mount-cap" aria-hidden="true">
            wrap a native component — {frameworkName}-specific:
          </span>
          <pre className="mp-mount mp-mount--widget">
            <code>{widget}</code>
          </pre>
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

/* ─── FormCard (right — the composed, rendered form) ──────────────────── */

// The first field of each section — used to find its wrapper (gui renders
// light-DOM fields with data-cy="<path>_<type>") so we can light the whole section.
const SECTION_FIRST_PATH: Record<string, string> = {
  contact: 'name',
  address: 'shipStreet',
  reactive: 'country',
  conditional: 'billingDiffers',
  currency: 'currency',
};

interface FormCardProps {
  active: Set<BlockId>;
  lang: Lang;
  pulse: boolean;
  a11ySpot: boolean;
  onLang?: (l: Lang) => void;
  submitted: Record<string, unknown> | null;
  onSubmit: (e: FormSubmitEvent) => void;
  flashBlock?: BlockId | null;
  flashNonce?: number;
  hoverSection?: string | null;
  localeFlash?: boolean;
  a11yHint?: boolean;
}

// Light a whole section by finding its first field and walking up to its
// section wrapper (each section is its own verticalFlex → one `.gui-flex`).
function sectionFor(host: HTMLElement, key: string): Element | null {
  const first = SECTION_FIRST_PATH[key];
  if (!first) return null;
  const field = host.querySelector(`[data-cy^="${first}"]`);
  return field?.closest('.gui-flex') ?? null;
}

function FormCard({
  active,
  lang,
  pulse,
  a11ySpot,
  onLang,
  submitted,
  onSubmit,
  flashBlock,
  flashNonce,
  hoverSection,
  localeFlash,
  a11yHint,
}: FormCardProps) {
  const blocksOn = active.size;
  const hostRef = useRef<HTMLDivElement>(null);
  // Compose once per block-set — the form re-mounts on a toggle (for the flash),
  // NOT on a language change. The {gui.} translator below re-labels live instead.
  const formKey = useMemo(() => [...active].sort().join(','), [active]);
  // One translator instance, owned by this card. composeForm emits translation
  // KEYS; this resolves them to the active language and tells GolemUI the lang,
  // so the <form> flips to dir="rtl" for Arabic on its own.
  const localizationRef = useRef<ReturnType<typeof createLocalization> | null>(null);
  if (!localizationRef.current) localizationRef.current = createLocalization(lang);
  const localization = localizationRef.current;
  useEffect(() => {
    localization.setLang(lang);
  }, [lang, localization]);
  const config = useMemo(
    () => ({
      formDef: composeForm(active),
      data: SEED_DATA,
      formConfig: { widgetLoaders, itemRenderers: { currency: CurrencyItemRenderer } },
      localization,
    }),
    [active, localization],
  );

  // Hovering a block lights its whole section in the form — the primary cue for
  // "which block is which". Persistent while hovered, no remount involved.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.querySelectorAll('.section-hot').forEach((el) => el.classList.remove('section-hot'));
    if (!hoverSection) return;
    sectionFor(host, hoverSection)?.classList.add('section-hot');
  }, [hoverSection, active]);

  // On a block toggle, briefly light the section that just appeared/changed —
  // after the form re-composes (so it lands after the fields, not on top of them),
  // and scroll it into view so the change is findable.
  useEffect(() => {
    if (!flashNonce || !flashBlock) return;
    const host = hostRef.current;
    if (!host) return;
    let section: Element | null = null;
    const show = setTimeout(() => {
      section = sectionFor(host, flashBlock);
      if (!section) return;
      section.classList.add('section-flash');
      section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 320);
    const clear = setTimeout(() => section?.classList.remove('section-flash'), 2000);
    return () => {
      clearTimeout(show);
      clearTimeout(clear);
      section?.classList.remove('section-flash');
    };
  }, [flashNonce, flashBlock]);

  return (
    <article className="card card--app">
      <div className="card-head card-head--form">
        <span className="card-tag">▶ THE FORM</span>
        <span className="card-sub">
          composed by <code>{'{gui.}'}</code> — {blocksOn} block{blocksOn === 1 ? '' : 's'}
        </span>
        {onLang && (
          <span className={`lang-wrap${localeFlash ? ' is-hint' : ''}`}>
            <LangToggle
              lang={lang}
              onLang={(l) => onLang(l as Lang)}
              langs={[
                { id: 'en', label: 'EN' },
                { id: 'ja', label: '日本語' },
                { id: 'ar', label: 'العربية' },
              ]}
            />
          </span>
        )}
        <span className={`form-live${pulse ? ' is-on' : ''}`} aria-hidden="true">
          ● {pulse ? 'RE-RENDERED' : 'LIVE'}
        </span>
      </div>
      <div
        ref={hostRef}
        className={`card-body app-host${a11ySpot ? ' a11y-spot' : ''}${
          localeFlash || a11yHint ? ' hover-flash' : ''
        }`}
      >
        {a11ySpot && (
          <div className="a11y-banner" aria-hidden="true">
            ♿ ARIA roles · labels · keyboard · live errors — already there · 🌐 {lang === 'ja' ? '日本語' : 'localised'}
          </div>
        )}
        {a11yHint && (
          <div className="a11y-tab-hint" role="status">
            ⇥ Press <kbd>Tab</kbd> — every field is keyboard-navigable, with focus rings, labels &amp;
            ARIA. Free.
          </div>
        )}
        <GuiForm key={formKey} config={config} formSubmit={onSubmit} />
        <ReturnBar
          data={submitted}
          filledNote="one composed definition in, one typed payload out."
          idleNote={
            <>
              Hit <strong>Save</strong> — the composed form hands its{' '}
              <strong>typed</strong> payload straight back, valid against the schema.
            </>
          }
        />
      </div>
    </article>
  );
}

/* ─── RequirementsPanel (Act II — the asks pile up) ───────────────────── */

function RequirementsPanel({ scene }: { scene: number }) {
  const reqs = REQS.filter((r) => r.from <= scene);
  return (
    <div className="reqs-panel">
      <div className="reqs-head">
        <span className="reqs-clip">📋</span> THE CLIENT WANTS…
      </div>
      <ul className="reqs-list">
        {reqs.map((r, i) => (
          <li key={i} className={`reqs-item${i === reqs.length - 1 ? ' is-new' : ''}`}>
            <span className="reqs-bullet">▸</span>
            {r.text}
          </li>
        ))}
      </ul>
      <div className="reqs-foot">…all by hand. The LOC counter is climbing. →</div>
    </div>
  );
}
