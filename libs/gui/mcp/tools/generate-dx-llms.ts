/**
 * Generate the `llms.txt` floor for GolemUI's DX surface from the compile-verified
 * registry in `src/dx/dx-specs.ts`. This is the universal grounding delivery form for
 * AI surfaces that can't reach the MCP (a bare chat, a fetch-capable agent): same
 * source of truth as `dx_get_spec`, so the two can't drift.
 *
 * Run: `tsx libs/gui/mcp/tools/generate-dx-llms.ts`
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DX_SPECS, dxCommonNote, dxPatterns, listDxFactories } from '../src/dx/dx-specs';
import type { DxNamespace, DxSpec } from '../src/dx/dx-specs';

const here = dirname(fileURLToPath(import.meta.url));
const REPO = join(here, '..', '..', '..', '..');
const OUT = join(REPO, 'docs', 'public', 'llms-gui-dx.txt');

// Absolute docs origin. Links MUST be absolute (not a `<docs>` placeholder, not relative): the
// reference is fetched or inlined out-of-band, so the agent has no base URL to resolve against — an
// unresolved link reads as "page missing" and sends it spelunking into node_modules. (Arena scar:
// the placeholder breadcrumb caused cold builds to abandon the docs and never converge.)
const DOCS_BASE = 'https://golemui.com';

const DOC_GROUP: Record<DxNamespace, string> = {
  inputs: 'input-fields',
  actions: 'interactive-fields',
  displays: 'display-fields',
  layouts: 'layout-fields',
};

// Factory → page slug, only where it differs from the factory name lowercased.
const DOC_SLUG: Record<string, string> = {
  numberInput: 'number',
  booleanInput: 'toggle',
  datePicker: 'date-picker',
  markdownText: 'markdown-text',
  display: 'renderer',
  rangeCalendar: 'range-calendar',
  rangeDateInput: 'range-date-input',
  rangeDatePicker: 'range-date-picker',
  verticalFlex: 'flex',
  horizontalFlex: 'flex',
  verticalGrid: 'grid',
  horizontalGrid: 'grid',
};

/** The real, absolute reference-page URL for a factory's exhaustive options. */
function docUrl(s: DxSpec): string {
  const slug = DOC_SLUG[s.factory] ?? s.factory.toLowerCase();
  return `${DOCS_BASE}/dx/widgets-reference/${DOC_GROUP[s.namespace]}/${slug}.md`;
}

function build(): string {
  const lines: string[] = [];
  lines.push('# GolemUI — DX (`gui.*`) form-building reference for AI');
  lines.push('');
  lines.push(
    'GolemUI forms are **data, not markup**: a form is an array of field items built with the `gui` ' +
      'builder (imported from `@golemui/gui-shared`). There is NO chained/fluent builder (`gui.form().text()...`) ' +
      'and no `gui.actions.submitButton`. Each item is `gui.<namespace>.<factory>(...)`.',
  );
  lines.push('');
  lines.push(
    'HOW TO USE THIS REFERENCE: read it **once** and write the whole form from it — it is self-sufficient ' +
      'for almost every form, so you should rarely need another fetch. (Each agentic turn re-reads everything ' +
      'you have already fetched, so a single read here is cheaper than many small lookups.) For a widget’s ' +
      'exhaustive options beyond what is here, follow the **Reference:** link printed under that factory below — ' +
      `each is a full absolute URL on ${DOCS_BASE}. The complete page index is at ${DOCS_BASE}/llms.txt. ` +
      'These docs are the authoritative source — do NOT read the `@golemui` TypeScript declarations in ' +
      '`node_modules` or search the filesystem; everything you need is here or one Reference link away.',
  );
  lines.push('');
  lines.push('General: ' + dxCommonNote());
  lines.push('');
  lines.push(
    'Every example below is compile-checked against the real `@golemui` type declarations.',
  );
  lines.push('');

  // Factory index — the whole surface up front, so the reader knows every real name and
  // signature before scrolling (mirrors the `dx_list_factories` MCP catalog). Never guess a name.
  lines.push('## Factory index');
  lines.push('');
  lines.push(
    'Every `gui.*` factory and its calling convention. Look up the detail below for the ones you use.',
  );
  lines.push('');
  for (const factory of listDxFactories()) {
    const s = DX_SPECS[factory];
    lines.push(`- \`${s.call}\``);
  }
  lines.push('');

  for (const factory of listDxFactories()) {
    const s = DX_SPECS[factory];
    lines.push(`## gui.${s.namespace}.${s.factory}`);
    lines.push('');
    lines.push('Call: `' + s.call + '`');
    lines.push('');
    lines.push('```ts');
    lines.push(s.example);
    lines.push('```');
    if (s.notes.length) {
      lines.push('');
      for (const n of s.notes) lines.push(`- ${n}`);
    }
    lines.push('');
    lines.push(`Reference: ${docUrl(s)}`);
    lines.push('');
  }

  lines.push('# Patterns');
  lines.push('');
  lines.push('Cross-cutting patterns that apply to every factory (not a factory themselves).');
  lines.push('');
  for (const p of dxPatterns()) {
    lines.push(`## ${p.title}`);
    lines.push('');
    lines.push('```ts');
    lines.push(p.example);
    lines.push('```');
    lines.push('');
    for (const n of p.notes) lines.push(`- ${n}`);
    lines.push('');
  }
  return lines.join('\n');
}

const content = build();
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, content, 'utf-8');
// eslint-disable-next-line no-console
console.log(`Wrote ${OUT} (${content.length} bytes, ${listDxFactories().length} factories).`);
