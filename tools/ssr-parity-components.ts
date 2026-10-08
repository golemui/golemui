import { execSync, spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, type DefaultTreeAdapterMap } from 'parse5';

/**
 * Cross-framework server rendering check for the GolemUI Components.
 *
 * Every components-ssr-* app renders the same page: an alert, two text inputs, a select, a date
 * picker, tabs holding a checkbox and a text input, and a button. This script renders each app on
 * the server and verifies that the page arrives complete: the elements that render their own
 * content carry it in the HTML, marked as server markup, with no Lit hydration markers, no
 * declarative shadow roots and no duplicate ids. The Vite apps (React, Vue, Angular) render
 * through their built server entry in this process; the meta-frameworks (Next.js, Nuxt, Analog)
 * run their production server, and the script fetches the page.
 *
 * Run with `npm run test:ssr-parity-components`. Pass `--skip-build` to reuse the existing
 * `dist` and `.next` output instead of rebuilding the apps.
 */

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

type Element = DefaultTreeAdapterMap['element'];
type Node = DefaultTreeAdapterMap['node'];

interface FrameworkCheck {
  name: string;
  /** How to get the page: the built server entry, or the production server to fetch it from. */
  source:
    | { kind: 'entry'; path: string; templatePath?: string }
    | { kind: 'server'; command: (port: number) => { cmd: string; args: string[]; cwd: string } };
  /**
   * Whether the select's options are in the HTML. Vue binds them as a property (`.prop`), which
   * its server render leaves out, so the select gets them when it upgrades.
   */
  selectOptions: boolean;
  /** Whether every element carries the defer-hydration hold (the React components add it). */
  holdsWithDeferHydration: boolean;
}

const nodeServer = (app: string, entry: string) => (port: number) => ({
  cmd: process.execPath,
  args: [join(repoRoot, 'dist/apps', app, entry)],
  cwd: repoRoot,
  env: { PORT: String(port) },
});

// Order matters: the Angular entry installs a global document stub while rendering, and lit
// modules loaded while a document global exists take their browser code path. Rendering Angular
// last among the in-process entries keeps the others on the plain Node path. The servers run in
// processes of their own.
const checks: FrameworkCheck[] = [
  {
    name: 'react',
    source: {
      kind: 'entry',
      path: join(repoRoot, 'dist/apps/components-ssr-react/server/entry-server.js'),
    },
    selectOptions: true,
    holdsWithDeferHydration: true,
  },
  {
    name: 'vue',
    source: {
      kind: 'entry',
      path: join(repoRoot, 'dist/apps/components-ssr-vue/server/entry-server.js'),
    },
    selectOptions: false,
    holdsWithDeferHydration: false,
  },
  {
    name: 'angular',
    source: {
      kind: 'entry',
      path: join(repoRoot, 'dist/apps/components-ssr-angular/server/entry-server.js'),
      templatePath: join(repoRoot, 'apps/components-ssr-angular/index.html'),
    },
    selectOptions: true,
    holdsWithDeferHydration: false,
  },
  {
    name: 'nextjs',
    source: {
      kind: 'server',
      command: (port) => ({
        cmd: process.execPath,
        args: [join(repoRoot, 'node_modules/next/dist/bin/next'), 'start', '-p', String(port)],
        cwd: join(repoRoot, 'apps/components-ssr-nextjs'),
      }),
    },
    selectOptions: true,
    holdsWithDeferHydration: true,
  },
  {
    name: 'nuxt',
    source: {
      kind: 'server',
      command: nodeServer('components-ssr-nuxt', 'server/index.mjs'),
    },
    selectOptions: false,
    holdsWithDeferHydration: false,
  },
  {
    name: 'analog',
    source: {
      kind: 'server',
      command: nodeServer('components-ssr-analog', 'analog/server/index.mjs'),
    },
    selectOptions: true,
    holdsWithDeferHydration: false,
  },
];

// The elements whose content the server renders, with what that content must hold.
const renderedElements: Array<{
  tag: string;
  count: number;
  contains: (check: FrameworkCheck) => RegExp[];
}> = [
  {
    tag: 'gui-textinput',
    count: 2,
    contains: () => [
      /<label[^>]*for="email"/,
      /<input[^>]*id="email"[^>]*value="ada@example\.com"/,
      /<input[^>]*id="company"[^>]*value="Analytical Engines"/,
    ],
  },
  {
    tag: 'gui-select',
    count: 1,
    contains: (check) => [
      /<select[^>]*id="plan"/,
      ...(check.selectOptions ? [/<option[^>]*value="team"[^>]*selected/] : []),
    ],
  },
  {
    tag: 'gui-date-picker',
    count: 1,
    contains: () => [/<gui-date[^>]*id="start_date"/, /<button[^>]*aria-controls="start_popup"/],
  },
  {
    tag: 'gui-checkbox',
    count: 1,
    contains: () => [/<input[^>]*type="checkbox"[^>]*checked/],
  },
  { tag: 'gui-button', count: 1, contains: () => [/<button[^>]*type="submit"/, /Pay 49 EUR/] },
];

// The elements that wrap the app's children: the server renders the children, not the element.
const wrapperElements = ['gui-alert', 'gui-tabs', 'gui-tab-list', 'gui-tab', 'gui-tab-panel'];

function elementsOf(node: Node, found: Element[] = []): Element[] {
  if ('tagName' in node) {
    found.push(node);
  }
  for (const child of 'childNodes' in node ? node.childNodes : []) {
    elementsOf(child, found);
  }
  return found;
}

const hasAttribute = (element: Element, name: string) =>
  element.attrs.some((attribute) => attribute.name === name);

function verifyMarkup(check: FrameworkCheck, markup: string): string[] {
  const failures: string[] = [];
  const elements = elementsOf(parse(markup));
  const byTag = (tag: string) => elements.filter((element) => element.tagName === tag);

  for (const { tag, count, contains } of renderedElements) {
    const tags = byTag(tag);
    if (tags.length !== count) {
      failures.push(`expected ${count} <${tag}> elements, found ${tags.length}`);
    }
    for (const element of tags) {
      if (!hasAttribute(element, 'data-golemui-ssr')) {
        failures.push(`a <${tag}> element is not marked as server markup (data-golemui-ssr)`);
      }
      if (element.childNodes.length === 0) {
        failures.push(`a <${tag}> element is empty`);
      }
    }
    for (const pattern of contains(check)) {
      if (!pattern.test(markup)) {
        failures.push(`<${tag}>: the markup does not match ${pattern}`);
      }
    }
  }

  for (const tag of wrapperElements) {
    const tags = byTag(tag);
    if (tags.length === 0) {
      failures.push(`the <${tag}> element is missing`);
    }
    if (tags.some((element) => hasAttribute(element, 'data-golemui-ssr'))) {
      failures.push(`a <${tag}> element is marked as server markup, but it wraps app children`);
    }
  }
  if (!/<gui-alert[^>]*>[^<]*Yearly billing saves two months\./.test(markup)) {
    failures.push('the alert lost its text');
  }

  if (check.holdsWithDeferHydration) {
    for (const element of elements.filter((element) => element.tagName.startsWith('gui-'))) {
      if (!hasAttribute(element, 'defer-hydration')) {
        failures.push(`a <${element.tagName}> element is missing the defer-hydration hold`);
      }
    }
  }

  if (/<!--\/?lit-part|<!--lit-node |<\?>/.test(markup)) {
    failures.push('the markup holds Lit hydration markers');
  }
  if (/shadowrootmode=/.test(markup)) {
    failures.push('the markup holds a declarative shadow root');
  }
  const falseBoolean = markup.match(/\s(checked|selected|disabled|required|hidden)="false"/);
  if (falseBoolean) {
    failures.push(`the markup holds a false boolean attribute: ${falseBoolean[0].trim()}`);
  }
  const ids = elements.flatMap((element) =>
    element.attrs.filter((attribute) => attribute.name === 'id').map(({ value }) => value),
  );
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicates.length > 0) {
    failures.push(`duplicate ids: ${duplicates.join(', ')}`);
  }

  return failures;
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, () => {
      const address = server.address();
      server.close(() => resolve(typeof address === 'object' && address ? address.port : 0));
    });
  });
}

/** Starts the production server, fetches the page and stops the server. */
async function fetchFromServer(
  command: (port: number) => { cmd: string; args: string[]; cwd: string; env?: object },
): Promise<string> {
  const port = await freePort();
  const { cmd, args, cwd, env } = command(port);
  const server = spawn(cmd, args, {
    cwd,
    env: { ...process.env, ...env, NODE_ENV: 'production' },
    // Its own process group, so stopping it also stops any process it started.
    detached: true,
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  let stderr = '';
  server.stderr?.on('data', (chunk) => (stderr += chunk));
  try {
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      if (server.exitCode !== null) {
        throw new Error(`the server exited with code ${server.exitCode}\n${stderr}`);
      }
      try {
        const response = await fetch(`http://127.0.0.1:${port}/`);
        if (response.ok) {
          return await response.text();
        }
      } catch {
        // Not listening yet.
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error(`the server did not answer on port ${port} within 60s\n${stderr}`);
  } finally {
    if (server.pid !== undefined && server.exitCode === null) {
      process.kill(-server.pid, 'SIGTERM');
    }
  }
}

async function render(check: FrameworkCheck): Promise<string> {
  if (check.source.kind === 'server') {
    return fetchFromServer(check.source.command);
  }
  const { render } = (await import(check.source.path)) as {
    render: (template?: string) => Promise<string>;
  };
  return check.source.templatePath
    ? render(await readFile(check.source.templatePath, 'utf-8'))
    : render();
}

async function main(): Promise<void> {
  if (!process.argv.includes('--skip-build')) {
    const run = (target: string, projects: string[]) =>
      execSync(
        `npx nx run-many --target=${target} --projects=${projects.map((name) => `components-ssr-${name}`).join(',')}`,
        { cwd: repoRoot, stdio: 'inherit' },
      );
    run('build-server', ['react', 'vue', 'angular']);
    run('build', ['nextjs', 'nuxt', 'analog']);
  }

  let failed = false;
  for (const check of checks) {
    let failures: string[];
    let size = 0;
    try {
      const markup = await render(check);
      size = markup.length;
      failures = verifyMarkup(check, markup);
    } catch (error) {
      failures = [`the render failed: ${error instanceof Error ? error.message : String(error)}`];
    }
    if (failures.length === 0) {
      console.log(`[ssr-parity-components] ${check.name}: ok (${size} bytes)`);
    } else {
      failed = true;
      console.error(`[ssr-parity-components] ${check.name}: FAILED`);
      for (const failure of failures) {
        console.error(`  - ${failure}`);
      }
    }
  }

  if (failed) {
    process.exit(1);
  }
  console.log('[ssr-parity-components] every framework sends the complete page');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
