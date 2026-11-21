# GolemUI — styling

Themes, CSS variables and headless rendering. The two stylesheets every form imports are in
[hosts/config.md](hosts/config.md).

## Three layers

- **Theming**: the default theme and the bundled "Clay" theme; a theme can be scoped to one
  form. https://golemui.com/json/styling/theming.md
- **Customization**: CSS variables (`--gui-*` tokens) per widget, and CSS hooks. Each widget's
  page lists its own under "CSS Variables" ([widgets-index.md](widgets-index.md)).
  https://golemui.com/json/styling/customization.md
- **Going headless**: render the resolved form with your own components instead of the
  shipped ones. https://golemui.com/json/styling/going-headless.md

Overview: https://golemui.com/json/styling/overview.md

## Rules

### rule: fetch-before-css

When: writing CSS for a GolemUI form.

Do: fetch the page of the layer, or the widget's page, and take the variable names from it.

Wrong:

- Doing: guessing a token such as `--gui-primary-color`.

  Because: a CSS variable that does not exist is ignored with no error, and the style does not change.

Applies: styling, theming
