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
 * FORMS COMPOSE is now hosted in-app: the portal owns its 8-bit walk as a React
 * mount (src/quests/forms-compose) instead of iframing rob-demo. FORMS AS DATA
 * still embeds sasha-demo by iframe until it gets the same treatment.
 */

import type { Framework } from '@golemui/demo-engine';

type DemoId = 'forms-as-data' | 'forms-compose';

const DEV = import.meta.env.DEV;

// Where the demo apps live. Dev: their vite servers. Prod: served by the main
// site (cross-origin from this subdomain — postMessage uses '*').
const DEMO_SRC: Record<DemoId, string> = {
  'forms-as-data': DEV ? 'http://localhost:4220/' : 'https://golemui.com/sasha-demo/index.html',
  'forms-compose': DEV ? 'http://localhost:4221/' : 'https://golemui.com/rob-demo/index.html',
};

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

function reflectFw() {
  fwTiles.forEach((t) => {
    const on = t.dataset['fw'] === selectedFw;
    t.classList.toggle('is-selected', on);
    t.setAttribute('aria-checked', String(on));
  });
}
reflectFw();

fwTiles.forEach((tile) => {
  tile.addEventListener('click', () => {
    selectedFw = tile.dataset['fw'] || 'react';
    reflectFw();
  });
});

function paneFor(demo: DemoId): HTMLElement | undefined {
  return panes.find((p) => p.id === `demo-pane-${demo}`);
}

let currentDemo: DemoId | null = null;

// FORMS COMPOSE is React, mounted lazily into its pane (no iframe). The dynamic
// import keeps React out of the landing bundle until a quest actually launches.
function mountFormsComposeQuest() {
  const host = document.getElementById('forms-compose-root');
  if (!host) return;
  void import('./quests/forms-compose/mount').then(({ mountFormsCompose }) => {
    mountFormsCompose(host, {
      framework: selectedFw as Framework,
      // Finishing / skipping the walk hands back to the demos page (the app).
      onComplete: () => goToDemos('forms-compose'),
    });
  });
}

function launchQuest(demo: DemoId) {
  currentDemo = demo;
  panes.forEach((p) => {
    const active = p.id === `demo-pane-${demo}`;
    p.toggleAttribute('hidden', !active);
    p.classList.toggle('is-active', active);
  });
  if (demo === 'forms-compose') {
    mountFormsComposeQuest();
  } else {
    const iframe = paneFor(demo)?.querySelector<HTMLIFrameElement>('iframe.demo-iframe');
    if (iframe) {
      iframe.style.height = '100%';
      iframe.src = `${DEMO_SRC[demo]}?mode=walk&fw=${selectedFw}&n=${Date.now()}`;
      iframe.addEventListener(
        'load',
        () => {
          try {
            iframe.focus();
            iframe.contentWindow?.focus();
          } catch {
            /* cross-origin focus is best-effort */
          }
        },
        { once: true },
      );
    }
  }
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
  else if (data?.type === 'golemui-theme-ready') broadcastTheme((event.source as Window) ?? undefined);
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
if (deepDemo === 'forms-as-data' || deepDemo === 'forms-compose') {
  launchQuest(deepDemo);
}
