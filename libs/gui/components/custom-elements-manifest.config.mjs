/**
 * Custom Elements Manifest of GolemUI Components: every element's properties, attributes, events,
 * CSS custom properties and slots, from the Lit decorators and the JSDoc. Tools like IDEs and the
 * docs site read it through the package's `customElements` field.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Registers the tags defined with `safeDefine('gui-x', GuiX)`, which the analyzer does not know:
 * it only recognizes `customElements.define()` and `@customElement`.
 */
function safeDefinePlugin() {
  const definitions = new Map();
  return {
    name: 'golemui-safe-define',
    analyzePhase({ ts, node, moduleDoc }) {
      if (
        ts.isCallExpression(node) &&
        node.expression.getText() === 'safeDefine' &&
        node.arguments.length === 2 &&
        ts.isStringLiteral(node.arguments[0])
      ) {
        const list = definitions.get(moduleDoc.path) ?? [];
        list.push({ tagName: node.arguments[0].text, className: node.arguments[1].getText() });
        definitions.set(moduleDoc.path, list);
      }
    },
    moduleLinkPhase({ moduleDoc }) {
      for (const declaration of moduleDoc.declarations ?? []) {
        // Every GolemUI event is `gui-*`: anything else is an event name the analyzer misread,
        // such as the variable in `new CustomEvent(type)`.
        if (declaration.events) {
          declaration.events = declaration.events.filter(({ name }) => name?.startsWith('gui-'));
        }
        // Only the public API: private and protected members are implementation details.
        if (declaration.members) {
          declaration.members = declaration.members.filter(
            ({ privacy }) => privacy !== 'private' && privacy !== 'protected',
          );
        }
      }

      for (const { tagName, className } of definitions.get(moduleDoc.path) ?? []) {
        const declaration = moduleDoc.declarations?.find(({ name }) => name === className);
        if (!declaration) continue;
        declaration.tagName = tagName;
        declaration.customElement = true;
        moduleDoc.exports = [
          ...(moduleDoc.exports ?? []),
          {
            kind: 'custom-element-definition',
            name: tagName,
            declaration: { name: className, module: moduleDoc.path },
          },
        ];
      }
    },
  };
}

/**
 * Writes `vue.d.ts` next to the manifest: every element in Vue's `GlobalComponents`, with its
 * public properties as props and the events of its events map (`GuiTextinputEvents`) as typed
 * handlers, the typing the Vue docs recommend for custom elements
 * (https://vuejs.org/guide/extras/web-components#web-components-and-typescript).
 */
function vueTypesPlugin() {
  return {
    name: 'golemui-vue-types',
    packageLinkPhase({ customElementsManifest }) {
      const imports = [];
      const components = [];
      for (const module of customElementsManifest.modules) {
        const path = `./${module.path.replace(/^src\//, '').replace(/\.ts$/, '')}`;
        for (const declaration of module.declarations ?? []) {
          if (!declaration.tagName) continue;
          const { name, tagName } = declaration;
          const eventMap = module.declarations.find(
            (candidate) => candidate.kind === 'variable' && candidate.name === `${name}Events`,
          );
          imports.push(
            `import type { ${[name, eventMap?.name].filter(Boolean).join(', ')} } from '${path}';`,
          );

          const props = (declaration.members ?? [])
            .filter((member) => member.kind === 'field' && !member.static && !member.readonly)
            .map((member) => `'${member.name}'`);
          const events = eventMap ? `GuiEventMap<typeof ${eventMap.name}>` : '{}';
          const summary = declaration.description?.split('\n\n')[0].replace(/\s+/g, ' ');
          components.push({
            tagName,
            typing:
              `${summary ? `    /** ${summary.replaceAll('*/', '*\\/')} */\n` : ''}` +
              `    '${tagName}': GuiVueElement<${name}, ${props.join(' | ') || 'never'}, ${events}>;`,
          });
        }
      }

      const typings = `// Generated from the element sources by custom-elements-manifest.config.mjs.
import type { EmitFn, PublicProps } from 'vue';
import type { GuiEventMap } from './index';
${imports.sort().join('\n')}

/** A GolemUI element in Vue templates: its props and its \`@gui-*\` events, typed. */
type GuiVueElement<
  Element extends HTMLElement,
  Props extends keyof Element,
  Events extends Record<string, Event>,
> = new () => Element & {
  /** @deprecated For template type checking only: set props on the element instead. */
  $props: Partial<Pick<Element, Props>> & PublicProps;
  /** @deprecated For template type checking only. */
  $emit: EmitFn<{ [Name in keyof Events]: (event: Events[Name]) => void }>;
};

declare module 'vue' {
  interface GlobalComponents {
${components
  .sort((a, b) => a.tagName.localeCompare(b.tagName))
  .map(({ typing }) => typing)
  .join('\n')}
  }
}

export {};
`;
      writeFileSync(join(outdir(), 'vue.d.ts'), typings);
    },
  };
}

/** The directory the analyzer writes the manifest to (`--outdir`, or the working directory). */
function outdir() {
  const index = process.argv.indexOf('--outdir');
  return index === -1 ? '.' : process.argv[index + 1];
}

export default {
  globs: ['src/lib/components/*.ts', 'src/lib/gui-element.ts', 'src/lib/gui-form-control.ts'],
  exclude: ['src/**/*.spec.ts'],
  litelement: true,
  // The package.json `customElements` field is maintained by hand.
  packagejson: false,
  plugins: [safeDefinePlugin(), vueTypesPlugin()],
};
