import type { ReactNode } from 'react';

/**
 * Display helpers shared by the FORMS FROM A PROMPT demos.
 * =======================================================
 * Both the aiden-demo (the bare app on /demos) and the quests-portal (the 8-bit
 * walk) render the same prompts: the JSON the model produced (highlightJson),
 * the natural-language ask formatted for reading (renderPrompt), and the submit
 * label (actionLabel) so the idle hint matches the rendered CTA. React-producing,
 * so this file is .tsx and is reached via the @golemui/forms-from-prompt-core alias.
 */

// Lightweight JSON highlight for the JSON column — keys / strings / keywords /
// numbers / punctuation, matching the {gui.} code-window palette.
export function highlightJson(json: string): ReactNode[] {
  const re =
    /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)|([{}[\],])/g;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(json))) {
    if (m.index > last) out.push(json.slice(last, m.index));
    if (m[1])
      out.push(
        <span key={k++} className="t-key">
          {m[1]}
        </span>,
      );
    else if (m[2])
      out.push(
        <span key={k++} className="t-str">
          {m[2]}
        </span>,
      );
    else if (m[3])
      out.push(
        <span key={k++} className="t-kw">
          {m[3]}
        </span>,
      );
    else if (m[4])
      out.push(
        <span key={k++} className="t-num">
          {m[4]}
        </span>,
      );
    else
      out.push(
        <span key={k++} className="t-punc">
          {m[0]}
        </span>,
      );
    last = re.lastIndex;
  }
  if (last < json.length) out.push(json.slice(last));
  return out;
}

// Render a multi-line prompt as a readable block: blank-line-separated
// paragraphs, lines ending in ":" as sub-headings, and "- " lines grouped into
// bullet lists. Keeps the left column legible for long, structured prompts.
export function renderPrompt(text: string): ReactNode {
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

// The submit button's label, so the idle hint matches the rendered CTA.
export function actionLabel(def: Record<string, unknown> | undefined): string {
  const form = def?.form;
  if (!Array.isArray(form)) return 'Submit';
  const submit = (form as Array<Record<string, unknown>>).find(
    (w) => w.kind === 'action' && w.actionType === 'submit',
  );
  return typeof submit?.label === 'string' ? submit.label : 'Submit';
}
