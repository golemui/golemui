import type { FormSubmitEvent } from '@golemui/core';
import {
  GameShell,
  ReturnBar,
  type GameConfig,
  type SceneDef,
} from '@golemui/demo-engine';
import { GuiForm, widgetLoaders } from '@golemui/gui-react';
import { useMemo, useState, type ReactNode } from 'react';
import { PROMPTS } from './prompts';

/* ─── Launch params ──────────────────────────────────────────────────── */

const PARAMS =
  typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
// App-direct by default — the runnable three-column app shows immediately. The
// guided 8-bit walk (boss: THE BUSINESS MANAGER) ships in a later PR.
const START_BARE = PARAMS.get('mode') !== 'walk';

/* ─── Scenes (placeholder — the walk/game lands in a separate PR) ─────── */

const SCENES: SceneDef[] = [
  { chapter: '00', title: 'FORMS FROM A PROMPT', quest: 'Describe a form in plain language' },
];

/* ─── JSON syntax highlight ──────────────────────────────────────────── */

// Lightweight JSON highlight for the middle column — keys / strings / keywords
// / numbers / punctuation, matching the {gui.} code-window palette. (Same helper
// the sasha-demo middle column uses.)
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

// Render a multi-line prompt as a readable block: blank-line-separated
// paragraphs, lines ending in ":" as sub-headings, and "- " lines grouped into
// bullet lists. Keeps the left column legible for long, structured prompts.
function renderPrompt(text: string): ReactNode {
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  let key = 0;
  const flushBullets = () => {
    if (!bullets.length) return;
    blocks.push(
      <ul key={key++} className="pp-list">
        {bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>,
    );
    bullets = [];
  };
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) {
      flushBullets();
      continue;
    }
    if (line.startsWith('- ')) {
      bullets.push(line.slice(2));
      continue;
    }
    flushBullets();
    blocks.push(
      <p key={key++} className={line.endsWith(':') ? 'pp-head' : 'pp-para'}>
        {line}
      </p>,
    );
  }
  flushBullets();
  return blocks;
}

/* ─── App — thin orchestrator over the shared engine ─────────────────── */

export function App() {
  const [selectedId, setSelectedId] = useState(PROMPTS[0]?.id ?? '');
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null);

  const selected = useMemo(
    () => PROMPTS.find((p) => p.id === selectedId) ?? PROMPTS[0],
    [selectedId],
  );
  const json = useMemo(
    () => (selected ? JSON.stringify(selected.formDefinition, null, 2) : ''),
    [selected],
  );
  // Clone the definition before handing it to GuiForm — the core form
  // normalizes/mutates its formDef in place, so we keep our own copy pristine
  // for the JSON column and the submit-label lookup.
  const guiConfig = useMemo(
    () => ({
      formDef: structuredClone(selected?.formDefinition ?? { form: [] }),
      formConfig: { widgetLoaders },
    }),
    [selected],
  );

  function pick(id: string) {
    setSelectedId(id);
    setSubmitted(null);
  }

  /* ── Left — the three example prompts (validated in our MCP) ── */
  function promptCard() {
    return (
      <article className="card card--prompts">
        <div className="card-head">
          <span className="card-tag">◢ PROMPT</span>
          <span className="card-sub">describe a form — validated in our MCP</span>
        </div>
        <div className="card-body prompt-body">
          <p className="prompt-hint">
            Pick a prompt. An LLM turns it into a <code>{'{gui.}'}</code> form definition;
            our MCP validates it before it ships.
          </p>
          <div className="prompt-list">
            {PROMPTS.map((p) => {
              const on = p.id === selected?.id;
              return (
                <div key={p.id} className={`prompt-item${on ? ' is-on' : ''}`}>
                  <button
                    type="button"
                    className="pi-head"
                    aria-expanded={on}
                    onClick={() => pick(p.id)}
                  >
                    <span className="pi-dot" aria-hidden="true">{on ? '●' : '○'}</span>
                    <span className="pi-label">{p.label}</span>
                    <span className="pi-chev" aria-hidden="true">▾</span>
                  </button>
                  {on && <div className="pi-prompt">{renderPrompt(p.prompt)}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </article>
    );
  }

  /* ── Middle — the validated {gui.} JSON ── */
  function jsonCard() {
    return (
      <article className="card card--code">
        <div className="card-head">
          <span className="card-tag">◈ JSON</span>
          <span className="card-sub">
            the <code>{'{gui.}'}</code> definition the model produced
          </span>
          <span className="mcp-valid" aria-label="Validated by the GolemUI MCP">
            ✓ validated
          </span>
        </div>
        <div className="card-body code-body">
          <div className="code-banner" role="group" aria-label="The validated GolemUI JSON definition">
            <pre className="cb-code">
              <code>{highlightJson(json)}</code>
            </pre>
          </div>
        </div>
      </article>
    );
  }

  /* ── Right — the rendered form ── */
  function appCard() {
    return (
      <article className="card card--app">
        <div className="card-head card-head--form">
          <span className="card-tag">▶ THE FORM</span>
          <span className="card-sub">rendered straight from that JSON — no form code</span>
        </div>
        <div className="card-body app-host">
          <GuiForm
            key={selected?.id}
            config={guiConfig}
            formSubmit={(e: FormSubmitEvent) => setSubmitted(e.data)}
          />
          <ReturnBar
            data={submitted}
            filledNote="typed straight from the form — exactly the shape the prompt described."
            idleNote={
              <>
                Hit <strong>{actionLabel(selected?.formDefinition)}</strong> — the form hands
                back a <strong>typed</strong> payload, valid against the rules the MCP checked.
              </>
            }
          />
        </div>
      </article>
    );
  }

  const config: GameConfig = {
    shellClass: 'aiden-shell',
    scenes: SCENES,
    startBare: START_BARE,
    title: 'FORMS FROM A PROMPT',
    bareTitle: 'FORMS FROM A PROMPT',
    bareQuestTease: 'Want the story? Outwit THE BUSINESS MANAGER in a quick 8-bit quest.',
    lines: () => [],
    cta: () => undefined,
    options: () => [],
    engagement: () => true,
    stats: () => [
      { label: 'PROMPTS', value: PROMPTS.length, accent: 'info' },
      { label: 'FORM CODE', value: 0, accent: 'success' },
    ],
    renderStage: () => renderColumns(),
    renderBare: () => renderColumns(),
  };

  function renderColumns() {
    return (
      <div className="bare-hero">
        {promptCard()}
        {jsonCard()}
        {appCard()}
      </div>
    );
  }

  return <GameShell {...config} />;
}

/* ─── helpers ────────────────────────────────────────────────────────── */

// The submit button's label, so the idle hint matches the rendered CTA.
function actionLabel(def: Record<string, unknown> | undefined): string {
  const form = def?.form;
  if (!Array.isArray(form)) return 'Submit';
  const submit = (form as Array<Record<string, unknown>>).find(
    (w) => w.kind === 'action' && w.actionType === 'submit',
  );
  return typeof submit?.label === 'string' ? submit.label : 'Submit';
}
