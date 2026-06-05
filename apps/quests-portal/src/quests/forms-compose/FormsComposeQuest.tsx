/**
 * FORMS COMPOSE — the quest, owned by the quests-portal.
 * ======================================================
 * Pillar II's 8-bit walk. Reuses the shared @golemui/demo-engine (the RPG
 * shell + state machine) and @golemui/forms-compose-core (the {gui.} form
 * definition + on-screen tree). Everything walk-specific lives here; there is
 * no bare/app mode — that stays in rob-demo for the /demos page. The portal
 * picks the framework on its landing screen and passes it in, so the engine
 * starts past its own CHOOSE-YOUR-HERO scene.
 */
import type { FormSubmitEvent } from '@golemui/core';
import {
  GameShell,
  GuiArtifact,
  ReturnBar,
  type Framework,
  type GameApi,
  type GameConfig,
} from '@golemui/demo-engine';
import {
  composeFormMeta,
  composeTree,
  createLocalization,
  CurrencyItemRenderer,
  metaFromActive,
  SEED_DATA,
  type BlockId,
  type Lang,
} from '@golemui/forms-compose-core';
import { GuiForm, widgetLoaders } from '@golemui/gui-react';
import type { FormComponentHandle } from '@golemui/react';
import { useEffect, useMemo, useRef, useState } from 'react';

/* ─── Per-framework code targets ─────────────────────────────────────── */

const MOUNT_BY_FW: Record<Framework, string> = {
  react: '<GuiForm config={config} formSubmit={onSubmit} />',
  angular: '<gui-form [config]="config" (formSubmit)="onSubmit($event)">',
  vue: '<GuiForm :config="config" @form-submit="onSubmit" />',
  lit: '<gui-form .config=${config} @formSubmit=${onSubmit}>',
  vanilla: "form.config = config;\nform.addEventListener('formSubmit', onSubmit);",
};
// The install shown in the boss beat — the primary {gui.} package per framework.
const INSTALL_BY_FW: Record<Framework, string> = {
  react: 'npm i @golemui/gui-react',
  angular: 'npm i @golemui/gui-angular',
  vue: 'npm i @golemui/gui-vue',
  lit: 'npm i @golemui/gui-lit',
  vanilla: 'npm i @golemui/gui-lit',
};

/* ─── Scenes (content + cinematic flags) ─────────────────────────────── */

interface QuestScene {
  chapter: string;
  act?: string;
  title: string;
  quest?: string;
  boss?: boolean;
  bossTitle?: string;
  itemGet?: boolean;
  lines: string[];
  cta?: string;
}

const SCENES: QuestScene[] = [
  {
    chapter: '00',
    title: 'CHOOSE YOUR HERO',
    quest: 'Pick your class',
    lines: ['BEFORE THE JOB: A CHOICE.', 'GOLEMUI RUNS IN ANY FRAMEWORK. WHICH IS YOURS?'],
    cta: '▶ BEGIN',
  },
  {
    chapter: '01',
    act: 'ACT I',
    title: 'THE BRIEF',
    quest: 'Ship a signup form',
    lines: [
      'A client calls. “We need a form. Signup —',
      'name, email, a country dropdown. Nothing fancy.”',
      '“…Friday?” Easy. Three inputs. You hand-roll it.',
    ],
    cta: 'SHIP IT ▶',
  },
  {
    chapter: '02',
    act: 'ACT II',
    title: 'THE CALLBACK',
    quest: 'A 2nd form — don’t rewrite',
    lines: [
      '…they call back. “LOVE it. Now a CHECKOUT too.”',
      '“Same address fields. Same validation. Don’t rewrite it.”',
      'You copy-paste the block. A flicker of doubt.',
    ],
    cta: 'FINE… ▶',
  },
  {
    chapter: '03',
    act: 'ACT II',
    title: 'THE CREEP',
    quest: 'Make it react & branch',
    lines: [
      '“Oh — city should FOLLOW the country.”',
      '“And billing? Only show it when it DIFFERS.”',
      'The wiring spaghetti is starting to smell.',
    ],
    cta: 'UH-OH ▶',
  },
  {
    chapter: '04',
    act: 'ACT II',
    title: 'THE CLIENT!!',
    bossTitle: '👹 THE CLIENT',
    boss: true,
    quest: 'Survive the endless client',
    lines: [
      'AND OUR OWN CURRENCY WIDGET. AND, AND, AND—',
      'THE REQUESTS NEVER STOP. NESTED. MUTATING.',
      'HAND-CODE THIS TANGLE FOREVER? OR…',
    ],
  },
  {
    chapter: '05',
    act: 'ACT III',
    title: 'ITEM GET',
    itemGet: true,
    quest: 'Claim the engine',
    lines: [
      'A LEGENDARY ENGINE IS BESTOWED UPON YOU.',
      'IT IS CALLED GOLEMUI. EVERY UI IS COMPOSED—',
      '—LAYOUTS, INPUTS, ACTIONS. EVEN THE HARD PARTS.',
    ],
    cta: 'WIELD IT ▶',
  },
  {
    chapter: '06',
    act: 'ACT III',
    title: 'REUSE',
    quest: 'Reuse one block, twice',
    lines: [
      'REUSE, they said. Write the address block ONCE,',
      'then drop it into shipping AND billing — a block is',
      'just a value. Your move:',
    ],
    cta: 'NICE ▶',
  },
  {
    chapter: '07',
    act: 'ACT III',
    title: 'LOGIC',
    quest: 'Compose react + conditional',
    lines: [
      'LOGIC, they said. City should follow country; billing',
      'shows only when it differs. Declared, not wired —',
      'compose both:',
    ],
    cta: 'KEEP GOING ▶',
  },
  {
    chapter: '08',
    act: 'ACT III',
    title: 'INTEGRATE',
    quest: 'Wrap your own widget',
    lines: [
      'YOUR widget, they said. Wrap your framework’s own',
      'component as a custom renderer — like any other field.',
      'Drop it in:',
    ],
    cta: 'ALMOST ▶',
  },
  {
    chapter: '09',
    act: 'ACT IV',
    title: 'ONE MORE THING',
    quest: 'Ship it worldwide',
    lines: [
      '“…one more thing. It ships to 12 COUNTRIES.',
      'And legal wants a clean ACCESSIBILITY pass. Monday.”',
      'Relax. It already shipped that way — watch.',
    ],
    cta: 'TAKE ME TO THE APP ▶',
  },
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

// The data fields each block contributes. The form's data store seeds every
// field (so toggling stays instant); on submit we keep only the fields that
// belong to currently-active blocks — a deselected block never leaks into the
// "your backend receives" payload.
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

/* ─── Quest — thin orchestrator over the shared engine ───────────────── */

export interface FormsComposeQuestProps {
  /** Chosen on the portal landing screen — the engine starts past CH-00. */
  framework: Framework;
  /** Final CTA / SKIP — hand back to the portal (e.g. the /demos page). */
  onComplete: () => void;
}

export function FormsComposeQuest({ framework, onComplete }: FormsComposeQuestProps) {
  const [walkActive, setWalkActive] = useState<Set<BlockId>>(() => new Set());
  const [lang, setLang] = useState<Lang>('en');
  const [a11ySpot, setA11ySpot] = useState(false);
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null);
  const [pulse, setPulse] = useState(false);
  const [lastToggled, setLastToggled] = useState<BlockId | null>(null);

  useEffect(() => {
    if (lastToggled === null) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 700);
    return () => clearTimeout(t);
  }, [lastToggled, walkActive]);

  function composeMove(id: BlockId) {
    setWalkActive((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
    setLastToggled(id);
  }

  const activeFor = (api: GameApi) => (api.scene >= 5 ? walkActive : new Set<BlockId>());

  function composeStage(api: GameApi, active: Set<BlockId>) {
    const fw = api.framework ?? framework;
    return (
      <>
        <ComposePanel
          tree={composeTree(active, fw)}
          pulse={pulse}
          lastToggled={lastToggled}
          mount={MOUNT_BY_FW[fw]}
          frameworkName={fw.toUpperCase()}
        />
        <FormCard
          active={active}
          lang={lang}
          pulse={pulse}
          a11ySpot={a11ySpot}
          submitted={submitted}
          onSubmit={(e) => setSubmitted(pickActiveFields(e.data, active))}
        />
      </>
    );
  }

  const config: GameConfig = {
    shellClass: 'quest-shell',
    scenes: SCENES,
    startBare: false,
    startFramework: framework,
    // The narrative rides in the command box (left), buttons on the right — no
    // top dialog, so the stage gets the whole upper half for code + form.
    dialogInConsole: true,
    title: 'FORMS COMPOSE',
    lines: (api) => SCENES[api.scene]?.lines ?? [],
    cta: (api) => SCENES[api.scene]?.cta,
    options: (api) => {
      if (api.scene === 4) {
        return [
          { key: '1', label: INSTALL_BY_FW[api.framework ?? framework], action: api.next },
          { key: '2', label: 'Nah… I’ll hand-roll it', action: api.panic },
        ];
      }
      const moves = SCENE_MOVES[api.scene];
      if (moves) {
        return moves
          .filter((m) => !walkActive.has(m))
          .map((m, i) => ({
            key: String(i + 1),
            label: `▸ ${MOVE_LABEL[m]}`,
            action: () => composeMove(m),
          }));
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
      title: 'THE CLIENT!!',
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
    stageClass: (api) => (api.scene >= 5 ? 'is-compose' : ''),
    onScene: (scene) => {
      if (scene === 9) {
        setA11ySpot(true);
        window.setTimeout(() => setLang('ja'), 1600);
      } else {
        setA11ySpot(false);
      }
    },
    // The final "TAKE ME TO THE APP" (and SKIP) leaves the walk → hand back to
    // the portal, which returns to the /demos page (the app lives there).
    onEnterBare: onComplete,
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
    // Walk-only quest: bare is just the hand-off frame before the portal navigates.
    renderBare: () => <div className="quest-return">▶ Returning to the demos…</div>,
  };

  return <GameShell {...config} />;
}

/* ─── ComposePanel (the composition, on screen) ──────────────────────── */

interface ComposePanelProps {
  tree: ReturnType<typeof composeTree>;
  pulse: boolean;
  lastToggled: BlockId | null;
  mount: string;
  frameworkName: string;
}

function ComposePanel({ tree, pulse, lastToggled, mount, frameworkName }: ComposePanelProps) {
  return (
    <article className="card card--compose-tree">
      <div className="card-head">
        <span className="card-tag">◇ {'{gui.}'}</span>
        <span className="card-sub">the code is the structure</span>
      </div>
      <div className="card-body tree-body">
        <p className="tree-lead">
          Every UI is <strong>composed</strong> from primitives. This whole form is one tree — and a
          block is just a value you reuse:
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

/* ─── FormCard (the composed, rendered form — ONE declarative {gui.} def) ──
   Like the /demos bare app, the form is a single composeFormMeta() definition;
   sections show/hide via GolemUI's include:{when:'$meta._block_*'} reactivity.
   As blocks unlock (composeMove → walkActive), setMeta flips the flags — the
   form never rebuilds or remounts, just reveals the next section. */

interface FormCardProps {
  active: Set<BlockId>;
  lang: Lang;
  pulse: boolean;
  a11ySpot: boolean;
  submitted: Record<string, unknown> | null;
  onSubmit: (e: FormSubmitEvent) => void;
}

function FormCard({ active, lang, pulse, a11ySpot, submitted, onSubmit }: FormCardProps) {
  const blocksOn = active.size;
  const formRef = useRef<FormComponentHandle>(null);
  const localizationRef = useRef<ReturnType<typeof createLocalization> | null>(null);
  if (!localizationRef.current) localizationRef.current = createLocalization(lang);
  const localization = localizationRef.current;
  useEffect(() => {
    localization.setLang(lang);
  }, [lang, localization]);

  // Built ONCE — block visibility rides in meta, so unlocking a block never
  // re-resolves/remounts the form (`active` only seeds the initial meta).
  const config = useMemo(
    () => ({
      formDef: composeFormMeta(),
      data: SEED_DATA,
      formConfig: { widgetLoaders, itemRenderers: { currency: CurrencyItemRenderer } },
      localization,
      meta: metaFromActive(active),
    }),
    [localization],
  );

  // Reveal each section as its block unlocks — live, no rebuild.
  useEffect(() => {
    formRef.current?.setMeta(metaFromActive(active));
  }, [active]);

  return (
    <article className="card card--app">
      <div className="card-head card-head--form">
        <span className="card-tag">▶ THE FORM</span>
        <span className="card-sub">
          composed by <code>{'{gui.}'}</code> — {blocksOn} block{blocksOn === 1 ? '' : 's'}
        </span>
        <span className={`form-live${pulse ? ' is-on' : ''}`} aria-hidden="true">
          ● {pulse ? 'RE-RENDERED' : 'LIVE'}
        </span>
      </div>
      <div className={`card-body app-host${a11ySpot ? ' a11y-spot' : ''}`} data-theme="8bit">
        {a11ySpot && (
          <div className="a11y-banner" aria-hidden="true">
            ♿ ARIA roles · labels · keyboard · live errors — already there · 🌐{' '}
            {lang === 'ja' ? '日本語' : 'localised'}
          </div>
        )}
        <GuiForm ref={formRef} config={config} formSubmit={onSubmit} />
        <ReturnBar
          data={submitted}
          filledNote="one composed definition in, one typed payload out."
          idleNote={
            <>
              Hit <strong>Save</strong> — the composed form hands its <strong>typed</strong> payload
              straight back, valid against the schema.
            </>
          }
        />
      </div>
    </article>
  );
}

/* ─── RequirementsPanel (Act II — the asks pile up) ──────────────────── */

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
