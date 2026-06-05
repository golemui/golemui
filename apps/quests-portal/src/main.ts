/**
 * Quests portal — the 8-bit "choose your adventure" launcher.
 * =========================================================
 * Standalone app (its own URL → quests.golemui.com). It embeds the same
 * sasha-demo / rob-demo apps in WALK mode and hosts the guided quests. The
 * main site's /demos shows the apps directly and links here per-demo via
 * `?demo=<id>&fw=<fw>`. A finished quest offers a way back to the demos.
 *
 * POC: extractable to its own repo later (Roger/Raúl split it).
 *
 * Both quests are now hosted in-app: the portal owns each 8-bit walk as a React
 * mount (src/quests/forms-compose and src/quests/forms-as-data) instead of
 * iframing rob-demo / sasha-demo. The bare apps still live on the main /demos
 * page; finishing or skipping a walk hands back there.
 */

// Pure character data (no React) — safe for this lightweight landing bundle.
import { CHARACTERS, type Framework } from '@golemui/characters';

type DemoId = 'forms-from-prompt' | 'forms-as-data' | 'forms-compose';

const DEV = import.meta.env.DEV;

// The main site (for the logo + "back to demos").
const MAIN_SITE = DEV ? 'http://localhost:4321' : 'https://golemui.com';
const MAIN_SITE_DEMOS = `${MAIN_SITE}/demos/`;

const FW_IDS = ['react', 'angular', 'lit', 'vue', 'vanilla'];

const fwTiles = Array.from(document.querySelectorAll<HTMLButtonElement>('.fw-tile'));
const cards = Array.from(
  document.querySelectorAll<HTMLButtonElement>('.adventure-card:not([disabled])'),
);
const panes = Array.from(document.querySelectorAll<HTMLElement>('.demo-pane'));
const viewport = document.querySelector<HTMLElement>('.demos-viewport')!;

// Wire the cross-site links (logo → home, "Demos" → main site /demos).
document
  .querySelectorAll<HTMLAnchorElement>('[data-home]')
  .forEach((a) => (a.href = `${MAIN_SITE}/`));
document
  .querySelectorAll<HTMLAnchorElement>('[data-demos-link]')
  .forEach((a) => (a.href = MAIN_SITE_DEMOS));

const params = new URLSearchParams(location.search);
let selectedFw = FW_IDS.includes(params.get('fw') || '') ? params.get('fw')! : 'react';
let fullscreen = false;
// Where the quest was launched from. `from=app` means the visitor was already
// using that demo's app on /demos — close should drop them back into it, not
// the selector. Card / direct launches default to the selector.
const fromApp = params.get('from') === 'app';

// Readout (below the tiles) describing the chosen framework's class + blurb.
const fwKlass = document.querySelector<HTMLElement>('[data-fw-klass]');
const fwBlurb = document.querySelector<HTMLElement>('[data-fw-blurb]');
const fwReadout = document.querySelector<HTMLElement>('.fw-readout');
const CHAR_BY_FW = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));

function reflectFw() {
  fwTiles.forEach((t) => {
    const on = t.dataset['fw'] === selectedFw;
    t.classList.toggle('is-selected', on);
    t.setAttribute('aria-checked', String(on));
  });
  const c = CHAR_BY_FW[selectedFw];
  if (c) {
    if (fwKlass) fwKlass.textContent = c.klass;
    if (fwBlurb) fwBlurb.textContent = c.blurb;
    fwReadout?.style.setProperty('--fw-color', c.color);
  }
}
reflectFw();

fwTiles.forEach((tile) => {
  tile.addEventListener('click', () => {
    selectedFw = tile.dataset['fw'] || 'react';
    reflectFw();
  });
});

let currentDemo: DemoId | null = null;

// Both quests are React, mounted lazily into their pane (no iframe). The dynamic
// imports keep React out of the landing bundle until a quest actually launches;
// each walk hands back to the /demos page (the bare app) on finish / skip.
function mountQuest(demo: DemoId) {
  const onComplete = () => goToDemos(demo);
  const fw = selectedFw as Framework;
  if (demo === 'forms-compose') {
    const host = document.getElementById('forms-compose-root');
    if (!host) return;
    void import('./quests/forms-compose/mount').then(({ mountFormsCompose }) => {
      mountFormsCompose(host, { framework: fw, onComplete });
    });
  } else if (demo === 'forms-as-data') {
    const host = document.getElementById('forms-as-data-root');
    if (!host) return;
    void import('./quests/forms-as-data/mount').then(({ mountFormsAsData }) => {
      mountFormsAsData(host, { framework: fw, onComplete });
    });
  } else {
    const host = document.getElementById('forms-from-prompt-root');
    if (!host) return;
    void import('./quests/forms-from-prompt/mount').then(({ mountFormsFromPrompt }) => {
      mountFormsFromPrompt(host, { framework: fw, onComplete });
    });
  }
}

function launchQuest(demo: DemoId) {
  currentDemo = demo;
  panes.forEach((p) => {
    const active = p.id === `demo-pane-${demo}`;
    p.toggleAttribute('hidden', !active);
    p.classList.toggle('is-active', active);
  });
  mountQuest(demo);
  fullscreen = true;
  viewport.classList.remove('is-closing', 'is-embedded');
  viewport.classList.add('is-fullscreen');
  document.body.classList.add('demos-fullscreen');
}

// Hand back to the main demos page (same tab). After a finished or skipped quest
// we open that demo's app directly (?open=); a plain exit (X / Esc) just returns.
function goToDemos(open?: DemoId | null) {
  window.location.href = open ? `${MAIN_SITE_DEMOS}?open=${open}` : MAIN_SITE_DEMOS;
}

cards.forEach((card) => {
  card.addEventListener('click', () => {
    const demo = card.dataset['quest'] as DemoId | undefined;
    if (demo) launchQuest(demo);
  });
});

// Close (Esc): return to where the quest was launched from — back into the
// app if it came from there, otherwise the demos selector. (No floating X — the
// in-quest SKIP / final CTA also leave the walk.)
const closeQuest = () => goToDemos(fromApp ? currentDemo : null);
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && fullscreen) closeQuest();
});

/* ── Theme broadcast to the quest iframe ── */
const currentTheme = (): 'dark' | 'light' =>
  document.documentElement.classList.contains('dark') ? 'dark' : 'light';
const broadcastTheme = (target?: Window) => {
  const msg = { type: 'golemui-theme', theme: currentTheme() };
  if (target) {
    target.postMessage(msg, '*');
    return;
  }
  document
    .querySelectorAll<HTMLIFrameElement>('iframe.demo-iframe')
    .forEach((iframe) => iframe.contentWindow?.postMessage(msg, '*'));
};
document.querySelectorAll<HTMLIFrameElement>('iframe.demo-iframe').forEach((iframe) => {
  iframe.addEventListener('load', () => broadcastTheme(iframe.contentWindow ?? undefined));
});

window.addEventListener('message', (event) => {
  const data = event.data as { type?: string } | null;
  if (data?.type === 'golemui-demo-embed') goToDemos(currentDemo);
  else if (data?.type === 'golemui-demo-exit') goToDemos();
  else if (data?.type === 'golemui-theme-ready')
    broadcastTheme((event.source as Window) ?? undefined);
});

const themeObserver = new MutationObserver(() => broadcastTheme());
themeObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['class', 'data-theme'],
});

/* ── 8-bit typewriter for the guide prompt ── */
(() => {
  const el = document.querySelector<HTMLElement>('[data-qp-type]');
  if (!el) return;
  const text = el.textContent ?? '';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  el.textContent = '';
  const cps = 38;
  let start = 0;
  const step = (ts: number) => {
    if (!start) start = ts;
    const n = Math.floor(((ts - start) / 1000) * cps);
    if (n >= text.length) {
      el.textContent = text;
      return;
    }
    el.textContent = text.slice(0, n);
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
})();

/* ── Deep link: ?demo=<id>&fw=<fw> launches that quest directly ── */
const deepDemo = params.get('demo');
if (
  deepDemo === 'forms-from-prompt' ||
  deepDemo === 'forms-as-data' ||
  deepDemo === 'forms-compose'
) {
  launchQuest(deepDemo);
}
