# quests-portal

The standalone 8-bit **quest** experience for GolemUI — the guided, hands-on
"walks" that teach the demos as a game. It is intentionally separate from the
main marketing site (`/demos`): the site is the sober, evaluate-it-now product;
the portal is the playful teaching/conference artifact.

In dev it runs at `http://localhost:4222` and embeds the demo apps
(`sasha-demo` :4220, `rob-demo` :4221) in `?mode=walk`. In production it is
intended to live at **`quests.golemui.com`**, embedding the demos served from
`golemui.com`.

```bash
npm run start:quests   # portal + the demos + the docs site together
```

The portal and the site talk over two contracts:

- **postMessage** — `golemui-theme` / `golemui-theme-ready` (theme sync),
  `golemui-demo-embed`, `golemui-play-quest`.
- **Query params** — the site sends visitors in with `?demo=<id>&fw=<fw>[&from=app]`;
  the portal hands them back with `…/demos?open=<id>`.

Both are consumed on the site in `docs/src/pages/demos/index.astro` and produced
in `apps/apps-shared/src/demo-engine/`.

---

## Architecture — what lives where, and why (read this before reviewing)

The demos + quests experience is **four pieces**. The boundary between them is
the thing to get right; the intuitive "the 8-bit stuff all lives in the portal"
guess is wrong.

| Piece             | Path                                                         | What it is                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`/demos` page** | `docs/src/pages/demos/index.astro`                           | The marketing showcase — five-pillar accordion; opens a demo inline as an iframe. Part of the main site.                                                          |
| **Demo apps**     | `apps/sasha-demo`, `apps/rob-demo`                           | The two **runnable** demos. Each renders _both_ its plain app-direct view **and** its 8-bit walk. Ship to `golemui.com/{sasha,rob}-demo/`.                        |
| **Demo engine**   | `apps/apps-shared/src/demo-engine/` (`@golemui/demo-engine`) | The shared GameShell state machine + shell chrome. **Imported by the two demo apps only.** Private, never npm-published.                                          |
| **quests-portal** | `apps/quests-portal`                                         | A **thin host** for the walks. Embeds the demo apps **by URL** (`iframe.src = …/sasha-demo?mode=walk`). Imports **nothing** shared. Becomes `quests.golemui.com`. |

Two boundary rules that answer the recurring "should this be in the portal?"
question:

- **The 8-bit walk renders _inside_ the demo apps, not in the portal.** The
  portal is only the frame that embeds them. So `@golemui/demo-engine` is
  **demo-app code** — it belongs in `apps-shared`, shared between the two demos,
  **never in `quests-portal`**. The portal reaches the walks through the demos,
  by URL.
- **The portal imports no shared code** (no `@golemui/*`, no engine, no shared
  SCSS) — which is _why_ it lifts cleanly to its own repo. On the split, the
  demos + the engine **stay in this monorepo** (they ship to `golemui.com`); the
  portal embeds those deployed demos across origins. See checklist A.

**This PR touches no core.** Everything here is under `apps/` + the `/demos`
page; `libs/gui/**` is untouched. (A label-rendering fix for label-less
toggles/checkboxes that the demos surfaced was deliberately pulled out — it's a
core change and belongs in its own `fix(gui):` PR, not this one.)

---

## Go-live checklist A — split into its own repo (`quests.golemui.com`)

The portal is deliberately decoupled: it has **no `@golemui/*`, no `apps-shared`,
and no shared-SCSS imports** — it is mechanically clean to lift. The real work is
the cross-origin contract and the build/deploy wiring that the monorepo currently
provides for free.

1. **Add a build target.** `project.json` defines only `dev` + `lint` today —
   there is no `build`, even though `vite.config.mts` sets `build.outDir`. Add a
   Vite build target before anything can ship.
2. **Stand up its own `package.json`.** The app inherits everything from the
   monorepo root today. The split repo needs its own deps: `vite`, `typescript`,
   `sass`, `eslint` (match the versions pinned at the monorepo root).
3. **Drop the Nx/monorepo couplings:** `nxViteTsPaths()` + `nxCopyAssetsPlugin`
   in `vite.config.mts`, and the `extends ../../tsconfig.base.json` in both
   `tsconfig.json` and `tsconfig.app.json`. The portal imports **zero** path
   aliases, so inline the few compilerOptions it needs and delete the extends.
4. **Make the URLs env-driven.** `src/main.ts` hardcodes the demo origins
   (`https://golemui.com/sasha-demo/…`, `/rob-demo/…`), `MAIN_SITE`, and the dev
   ports (4220/4221/4321). Replace with `VITE_DEMO_ORIGIN` / `VITE_MAIN_SITE` so
   the split repo can point at staging vs. prod. **Decide the dev story:** the
   split repo can't `vite` up the demos itself — either point dev at the deployed
   demos, or document that local quest dev needs the monorepo running alongside.
5. **Lock the cross-origin postMessage contract.** Once `quests.golemui.com`
   embeds `golemui.com`, the messages cross origins:
   - Receiver (`main.ts` `message` handler): add an
     `if (event.origin !== DEMO_ORIGIN) return;` guard.
   - Senders: replace `targetOrigin: '*'` with the explicit demo origin.
   - The **producer half lives in the monorepo** (`apps-shared/.../iframe-theme-sync.ts`,
     `engine.tsx`) and also uses `'*'`. After the split this message vocabulary is
     a **published cross-repo interface** — version it somewhere both repos see; a
     rename on the monorepo side silently breaks the portal.
6. **DNS + deploy.** `quests.golemui.com` is already baked into both sides
   (`docs/src/pages/demos/index.astro` redirects to it). Add the subdomain record,
   a deploy target for the portal's `dist/`, and CI in the new repo (none exists).
7. **Add `public/favicon.ico`.** `index.html` references `/favicon.ico` but the
   app ships no `public/` dir (every sibling app has one).
8. **Drop the Starlight coupling.** `index.html`'s inline theme bootstrap reads
   the `starlight-theme` localStorage key — meaningless once the docs site isn't
   in the same origin. Simplify to `prefers-color-scheme` + the portal's own key.

---

## Go-live checklist B — the per-framework demo code ("View the code" → StackBlitz)

**Status: deferred and removed from the launch PR.** The earlier attempt put
per-framework starters under `templates/forms-as-data*` and wired each demo's
"⌁ VIEW THE … CODE" button at them — but the structure was half-built: only
forms-as-data had purpose-built starters, while the compose demo (`rob-demo`)
re-used the older `templates/{react,vue,angular,lit,js}` kitchen-sink starters
(which also back `appetizer`). That conflation has been cleared: the
`forms-as-data*` dirs and both "View the code" buttons are gone for now.

When we do this for real, do it cleanly:

- **New top-level `demos/` folder**, one runnable starter **per demo × per
  framework**: `demos/<demo>/<framework>/` — e.g.
  `demos/forms-as-data/{react,angular,lit,vue,js}/` and
  `demos/forms-compose/{react,angular,lit,vue,js}/`. Each is the _actual_ code
  behind that demo, not a generic kitchen-sink.
- **Re-wire the buttons** in `apps/sasha-demo` and `apps/rob-demo`: build the
  StackBlitz URL from `demos/<demo>/<framework>` (the removed buttons used
  `…/tree/main/templates/${TEMPLATE_BY_FW[fw]}`).
- **Keep `templates/{react,vue,angular,lit,js}` as-is** — those stay owned by
  `appetizer`; don't fold the demos into them.
- Each starter needs the standard runnable scaffold (`package.json`,
  `vite.config`, `tsconfig`, `index.html`, `src/`) so it boots in StackBlitz
  unedited.
