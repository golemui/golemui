/**
 * Measures the server cost of rendering the GolemUI Components into a page.
 *
 * - renderElementsInHtml (Vue, Nuxt) on three pages: the components-ssr-* demo page, a large
 *   content page with the same few elements, and a form with 100 fields. It splits the cost into
 *   parsing the page and rendering the elements.
 * - renderElement (React) on the same elements, which renders each one with no page to parse.
 * - Vue's streaming render: where its chunks split, and what buffering the stream costs.
 *
 * Run with `npx tsx tools/bench-ssr-components.ts`.
 */
import { performance } from 'node:perf_hooks';
import { parse } from 'parse5';
import { createSSRApp, h } from 'vue';
import { renderToString, renderToWebStream } from 'vue/server-renderer';
import { renderElement, renderElementsInHtml } from '@golemui/gui-components/ssr';
import '@golemui/gui-components';

const plans = JSON.stringify([
  { label: 'Starter', value: 'starter' },
  { label: 'Team', value: 'team' },
]).replace(/"/g, '&quot;');

// The demo page as Vue renders it: the elements empty, with their attributes.
const demoElements = [
  '<gui-alert variant="info">Yearly billing saves two months.</gui-alert>',
  '<gui-textinput uid="email" name="email" label="Email" hint="We send the receipt here." required value="ada@example.com"></gui-textinput>',
  `<gui-select uid="plan" name="plan" label="Plan" value="team" options="${plans}"></gui-select>`,
  '<gui-date-picker uid="start" name="start" label="Start date" value="2026-11-02"></gui-date-picker>',
  '<gui-tabs active="billing"><gui-tab-list aria-label="Checkout"><gui-tab panel="billing">Billing</gui-tab><gui-tab panel="company">Company</gui-tab></gui-tab-list>' +
    '<gui-tab-panel name="billing"><gui-checkbox uid="terms" name="terms" label="I accept the terms"></gui-checkbox></gui-tab-panel>' +
    '<gui-tab-panel name="company"><gui-textinput uid="company" name="company" label="Company" value="Analytical Engines"></gui-textinput></gui-tab-panel></gui-tabs>',
  '<gui-button label="Pay 49 EUR" type="submit"></gui-button>',
].join('\n');

const shell = (body: string) =>
  `<!doctype html><html><head><meta charset="utf-8"><title>Checkout</title></head><body><main class="page"><h1>Checkout</h1>${body}</main></body></html>`;

const paragraph = (index: number) =>
  `<section id="s${index}"><h2>Section ${index}</h2><p>Lorem ipsum dolor sit amet, <a href="/docs/${index}">consectetur</a> adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p><ul><li>One</li><li>Two</li><li>Three</li></ul></section>`;

const pages = {
  'demo page (6 fields)': shell(`<form id="checkout">${demoElements}</form>`),
  'content page (6 fields)': shell(
    Array.from({ length: 700 }, (_, index) => paragraph(index)).join('') +
      `<form id="checkout">${demoElements}</form>`,
  ),
  'content page (no fields)': shell(
    Array.from({ length: 700 }, (_, index) => paragraph(index)).join(''),
  ),
  'form page (100 fields)': shell(
    `<form>${Array.from(
      { length: 100 },
      (_, index) =>
        `<gui-textinput uid="f${index}" name="f${index}" label="Field ${index}" value="Value ${index}"></gui-textinput>`,
    ).join('')}</form>`,
  ),
};

/** Median time of `run` in milliseconds, after a warm-up. */
function measure(run: () => unknown, iterations = 200): number {
  for (let index = 0; index < 20; index++) run();
  const times: number[] = [];
  for (let index = 0; index < iterations; index++) {
    const start = performance.now();
    run();
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  return times[Math.floor(times.length / 2)] ?? 0;
}

const ms = (value: number) => `${value.toFixed(2)} ms`;
const kb = (text: string) => `${(text.length / 1024).toFixed(0)} KB`;

console.log('renderElementsInHtml (Vue, Nuxt)');
for (const [name, page] of Object.entries(pages)) {
  const total = measure(() => renderElementsInHtml(page));
  const parseOnly = measure(() => parse(page, { sourceCodeLocationInfo: true }));
  console.log(
    `  ${name}: ${kb(page)} in, ${kb(renderElementsInHtml(page))} out. ` +
      `total ${ms(total)}, parsing ${ms(parseOnly)}, rendering the elements ${ms(total - parseOnly)}`,
  );
}

console.log('\nrenderElement (React), one element at a time');
const singles: Array<[string, () => unknown]> = [
  [
    'gui-textinput',
    () => renderElement('gui-textinput', { attributes: { uid: 'email', label: 'Email' } }),
  ],
  [
    'gui-select',
    () =>
      renderElement('gui-select', {
        attributes: { uid: 'plan', label: 'Plan', value: 'team' },
        properties: { options: JSON.parse(plans.replace(/&quot;/g, '"')) },
      }),
  ],
  [
    'gui-date-picker',
    () => renderElement('gui-date-picker', { attributes: { uid: 'start', value: '2026-11-02' } }),
  ],
  ['gui-checkbox', () => renderElement('gui-checkbox', { attributes: { uid: 'terms' } })],
  ['gui-button', () => renderElement('gui-button', { attributes: { label: 'Pay' } })],
];
for (const [tag, run] of singles) {
  console.log(`  ${tag}: ${ms(measure(run))}`);
}

// Vue's streaming render. Vue flushes a chunk at each async boundary, so the page holds async
// components between the elements, as a page that fetches data would.
const AsyncBlock = {
  props: ['index'],
  async setup(props: { index: number }) {
    await new Promise((resolve) => setTimeout(resolve, 1));
    return () => h('section', [h('h2', `Block ${props.index}`), h('p', 'Loaded on the server.')]);
  },
};
const App = {
  render: () =>
    h('main', [
      h('h1', 'Checkout'),
      h(AsyncBlock, { index: 1 }),
      h('gui-textinput', { uid: 'email', label: 'Email', value: 'ada@example.com' }),
      h(AsyncBlock, { index: 2 }),
      h('gui-tabs', { active: 'a' }, [
        h('gui-tab-panel', { name: 'a' }, [
          h(AsyncBlock, { index: 3 }),
          h('gui-date-picker', { uid: 'start', label: 'Start date' }),
        ]),
      ]),
      h(AsyncBlock, { index: 4 }),
      h('gui-button', { label: 'Pay' }),
    ]),
};

// The content page as Vue renders it, to compare the pass with the render it follows.
const ContentApp = {
  render: () =>
    h('main', [
      ...Array.from({ length: 700 }, (_, index) =>
        h('section', { id: `s${index}` }, [
          h('h2', `Section ${index}`),
          h('p', [
            'Lorem ipsum dolor sit amet, ',
            h('a', { href: `/docs/${index}` }, 'consectetur'),
            ' adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
          ]),
          h('ul', [h('li', 'One'), h('li', 'Two'), h('li', 'Three')]),
        ]),
      ),
      h('gui-textinput', { uid: 'email', label: 'Email' }),
    ]),
};

async function streamChunks(): Promise<{
  chunks: string[];
  firstChunkMs: number;
  totalMs: number;
}> {
  const start = performance.now();
  const reader = renderToWebStream(createSSRApp(App)).getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let firstChunkMs = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return { chunks, firstChunkMs, totalMs: performance.now() - start };
    if (chunks.length === 0) firstChunkMs = performance.now() - start;
    chunks.push(typeof value === 'string' ? value : decoder.decode(value));
  }
}

async function measureAsync(run: () => Promise<unknown>, iterations = 30): Promise<number> {
  for (let index = 0; index < 5; index++) await run();
  const times: number[] = [];
  for (let index = 0; index < iterations; index++) {
    const start = performance.now();
    await run();
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  return times[Math.floor(times.length / 2)] ?? 0;
}

async function main() {
  const vueContent = await measureAsync(() => renderToString(createSSRApp(ContentApp)));
  const contentHtml = await renderToString(createSSRApp(ContentApp));
  console.log(
    `\nVue renderToString of the content page (${kb(contentHtml)}): ${ms(vueContent)}; ` +
      `renderElementsInHtml on it: ${ms(measure(() => renderElementsInHtml(contentHtml)))}`,
  );

  const { chunks, firstChunkMs, totalMs } = await streamChunks();
  const whole = chunks.join('');
  const splitInside = chunks.slice(0, -1).filter((chunk) => {
    const opens = (chunk.match(/<gui-[a-z-]+/g) ?? []).length;
    const closes = (chunk.match(/<\/gui-[a-z-]+>/g) ?? []).length;
    return opens !== closes;
  });
  const perChunk = chunks.map((chunk) => renderElementsInHtml(chunk)).join('');
  console.log(
    `Vue streaming render: ${chunks.length} chunks, first after ${ms(firstChunkMs)}, last after ${ms(totalMs)}; ` +
      `${splitInside.length} chunks end inside a gui-* element`,
  );
  // The ids an element generates without a uid count up across renders, so they differ by run.
  const withoutGeneratedIds = (html: string) => html.replace(/gui-[a-z-]+-\d+/g, 'gui-generated');
  const wholePass = renderElementsInHtml(whole);
  console.log(
    `  the pass on each chunk gives the same HTML as on the whole page: ` +
      `${withoutGeneratedIds(perChunk) === withoutGeneratedIds(wholePass)}`,
  );
  chunks.forEach((chunk, index) =>
    console.log(`  chunk ${index}: ${chunk.replace(/\s+/g, ' ').slice(0, 110)}`),
  );
}

void main();
