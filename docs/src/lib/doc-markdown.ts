import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * Renders a docs entry as single-DSL Markdown for LLM consumption.
 *
 * The site documents two equivalent encodings of the same form definition —
 * the programmatic (`dx`) and `json` DSLs — using `DslTabs` (slots) and
 * `DslCode` (props that reference `?raw` file imports). Showing both at once
 * invites models to blend the two syntaxes, so each generated `.md` keeps only
 * the requested DSL. The orthogonal framework axis (React/Vue/…) is flattened
 * into labeled sections rather than collapsed, since those are genuinely
 * distinct, not interchangeable.
 *
 * `DslTabs` and `IntegrationTabs` both use `<Fragment slot="…">` and can be
 * nested inside one another, so extraction is done with balanced tag matching
 * and recursion rather than flat regexes (which truncate at the first nested
 * `</Fragment>` and silently drop variants).
 */

export type Dsl = 'dx' | 'json';
export const DSLS: readonly Dsl[] = ['dx', 'json'];

export interface DocEntry {
  id: string;
  body?: string;
  filePath?: string;
  data: { title: string; description?: string };
}

const FRAMEWORK_LABELS: Record<string, string> = {
  react: 'React',
  angular: 'Angular',
  lit: 'Lit',
  vue: 'Vue',
  vanilla: 'Vanilla JS',
};

/** Map `import name from '…?raw'` bindings to absolute file paths. */
function rawImports(body: string, baseDir: string): Map<string, string> {
  const map = new Map<string, string>();
  const re = /^\s*import\s+(\w+)\s+from\s+['"]([^'"]+?)\?raw['"];?\s*$/gm;
  for (const m of body.matchAll(re)) map.set(m[1], resolve(baseDir, m[2]));
  return map;
}

/** Map `export const name = '…'` string literals (used for code titles). */
function stringConsts(body: string): Map<string, string> {
  const map = new Map<string, string>();
  const re = /^\s*export\s+const\s+(\w+)\s*=\s*['"]([^'"]*)['"];?\s*$/gm;
  for (const m of body.matchAll(re)) map.set(m[1], m[2]);
  return map;
}

function langForFile(path: string): string {
  if (path.endsWith('.json')) return 'json';
  if (path.endsWith('.ts')) return 'ts';
  if (path.endsWith('.html')) return 'html';
  return '';
}

function fence(code: string, lang: string, title?: string): string {
  const meta = title ? ` title="${title}"` : '';
  return `\`\`\`${lang}${meta}\n${code.replace(/\s+$/, '')}\n\`\`\``;
}

/**
 * Removes the common leading indentation from a block. Fragment children are
 * indented under the component tag in the source MDX; left in place, that
 * indentation turns code fences into indented code blocks and breaks parsing.
 */
function dedent(text: string): string {
  const lines = text.replace(/\t/g, '  ').split('\n');
  const indents = lines
    .filter((line) => line.trim() !== '')
    .map((line) => line.match(/^ */)?.[0].length ?? 0);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(min)).join('\n');
}

/** Leading whitespace of the line containing `pos` (e.g. a list item's indent). */
function lineIndent(src: string, pos: number): string {
  const lineStart = src.lastIndexOf('\n', pos - 1) + 1;
  return src.slice(lineStart, pos).match(/^[ \t]*/)?.[0] ?? '';
}

/** Prefix every non-empty line with `indent`, so a replacement keeps its place. */
function indentBlock(text: string, indent: string): string {
  if (!indent) return text;
  return text
    .split('\n')
    .map((line) => (line === '' ? line : indent + line))
    .join('\n');
}

/** Read an attribute value, supporting both `name={ident}` and `name="literal"`. */
function attr(attrs: string, name: string): string | undefined {
  return (
    attrs.match(new RegExp(`${name}=\\{(\\w+)\\}`))?.[1] ??
    attrs.match(new RegExp(`${name}=["']([^"']+)["']`))?.[1]
  );
}

interface Block {
  outerStart: number;
  innerStart: number;
  innerEnd: number;
  outerEnd: number;
}

/** Locate the first `<tag …>` at/after `from` and its balanced `</tag>`. */
function findBlock(src: string, tag: string, from: number): Block | null {
  const openRe = new RegExp(`<${tag}(?:\\s[^>]*)?>`, 'g');
  openRe.lastIndex = from;
  const open = openRe.exec(src);
  if (!open) return null;
  const innerStart = open.index + open[0].length;
  const tokenRe = new RegExp(`<${tag}(?:\\s[^>]*)?>|</${tag}>`, 'g');
  tokenRe.lastIndex = innerStart;
  let depth = 1;
  let token: RegExpExecArray | null;
  while ((token = tokenRe.exec(src)) !== null) {
    if (token[0][1] === '/') {
      if (--depth === 0) {
        return { outerStart: open.index, innerStart, innerEnd: token.index, outerEnd: tokenRe.lastIndex };
      }
    } else {
      depth++;
    }
  }
  return null;
}

/** List the top-level `<Fragment slot="…">` blocks of `src`, in document order. */
function topFragments(src: string): { slot: string; inner: string }[] {
  const out: { slot: string; inner: string }[] = [];
  const openRe = /<Fragment\s+slot=["'](\w+)["']\s*>/g;
  let open: RegExpExecArray | null;
  while ((open = openRe.exec(src)) !== null) {
    const innerStart = open.index + open[0].length;
    const tokenRe = /<Fragment(?:\s[^>]*)?>|<\/Fragment>/g;
    tokenRe.lastIndex = innerStart;
    let depth = 1;
    let token: RegExpExecArray | null = null;
    while ((token = tokenRe.exec(src)) !== null) {
      if (token[0].startsWith('</')) {
        if (--depth === 0) break;
      } else {
        depth++;
      }
    }
    if (!token || depth !== 0) break;
    out.push({ slot: open[1], inner: src.slice(innerStart, token.index) });
    openRe.lastIndex = tokenRe.lastIndex; // skip past this fragment's nested children
  }
  return out;
}

export function toDslMarkdown(entry: DocEntry, dsl: Dsl): string {
  const filePath = entry.filePath ?? `src/content/docs/${entry.id}.mdx`;
  const baseDir = dirname(resolve(process.cwd(), filePath));
  const body0 = entry.body ?? '';
  const raws = rawImports(body0, baseDir);
  const consts = stringConsts(body0);
  const readRaw = (name: string): string | null => {
    const p = raws.get(name);
    return p && existsSync(p) ? readFileSync(p, 'utf8') : null;
  };
  const titleOf = (varName?: string): string | undefined =>
    varName ? consts.get(varName) ?? varName : undefined;

  // Resolve self-closing code components (`<DslCode/>`, `<Code/>`) backed by
  // `?raw` imports into fenced blocks for the chosen DSL.
  const resolveCodeTags = (src: string): string =>
    src
      .replace(/<DslCode\b([^>]*?)\/>/g, (_full, attrs: string, offset: number, str: string) => {
        const codeVar = dsl === 'dx' ? attr(attrs, 'dxCode') : attr(attrs, 'jsonCode');
        if (!codeVar) return '';
        const indent = lineIndent(str, offset);
        const code = readRaw(codeVar);
        if (code == null) return `\n${indent}_(code sample unavailable: ${codeVar})_\n`;
        const title = titleOf(dsl === 'dx' ? attr(attrs, 'dxTitle') : attr(attrs, 'jsonTitle'));
        return `\n${indentBlock(fence(code, langForFile(raws.get(codeVar) ?? ''), title), indent)}\n`;
      })
      .replace(/<Code\b([^>]*?)\/>/g, (full, attrs: string, offset: number, str: string) => {
        const codeVar = attr(attrs, 'code');
        if (!codeVar) return full;
        const code = readRaw(codeVar);
        if (code == null) return full;
        const indent = lineIndent(str, offset);
        const lang = attr(attrs, 'lang') ?? langForFile(raws.get(codeVar) ?? '');
        return `\n${indentBlock(fence(code, lang, titleOf(attr(attrs, 'title'))), indent)}\n`;
      });

  // Collapse tab wrappers outermost-first, recursing into the chosen content so
  // nested DslTabs/IntegrationTabs combinations resolve at every level.
  const render = (src: string): string => {
    let out = src;
    for (;;) {
      const open = out.match(/<(DslTabs|IntegrationTabs|FrameworkContent)(?:\s[^>]*)?>/);
      if (!open || open.index === undefined) break;
      const block = findBlock(out, open[1], open.index);
      if (!block) break;
      const inner = out.slice(block.innerStart, block.innerEnd);
      const indent = lineIndent(out, block.outerStart);
      let content: string;
      if (open[1] === 'DslTabs') {
        const fragment = topFragments(inner).find((f) => f.slot === dsl);
        content = render(dedent(fragment?.inner ?? inner).trim());
      } else {
        content = topFragments(inner)
          .map((f) => `**${FRAMEWORK_LABELS[f.slot] ?? f.slot}**\n\n${render(dedent(f.inner).trim())}`)
          .join('\n\n');
      }
      const replacement = `\n${indentBlock(content, indent)}\n`;
      out = out.slice(0, block.outerStart) + replacement + out.slice(block.outerEnd);
    }
    return resolveCodeTags(out);
  };

  // Drop MDX imports, string-literal exports, and any leftover wrapper tags.
  const body = render(body0)
    .split('\n')
    .filter((line) => !/^\s*import\s.+from\s.+;?\s*$/.test(line))
    .filter((line) => !/^\s*export\s+const\s+\w+\s*=\s*['"][^'"]*['"];?\s*$/.test(line))
    .join('\n')
    .replace(/<\/?(?:DslTabs|DslCode|IntegrationTabs|FrameworkContent|Fragment)\b[^>]*>/g, '')
    .trim();

  const header = entry.data.description
    ? `# ${entry.data.title}\n\n> ${entry.data.description}\n`
    : `# ${entry.data.title}\n`;

  return `${header}\n${body}\n`;
}
