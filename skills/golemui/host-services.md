# GolemUI — host services

Services the library does not ship, which the application passes in `dependencies` on the form
component's config: the markdown parser of `markdownText` and `markdown`, and the upload
service of `fileUpload` and `multiFileUpload`. Where `dependencies` goes is in
[hosts/config.md](hosts/config.md).

Setup:

```ts
import type { GuiFormInitConfig, SanitizedHtml } from '@golemui/gui-shared';
declare const definition: Record<string, unknown>;
```

## The markdown parser

`dependencies.markdown` is `{ parse(markdown: string): SanitizedHtml }`. Any parser works if it
returns its HTML synchronously. `SanitizedHtml` is a string type that only a cast creates.

```ts
import snarkdown from 'snarkdown';

const config: GuiFormInitConfig = {
  formDef: definition,
  dependencies: {
    markdown: { parse: (md: string) => snarkdown(md) as SanitizedHtml },
  },
};
```

The widgets insert the result as HTML without sanitizing it. Snarkdown and Marked keep raw
HTML and `javascript:` links; Micromark and markdown-it escape both with their default
options. With server rendering, `parse` also runs in Node ([hosts/ssr.md](hosts/ssr.md)).

## The upload service

`dependencies.uploadService` is
`{ upload(file, { id, path, onProgress?, signal }): Promise<TData>, remove?(item): Promise<void> }`.
`upload` sends one file and resolves with what the server returns; `remove` deletes an
uploaded file when the user removes it.

## How they are passed

Services are passed by reference and never stored in the form data. With the MCP,
`get_concept({ "concept": "host-services" })` returns the full guide. Docs:
https://golemui.com/json/features/dependencies.md

## Rules

### decision: sanitize-untrusted-markdown

When: writing the `parse` of the markdown parser for a form with a `markdownText` or `markdown` widget.

Decide: whether `parse` sanitizes before the cast to `SanitizedHtml`, by where the markdown comes from.

- **Users or stored data** — make `parse` remove raw HTML and `javascript:` links, or sanitize its output, before the cast.
- **The developers, in a definition that ships with the app** — the cast alone, `parse: (md) => snarkdown(md) as SanitizedHtml`.

Wrong:

- Doing: `parse: (md) => snarkdown(md) as SanitizedHtml` for markdown that users write.

  Because: the widgets insert the result as HTML, and Snarkdown keeps raw HTML and `javascript:` links.

Applies: markdownText, markdown, dependencies, security

Source: libs/gui/components/src/lib/types.ts#MarkdownParser, libs/gui/components/src/lib/types.ts#SanitizedHtml

### rule: stable-dependencies-identity

When: creating the `dependencies` object of a form.

Do: create it once and keep its identity, at module scope or memoized.

Wrong:

- Doing: building `dependencies: { markdown: { parse } }`, and the config around it, inside a React render.

  Because: a new `config` identity creates a new form instance, which starts again from `config.data`.

Applies: dependencies, react

Source: libs/gui/shared/src/lib/shared.ts#Dependencies
