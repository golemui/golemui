/**
 * FORMS FROM A PROMPT — the quest, owned by the quests-portal.
 * ============================================================
 * Pillar I's 8-bit walk (boss: THE BUSINESS MANAGER). Reuses the shared
 * @golemui/demo-engine (the RPG shell + state machine) and
 * @golemui/forms-from-prompt-core (the canned prompt → validated {gui.} pairs +
 * the JSON / prompt display helpers). Everything walk-specific lives here; there
 * is no bare/app mode — that stays in aiden-demo for the /demos page. The portal
 * picks the framework on its landing screen and passes it in, so the engine
 * starts past its own CHOOSE-YOUR-HERO scene.
 *
 * Each of the three example prompts is its OWN step (scenes 4-6): you send the
 * manager's plain-language ask to the MCP, it emits a validated {gui.} JSON, and
 * the form renders — no form code. Only the STAGE differs from the other quests;
 * the shell, banner, dialog, battle bar and overlays are shared (../_quest-base.scss).
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
  actionLabel,
  highlightJson,
  PROMPTS,
  renderPrompt,
  type PromptExample,
} from '@golemui/forms-from-prompt-core';
import { GuiForm, widgetLoaders } from '@golemui/gui-react';
import { useEffect, useMemo, useState } from 'react';

/* ─── Per-framework code targets ─────────────────────────────────────── */

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

// One step per example prompt — the manager's asks, each gnarlier than the last.
const PROMPT_BY_ID: Record<string, PromptExample> = Object.fromEntries(
  PROMPTS.map((p) => [p.id, p]),
);
const STEP_PROMPTS = PROMPTS.map((p) => p.id);
const SCENE_PROMPT: Record<number, string> = {
  4: STEP_PROMPTS[0],
  5: STEP_PROMPTS[1],
  6: STEP_PROMPTS[2],
};

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
    quest: 'Three forms — by lunch',
    lines: [
      'THE MANAGER LEANS IN. “Quick one. I need THREE forms.',
      'Support ticket. Job application. Team setup. By LUNCH.”',
      '“Easy, right?” You open your editor. It is not easy.',
    ],
    cta: 'ON IT… ▶',
  },
  {
    chapter: '02',
    act: 'ACT II',
    title: 'THE MANAGER!!',
    bossTitle: '👔 THE BUSINESS MANAGER',
    boss: true,
    quest: 'Survive the lunch deadline',
    lines: [
      '“OH — and the job one has REPEATERS. And the team',
      'one NESTS them. With CONDITIONAL fields. Obviously.”',
      'HAND-CODE THREE OF THOSE BY LUNCH? OR…',
    ],
  },
  {
    chapter: '03',
    act: 'ACT III',
    title: 'ITEM GET',
    itemGet: true,
    quest: 'Claim the engine',
    lines: [
      'A LEGENDARY ENGINE IS BESTOWED UPON YOU.',
      'IT IS CALLED GOLEMUI. DESCRIBE A FORM IN WORDS—',
      '—ITS MCP EMITS A VALIDATED {gui.} DEFINITION.',
    ],
    cta: 'WIELD IT ▶',
  },
  {
    chapter: '04',
    act: 'ACT III',
    title: 'PROMPT IT',
    quest: 'Describe the support ticket',
    lines: [
      'DESCRIBE, they said. Not code — DESCRIBE. Tell the MCP',
      'what you want in plain language; it returns a validated',
      '{gui.} definition and the form renders. Your move:',
    ],
    cta: 'NEXT ASK ▶',
  },
  {
    chapter: '05',
    act: 'ACT III',
    title: 'PROMPT IT',
    quest: 'Describe the job application',
    lines: [
      'HARDER one: a job application — email, a markdown bio,',
      'and a REPEATABLE experience list with a conditional',
      'end-date. Still just words. Describe it:',
    ],
    cta: 'LAST ONE ▶',
  },
  {
    chapter: '06',
    act: 'ACT IV',
    title: 'ONE MORE THING',
    quest: 'Describe the team setup',
    lines: [
      '“…last one. Teams, with NESTED members, and four',
      'show/hide rules per member.” The boss final form.',
      'You don’t flinch. You just describe it:',
    ],
    cta: 'TAKE ME TO THE APP ▶',
  },
];

const MOVE_LABEL: Record<string, string> = Object.fromEntries(
  PROMPTS.map((p) => [p.id, `Send “${p.label}” to the MCP`]),
);

/* ─── Quest — thin orchestrator over the shared engine ───────────────── */

export interface FormsFromPromptQuestProps {
  /** Chosen on the portal landing screen — the engine starts past CH-00. */
  framework: Framework;
  /** Final CTA / SKIP — hand back to the portal (e.g. the /demos page). */
  onComplete: () => void;
}

export function FormsFromPromptQuest({ framework, onComplete }: FormsFromPromptQuestProps) {
  const [cast, setCast] = useState<Set<string>>(() => new Set());
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null);
  const [pulse, setPulse] = useState(false);
  const [lastCast, setLastCast] = useState<string | null>(null);

  useEffect(() => {
    if (lastCast === null) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 700);
    return () => clearTimeout(t);
  }, [lastCast]);

  function castPrompt(id: string) {
    setCast((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
    setLastCast(id);
    setSubmitted(null);
  }

  /* ── Stage pieces — the only quest-specific UI. ─────────────────────── */

  // ACT I — the manager's three asks, at a glance.
  function briefCard() {
    return (
      <article className="card card--prompts brief-card">
        <div className="card-head">
          <span className="card-tag">📋 THE BRIEF</span>
          <span className="card-sub">three forms — by lunch</span>
        </div>
        <div className="card-body prompt-body">
          <p className="prompt-hint">
            The Business Manager wants three forms. Today. Each one gnarlier than the last:
          </p>
          <div className="prompt-list">
            {PROMPTS.map((p, i) => (
              <div className="prompt-item" key={p.id}>
                <div className="pi-head is-static">
                  <span className="pi-dot" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="pi-label">{p.label}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="prompt-foot">Hand-code all three? Or… find another way. →</p>
        </div>
      </article>
    );
  }

  // Left — the active ask in plain language; cast prompts get a ✓.
  function promptCard(active: PromptExample) {
    return (
      <article className="card card--prompts">
        <div className="card-head">
          <span className="card-tag">◢ PROMPT</span>
          <span className="card-sub">describe it — our MCP validates the output</span>
        </div>
        <div className="card-body prompt-body">
          <div className="prompt-list">
            {PROMPTS.map((p) => {
              const on = p.id === active.id;
              const done = cast.has(p.id);
              return (
                <div
                  key={p.id}
                  className={`prompt-item${on ? ' is-on' : ''}${done ? ' is-done' : ''}`}
                >
                  <div className="pi-head is-static">
                    <span className="pi-dot" aria-hidden="true">
                      {done ? '●' : '○'}
                    </span>
                    <span className="pi-label">{p.label}</span>
                    {done && (
                      <span className="pi-check" aria-hidden="true">
                        ✓
                      </span>
                    )}
                  </div>
                  {on && <div className="pi-prompt">{renderPrompt(p.prompt)}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </article>
    );
  }

  // Middle — the validated {gui.} JSON the model produced (after it's cast).
  function jsonCard(active: PromptExample, castNow: boolean) {
    const json = JSON.stringify(active.formDefinition, null, 2);
    return (
      <article className="card card--code">
        <div className="card-head">
          <span className="card-tag">◈ JSON</span>
          <span className="card-sub">
            the <code>{'{gui.}'}</code> definition the model produced
          </span>
          {castNow && (
            <span className="mcp-valid" aria-label="Validated by the GolemUI MCP">
              ✓ validated
            </span>
          )}
        </div>
        <div className="card-body code-body">
          {castNow ? (
            <div
              className="code-banner"
              role="group"
              aria-label="The validated GolemUI JSON definition"
            >
              <pre className={`cb-code${pulse ? ' is-pulse' : ''}`}>
                <code>{highlightJson(json)}</code>
              </pre>
            </div>
          ) : (
            <div className="code-awaiting" aria-hidden="true">
              ▌ awaiting the MCP…
            </div>
          )}
        </div>
      </article>
    );
  }

  // Right — the rendered form (after it's cast). No form code.
  function formCard(active: PromptExample, castNow: boolean) {
    return (
      <article className="card card--app">
        <div className="card-head card-head--form">
          <span className="card-tag">▶ THE FORM</span>
          <span className="card-sub">rendered from that JSON — no form code</span>
          {castNow && (
            <span className={`form-live${pulse ? ' is-on' : ''}`} aria-hidden="true">
              ● {pulse ? 'RENDERED' : 'LIVE'}
            </span>
          )}
        </div>
        <div className={`card-body app-host${pulse ? ' is-rebuilt' : ''}`} data-theme="8bit">
          {castNow ? (
            <PromptForm
              prompt={active}
              onSubmit={(e) => setSubmitted(e.data)}
              submitted={submitted}
            />
          ) : (
            <div className="app-empty">
              <p>Send the ask to the MCP — the form renders itself.</p>
            </div>
          )}
        </div>
      </article>
    );
  }

  function promptStage(api: GameApi) {
    const active = PROMPT_BY_ID[SCENE_PROMPT[api.scene]] ?? PROMPTS[0];
    const castNow = cast.has(active.id);
    return (
      <>
        {promptCard(active)}
        {jsonCard(active, castNow)}
        {formCard(active, castNow)}
      </>
    );
  }

  const config: GameConfig = {
    shellClass: 'quest-shell',
    scenes: SCENES,
    startBare: false,
    startFramework: framework,
    // The narrative rides in the command box (left), buttons on the right — no
    // top dialog, so the stage gets the whole upper half for prompt + json + form.
    dialogInConsole: true,
    title: 'FORMS FROM A PROMPT',
    lines: (api) => SCENES[api.scene]?.lines ?? [],
    cta: (api) => SCENES[api.scene]?.cta,
    options: (api) => {
      if (api.scene === 2) {
        return [
          { key: '1', label: INSTALL_BY_FW[api.framework ?? framework], action: api.next },
          { key: '2', label: 'Nah… I’ll hand-code all three', action: api.panic },
        ];
      }
      const promptId = SCENE_PROMPT[api.scene];
      if (promptId && !cast.has(promptId)) {
        return [
          { key: '1', label: `▸ ${MOVE_LABEL[promptId]}`, action: () => castPrompt(promptId) },
        ];
      }
      return [];
    },
    engagement: (api) => {
      if (api.scene === 0) return api.framework !== null;
      if (api.scene === 2) return false;
      const promptId = SCENE_PROMPT[api.scene];
      if (promptId) return cast.has(promptId);
      return true;
    },
    stats: (api) => [
      { label: 'PROMPTS', value: cast.size, accent: 'info' },
      // The punchline: form code stays at 0 — until you panic and hand-code it.
      {
        label: 'FORM CODE',
        value: api.frenzy ? api.frenzyVal : 0,
        frenzy: api.frenzy,
        accent: 'warning',
      },
    ],
    reveal: () => ({
      title: 'THE BUSINESS MANAGER!!',
      subtitle: 'THREE FORMS · BY · LUNCH',
      payload: `+ a support ticket form
+ a job application   (repeaters, conditionals)
+ create teams        (NESTED repeaters!)
+ … all validated. all by lunch.`,
      footer: 'HAND-CODE THIS? · TICK · TOCK',
    }),
    zelda: { name: 'GOLEMUI', spell: 'PROMPT → VALIDATED FORM' },
    gameOver: (v) => ({
      statLine: `${v} LINES OF HAND-CODED FORMS · 0 SHIPPED`,
      sub: 'You typed. The manager kept talking.',
    }),
    stageClass: (api) => (api.scene >= 4 ? 'is-prompt' : ''),
    // The final "TAKE ME TO THE APP" (and SKIP) leaves the walk → hand back to
    // the portal, which returns to the /demos page (the app lives there).
    onEnterBare: onComplete,
    onRestart: () => {
      setCast(new Set());
      setSubmitted(null);
      setLastCast(null);
    },
    renderStage: (api) => {
      if (api.scene === 1) return briefCard();
      if (api.scene === 2 || api.scene === 3) return <GuiArtifact />;
      if (api.scene >= 4) return promptStage(api);
      return null;
    },
    // Walk-only quest: bare is just the hand-off frame before the portal navigates.
    renderBare: () => <div className="quest-return">▶ Returning to the demos…</div>,
  };

  return <GameShell {...config} />;
}

/* ─── PromptForm (the rendered form — its own component so the cloned, ────
   normalized {gui.} def is memoized per prompt and remounts cleanly between
   steps; the core mutates formDef in place, so each prompt gets a fresh clone). */

interface PromptFormProps {
  prompt: PromptExample;
  submitted: Record<string, unknown> | null;
  onSubmit: (e: FormSubmitEvent) => void;
}

function PromptForm({ prompt, submitted, onSubmit }: PromptFormProps) {
  const guiConfig = useMemo(
    () => ({ formDef: structuredClone(prompt.formDefinition), formConfig: { widgetLoaders } }),
    [prompt.id],
  );
  return (
    <>
      <GuiForm key={prompt.id} config={guiConfig} formSubmit={onSubmit} />
      <ReturnBar
        data={submitted}
        filledNote="typed straight from the form — exactly the shape the prompt described."
        idleNote={
          <>
            Hit <strong>{actionLabel(prompt.formDefinition)}</strong> — the form hands back a{' '}
            <strong>typed</strong> payload, valid against the rules the MCP checked.
          </>
        }
      />
    </>
  );
}
