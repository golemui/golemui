/**
 * Custom Elements Manifest of GolemUI Components: every element's properties, attributes, events,
 * CSS custom properties and slots, from the Lit decorators and the JSDoc. Tools like IDEs and the
 * docs site read it through the package's `customElements` field.
 */

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

export default {
  globs: ['src/lib/components/*.ts', 'src/lib/gui-element.ts', 'src/lib/gui-form-control.ts'],
  exclude: ['src/**/*.spec.ts'],
  litelement: true,
  // The package.json `customElements` field is maintained by hand.
  packagejson: false,
  plugins: [safeDefinePlugin()],
};
