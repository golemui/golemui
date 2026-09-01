import { execSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Cross-framework server rendering parity check.
 *
 * Every SSR harness app renders the same six-widget form definition. This script
 * renders each harness through its built server entry in plain Node and verifies
 * that the markup is complete: the full widget set is present in every framework,
 * plus the values and the defer-hydration hold where the framework serializes them.
 * It compares completeness, not byte equality: the frameworks differ in how deep
 * they serialize on purpose.
 *
 * Run with `npm run test:ssr-parity`. Pass `--skip-build` to reuse the existing
 * `dist` output instead of rebuilding the harness server bundles.
 */

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

const harnessProjects = [
  'vue-ssr-harness',
  'react-ssr-harness',
  'lit-ssr-harness',
  'angular-ssr-harness',
];

// The tags of the six widgets in the shared harness form definition. Every framework
// must render all of them, whatever else its markup contains.
const expectedWidgetTags: Array<[tag: string, count: number]> = [
  ['gui-textinput', 2],
  ['gui-number', 1],
  ['gui-select', 1],
  ['gui-checkbox', 1],
  ['gui-button', 1],
];

interface FrameworkCheck {
  name: string;
  serverEntry: string;
  /** Set for Angular only: its render takes the page template and returns the whole document. */
  templatePath?: string;
  /**
   * Strings the framework serializes into the server markup. Vue reflects primitive
   * props as attributes on the gui-* tags. Lit renders the widget interiors, so the
   * values sit on the native inputs (except the number widget, which assigns its
   * input value in updated(), a hook that never runs on the server). React and
   * Angular stop at the custom element boundary and serialize no values.
   */
  expectedValues: string[];
  /** Whether every expected widget tag must carry the defer-hydration hold attribute. */
  holdsWithDeferHydration: boolean;
}

// Order matters: the Angular entry installs a global document stub while rendering,
// and lit modules loaded while a document global exists take their browser code path.
// Rendering Angular last keeps every other framework on the plain Node path.
const checks: FrameworkCheck[] = [
  {
    name: 'vue',
    serverEntry: join(repoRoot, 'dist/apps/vue-ssr-harness/server/entry-server.js'),
    expectedValues: [
      'value="Ada"',
      'value="Lovelace"',
      'value="3"',
      'value="pro"',
      'label="First name"',
      'label="Create account"',
    ],
    holdsWithDeferHydration: false,
  },
  {
    name: 'react',
    serverEntry: join(repoRoot, 'dist/apps/react-ssr-harness/server/entry-server.js'),
    expectedValues: [],
    holdsWithDeferHydration: true,
  },
  {
    name: 'lit',
    serverEntry: join(repoRoot, 'dist/apps/lit-ssr-harness/server/entry-server.js'),
    expectedValues: ['value="Ada"', 'value="Lovelace"', 'First name', 'Create account'],
    holdsWithDeferHydration: true,
  },
  {
    name: 'angular',
    serverEntry: join(repoRoot, 'dist/apps/angular-ssr-harness/server/entry-server.js'),
    templatePath: join(repoRoot, 'apps/angular-ssr-harness/index.html'),
    expectedValues: [],
    holdsWithDeferHydration: true,
  },
];

/** Matches an opening tag by exact name, so `gui-select` never counts `gui-select-input`. */
function openingTags(markup: string, tag: string): string[] {
  return [...markup.matchAll(new RegExp(`<${tag}(?=[\\s>])[^>]*`, 'g'))].map((match) => match[0]);
}

function verifyMarkup(check: FrameworkCheck, markup: string): string[] {
  const failures: string[] = [];

  if (!/<form[^>]*id="harness-form"/i.test(markup)) {
    failures.push('the form tag with id "harness-form" is missing');
  }

  for (const [tag, expectedCount] of expectedWidgetTags) {
    const tags = openingTags(markup, tag);
    if (tags.length !== expectedCount) {
      failures.push(`expected ${expectedCount} <${tag}> tags, found ${tags.length}`);
      continue;
    }
    if (check.holdsWithDeferHydration) {
      for (const openingTag of tags) {
        if (!openingTag.includes('defer-hydration')) {
          failures.push(`a <${tag}> tag is missing the defer-hydration hold: ${openingTag}`);
        }
      }
    }
  }

  for (const expectedValue of check.expectedValues) {
    if (!markup.includes(expectedValue)) {
      failures.push(`the markup does not contain ${JSON.stringify(expectedValue)}`);
    }
  }

  return failures;
}

async function main(): Promise<void> {
  if (!process.argv.includes('--skip-build')) {
    execSync(`npx nx run-many --target=build-server --projects=${harnessProjects.join(',')}`, {
      cwd: repoRoot,
      stdio: 'inherit',
    });
  }

  let failed = false;
  for (const check of checks) {
    const { render } = (await import(check.serverEntry)) as {
      render: (template?: string) => Promise<string>;
    };
    const markup = check.templatePath
      ? await render(await readFile(check.templatePath, 'utf-8'))
      : await render();

    const failures = verifyMarkup(check, markup);
    if (failures.length === 0) {
      console.log(`[ssr-parity] ${check.name}: ok (${markup.length} bytes)`);
    } else {
      failed = true;
      console.error(`[ssr-parity] ${check.name}: FAILED`);
      for (const failure of failures) {
        console.error(`  - ${failure}`);
      }
    }
  }

  if (failed) {
    process.exit(1);
  }
  console.log('[ssr-parity] every SSR-enabled framework renders the complete widget set');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
