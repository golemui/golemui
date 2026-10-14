# @golemui/gui-ink

[Golem UI](https://golemui.com): the declarative form engine, rendered in a terminal with
[Ink](https://github.com/vadimdemedes/ink).

## Install

```bash
npm install @golemui/gui-ink @golemui/core @golemui/react @golemui/gui-shared ink react
```

## Runtime

- Node 22 or later.
- React 19.2 or later.
- Ink 7.
- A real terminal. Without one, the form prints its values and one notice line, and reads no keys.
- The consumer calls Ink's `render`. This package exports components only. It never starts an Ink
  instance by itself.

```tsx
import { GuiForm } from '@golemui/gui-ink';
import { render } from 'ink';

render(<GuiForm config={{ formDef }} formSubmit={(event) => console.log(event.data)} />);
```

## Usage

A complete program: build the config, hand it to Ink's `render`, and stop the instance when the
form submits.

```tsx
import { type FormSubmitEvent } from '@golemui/core';
import { GuiForm } from '@golemui/gui-ink';
import { gui, type GuiFormInitConfig } from '@golemui/gui-shared';
import { render } from 'ink';

const config: GuiFormInitConfig = {
  formDef: [
    gui.layouts.grid([
      gui.inputs.textInput('login.email', { label: 'Email' }),
      gui.inputs.password('login.password', { label: 'Password' }),
      gui.actions.button({ label: 'Sign up', actionType: 'submit' }),
    ]),
  ],
  data: { login: { email: '', password: '' } },
};

const instance = render(
  <GuiForm
    config={config}
    formSubmit={(event: FormSubmitEvent) => {
      console.log(JSON.stringify(event.data, null, 2));
      instance.unmount();
    }}
  />,
);
```

`GuiForm` also accepts `formEvent`, `formHealth`, `formHealthBoundary`, `widgetErrorFallback` and
`theme`.

Widgets load through dynamic imports. `GuiForm` loads its own widgets and the form's
`customWidgetLoaders` before the first frame. The whole tree then mounts in one commit, and the
focus starts on the first field of the definition.

## Keyboard

- Tab moves to the next field. Shift+Tab moves to the previous one. The order is the order in
  which the widgets are drawn.
- Enter in a text field moves to the next field. This replaces clicking away from an input in a
  browser, so it marks the field touched and runs blur validation.
- Space toggles a checkbox. Enter on a checkbox moves to the next field, as in a text field.
- A paste into a text field is inserted in one piece. Line breaks and other control characters are
  removed, as a browser does for a single-line input.
- Space or Enter on a button clicks it. When its `actionType` is `submit`, it also submits the
  form.
- Ctrl+C quits. This is Ink's default.

## Widgets

The set implements these widget types. A form that uses any other type shows a form health error
that names the type. That includes `flex`, which is deprecated since 2.0: use `grid`.

| Family  | Types                   | What the terminal does                                                                            |
| ------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| Text    | `textinput`, `password` | One line with a caret. `password` draws `*` for each character and has no reveal toggle.          |
| Choice  | `checkbox`              | The glyph and the label on one line.                                                              |
| Display | `markdownText`          | Prints the markdown source as plain text. Nothing parses it, so markup characters stay visible.   |
| Layout  | `grid`                  | Gaps are counted in cells. A grid does not stack in a narrow terminal.                            |
| Action  | `button`                | A bracketed label. Focus shows as the focus marker, plus inverse video in a terminal with colors. |

Placeholders are hidden while a field is focused. A validation error replaces the hint of its field
instead of showing below it.

## Theme

Every widget reads its colors and glyphs from the form theme. The `theme` prop replaces single keys
of `defaultTheme`, and every key it leaves out keeps its default. Colors are passed straight to
Ink, so a chalk color name and a hex string both work. A color with no default draws in the
terminal's own foreground color, which stays readable on a dark and on a light background. The
default glyphs are ASCII, so the form draws the same in a terminal without a unicode font.

```tsx
import { GuiForm } from '@golemui/gui-ink';

<GuiForm
  config={{ formDef }}
  theme={{
    colors: { focus: '#00afff' },
    glyphs: { checkboxOn: '[v]' },
  }}
/>;
```

| Key                  | Default | Used for                                      |
| -------------------- | ------- | --------------------------------------------- |
| `colors.label`       | none    | Field labels.                                 |
| `colors.value`       | none    | Field values and button labels.               |
| `colors.placeholder` | `gray`  | Placeholders.                                 |
| `colors.focus`       | `cyan`  | The focus marker.                             |
| `colors.error`       | `red`   | Validation errors.                            |
| `colors.hint`        | `gray`  | Hints.                                        |
| `colors.border`      | `gray`  | The space of the focus marker when unfocused. |
| `colors.disabled`    | `gray`  | Values of disabled fields.                    |
| `glyphs.checkboxOn`  | `[x]`   | A checked checkbox.                           |
| `glyphs.checkboxOff` | `[ ]`   | An unchecked checkbox.                        |
| `glyphs.required`    | `*`     | The mark after the label of a required field. |
| `glyphs.cursor`      | `_`     | The caret of the focused text field.          |
| `glyphs.focusMarker` | `>`     | The mark in front of the focused widget.      |

## Documentation

- Website: https://golemui.com
- Repository: https://github.com/golemui/golemui
- Source: https://github.com/golemui/golemui/tree/main/libs/gui/ink
- Issues: https://github.com/golemui/golemui/issues

## License

MIT
