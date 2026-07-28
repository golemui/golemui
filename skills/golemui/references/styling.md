# GolemUI — styling

Baseline: import `@golemui/gui-components/index.css` once (mandatory). On top of that there are
three layers — fetch the page before writing CSS, the variable names are not guessable:

- **Theming** — the default theme plus the bundled "Clay" theme; themes can be scoped to a
  form. https://golemui.com/dx/styling/theming.md
- **Customization** — per-widget CSS variables (`--gui-*` tokens; each widget's reference page
  lists its own under "CSS Variables" — see [widgets-index.md](widgets-index.md)) and CSS
  hooks. https://golemui.com/dx/styling/customization.md
- **Going headless** — drop the shipped components entirely and render the resolved form with
  your own component set. https://golemui.com/dx/styling/going-headless.md

Overview: https://golemui.com/dx/styling/overview.md
