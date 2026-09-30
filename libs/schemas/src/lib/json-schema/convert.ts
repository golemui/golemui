import { isDeclarativeRule, matchesDeclarativeRule } from './declarative-rules.js';
import { enumOptionsOf, isConstUnion } from './enum-options.js';
import { normalizeNode, type NormalizedNode, type NormalizeEnvironment } from './normalize.js';
import { appendPointer } from './pointer.js';
import { humanize } from './text.js';
import {
  type BuildContext,
  type BuildResult,
  type ConvertOptions,
  type ConvertResult,
  type DeclarativeRule,
  type Diagnostic,
  type FormDefinitionJson,
  type FormWidgetJson,
  type JsonSchema,
  type Localizable,
  type Preset,
  type SchemaNode,
  type WidgetPatch,
} from './types.js';
import { applyPatch, asWidgetList, cleanWidget, removeDuplicateWidgets } from './widget-json.js';

const DEFAULT_VENDOR_KEYWORD = 'x-golemui';
const DEFAULT_MAX_REF_DEPTH = 2;
const DEFAULT_MAX_NODES = 2000;

// Keywords with no form equivalent. The form does not check them, which is worth a warning.
const UNSUPPORTED_KEYWORDS = [
  'not',
  'contains',
  'propertyNames',
  'patternProperties',
  'unevaluatedProperties',
  'unevaluatedItems',
  '$dynamicRef',
  '$recursiveRef',
];

/**
 * Converts a JSON Schema that describes form data into a GolemUI form definition. It is a pure
 * function: use it at runtime with a schema from an API, or at build time to write a form file.
 *
 * For every schema node, the first of these layers that names a widget builds it: a path
 * override, a `$defs` override, the vendor keyword (`x-golemui`) in the schema, the user rules
 * in order, then the preset rules. The other fields of the overrides and the keyword are then
 * merged onto the widget, the most specific last. See {@link ConvertOptions}.
 *
 * The conversion never throws because of the schema shape. What it cannot express exactly is
 * listed in `diagnostics`.
 *
 * @param schema - The JSON Schema of the form data. The root must be an object schema.
 * @param options - The preset of the widget set, plus the optional customization layers.
 * @returns The form definition and the diagnostics.
 *
 * @example
 * const { formDefinition, diagnostics } = fromJsonSchema(schema, {
 *   preset: guiPreset(),
 *   rules: [{ match: { $type: 'string', format: 'email' }, props: { icon: 'mail' } }],
 *   overrides: { 'address.street': { widget: 'textarea' } },
 * })
 */
export function fromJsonSchema(
  schema: JsonSchema | boolean,
  options: ConvertOptions,
): ConvertResult {
  return new Conversion(schema, options).run();
}

/** A user rule or a preset rule, in one shape. */
type RuleEntry = {
  name: string;
  test(node: SchemaNode): boolean;
  build(node: SchemaNode, context: BuildContext): BuildResult;
  /** The widget fields of a declarative rule, merged onto what it builds. */
  patch?: WidgetPatch;
};

/** Where a child node sits, before it is normalized. */
type Placement = {
  parent?: SchemaNode;
  name?: string;
  path: string;
  pointer: string;
  required: boolean;
  repeaterDepth: number;
  refTrail: readonly string[];
};

class Conversion {
  private readonly preset: Preset;
  private readonly userRules: RuleEntry[];
  private readonly allRules: RuleEntry[];
  private readonly refRoot: JsonSchema;
  private readonly vendorKeyword: string | false;
  private readonly maxRefDepth: number;
  private readonly maxNodes: number;
  private readonly diagnostics: Diagnostic[] = [];
  private readonly pointers = new WeakMap<object, string>();
  private readonly normalizedNodes = new WeakMap<SchemaNode, NormalizedNode>();
  private readonly childrenCache = new WeakMap<SchemaNode, SchemaNode[]>();
  private readonly itemCache = new WeakMap<SchemaNode, SchemaNode | undefined>();
  // The node each built widget came from, to point duplicate reports at the schema.
  private readonly widgetNodes = new WeakMap<object, SchemaNode>();
  private builtNodes = 0;

  constructor(
    private readonly schema: JsonSchema | boolean,
    private readonly options: ConvertOptions,
  ) {
    this.preset = options.preset;
    this.userRules = (options.rules ?? []).map((rule, index) =>
      isDeclarativeRule(rule)
        ? this.declarativeRuleEntry(rule, `rule ${index}`)
        : {
            name: rule.name ?? `rule ${index}`,
            test: (node) => rule.when(node),
            build: rule.build,
          },
    );
    const presetRules = this.preset.rules.map((rule, index) => ({
      name: rule.name ?? `${this.preset.name} rule ${index}`,
      test: (node: SchemaNode) => rule.when(node),
      build: rule.build,
    }));
    this.allRules = [...this.userRules, ...presetRules];
    this.refRoot = options.refRoot ?? (typeof schema === 'object' ? schema : {});
    this.vendorKeyword = options.vendorKeyword ?? DEFAULT_VENDOR_KEYWORD;
    this.maxRefDepth = options.maxRefDepth ?? DEFAULT_MAX_REF_DEPTH;
    this.maxNodes = options.maxNodes ?? DEFAULT_MAX_NODES;
  }

  run(): ConvertResult {
    const root = this.createNode(this.schema, {
      path: '',
      pointer: '',
      required: false,
      repeaterDepth: 0,
      refTrail: [],
    });
    let widgets: FormWidgetJson[] = [];
    if (this.schema === false) {
      this.diagnostics.push({
        severity: 'error',
        code: 'root-not-object',
        message: 'The root schema is `false`, so no data is valid and there is no form.',
        path: '',
        pointer: '',
      });
    } else if (root !== undefined && root.type !== 'object') {
      this.report(root, {
        severity: 'error',
        code: 'root-not-object',
        message: 'Only an object schema at the root can become a form.',
      });
    } else if (root !== undefined) {
      widgets = this.buildRoot(root);
    }

    const form = removeDuplicateWidgets(this.preset.root(widgets), (widget, field) => {
      const node = this.widgetNodes.get(widget);
      this.diagnostics.push({
        severity: 'error',
        code: field === 'path' ? 'duplicate-path' : 'duplicate-uid',
        message: `Two widgets have the ${field} \`${String(widget[field])}\`. The later one is removed.`,
        path: node?.path ?? String(widget.path ?? ''),
        pointer: node?.pointer ?? '',
      });
    });
    const formDefinition: FormDefinitionJson = { form: form.map(cleanWidget) };
    if (this.preset.schemaUrl !== undefined) {
      formDefinition.$schema = this.preset.schemaUrl;
    }
    return {
      formDefinition: this.options.transform?.(formDefinition) ?? formDefinition,
      diagnostics: this.diagnostics,
    };
  }

  /**
   * The root object renders its properties directly. A layer that names a widget, or a user
   * rule, can build it instead. The preset rules never do, they would wrap it in a group.
   */
  private buildRoot(root: SchemaNode): FormWidgetJson[] {
    const patches = this.patchesFor(root);
    const namedWidget = this.namedWidget(patches);
    let result =
      namedWidget !== undefined
        ? this.buildNamedWidget(namedWidget, root)
        : this.buildWithRules(root, 0, this.userRules);
    if (result === undefined) {
      return this.buildChildren(root);
    }
    for (const patch of patches) {
      result = applyPatch(result, patch);
    }
    return asWidgetList(result);
  }

  /** Builds a node with every layer, see {@link fromJsonSchema}. */
  private buildNode(node: SchemaNode): BuildResult {
    if (!this.countNode(node)) {
      return null;
    }
    const patches = this.patchesFor(node);
    if (patches.some((patch) => patch.skip === true)) {
      return null;
    }
    const namedWidget = this.namedWidget(patches);
    let result =
      namedWidget !== undefined
        ? this.buildNamedWidget(namedWidget, node)
        : this.buildWithRules(node, 0, this.allRules);
    if (result === undefined) {
      this.report(node, {
        severity: 'error',
        code: 'unsupported-shape',
        message: `No rule can build this ${node.type ?? 'untyped'} schema, so it is not rendered.`,
      });
      return null;
    }
    for (const patch of patches) {
      result = applyPatch(result, patch);
    }
    for (const widget of asWidgetList(result)) {
      this.widgetNodes.set(widget, node);
    }
    return result;
  }

  /** The first rule from `startIndex` on that matches and does not decline builds the node. */
  private buildWithRules(node: SchemaNode, startIndex: number, rules: RuleEntry[]): BuildResult {
    for (let index = startIndex; index < rules.length; index++) {
      const rule = rules[index];
      let result: BuildResult;
      try {
        if (!rule.test(node)) {
          continue;
        }
        result = rule.build(node, this.contextFor(node, index, rules));
      } catch (error) {
        this.report(node, {
          severity: 'warning',
          code: 'rule-error',
          message: `${rule.name} threw (${errorMessage(error)}), so the next rule is used.`,
        });
        continue;
      }
      if (result !== undefined) {
        return applyPatch(result, rule.patch);
      }
    }
    return undefined;
  }

  /**
   * Builds the widget type a layer names. A type the preset does not know is most likely a
   * custom widget of the app, so it becomes a plain input of that type.
   */
  private buildNamedWidget(type: string, node: SchemaNode): BuildResult {
    const builder = this.preset.widgets[type];
    const context = this.contextFor(node, -1, this.allRules);
    if (builder === undefined) {
      this.report(node, {
        severity: 'info',
        code: 'custom-widget',
        message: `The ${this.preset.name} preset has no \`${type}\` widget, so a plain input of that type is built.`,
      });
      return {
        kind: 'input',
        type,
        path: node.path,
        label: context.label(node),
        validator: context.validator(node),
      };
    }
    try {
      return builder(node, context);
    } catch (error) {
      this.report(node, {
        severity: 'warning',
        code: 'rule-error',
        message: `The \`${type}\` builder threw (${errorMessage(error)}), so the rules are used.`,
      });
      return this.buildWithRules(node, 0, this.allRules);
    }
  }

  /** @param ruleIndex - The rule that builds the node, `-1` for a named widget. */
  private contextFor(node: SchemaNode, ruleIndex: number, rules: RuleEntry[]): BuildContext {
    return {
      next: (target = node) => this.buildWithRules(target, ruleIndex + 1, rules),
      build: (target) => this.buildNode(target),
      children: (target) => this.childrenOf(target),
      buildChildren: (target) => this.buildChildren(target),
      item: (target) => this.itemOf(target),
      label: (target) => labelOf(target),
      validator: (target) => this.preset.validator(target),
      enumOptions: (target) => enumOptionsOf(target),
      diagnostic: (diagnostic) =>
        this.diagnostics.push({
          ...diagnostic,
          path: diagnostic.path ?? node.path,
          pointer: diagnostic.pointer ?? node.pointer,
        }),
    };
  }

  private buildChildren(node: SchemaNode): FormWidgetJson[] {
    return this.childrenOf(node).flatMap((child) => asWidgetList(this.buildNode(child)));
  }

  /** The hint, the `$defs` override and the path override of a node, least specific first. */
  private patchesFor(node: SchemaNode): WidgetPatch[] {
    const overrides = this.options.overrides ?? {};
    const definitionOverride =
      node.defName !== undefined ? overrides[`$defs/${node.defName}`] : undefined;
    return [node.hint, definitionOverride, overrides[node.path]].filter(
      (patch): patch is WidgetPatch => patch !== undefined,
    );
  }

  private namedWidget(patches: WidgetPatch[]): string | undefined {
    return [...patches].reverse().find((patch) => patch.widget !== undefined)?.widget;
  }

  private declarativeRuleEntry(rule: DeclarativeRule, fallbackName: string): RuleEntry {
    return {
      name: rule.name ?? fallbackName,
      test: (node) => matchesDeclarativeRule(rule, node),
      build: (node, context) => {
        if (rule.skip === true) {
          return null;
        }
        // Without a widget, the rule only patches what the next rule builds.
        return rule.widget !== undefined
          ? this.buildNamedWidget(rule.widget, node)
          : context.next();
      },
      patch: {
        label: rule.label,
        props: rule.props,
        validator: rule.validator,
        defaultValue: rule.defaultValue,
        readonly: rule.readonly,
        size: rule.size,
        uid: rule.uid,
      },
    };
  }

  /** The child nodes of an object or a tuple, see {@link BuildContext.children}. */
  private childrenOf(node: SchemaNode): SchemaNode[] {
    const cached = this.childrenCache.get(node);
    if (cached !== undefined) {
      return cached;
    }
    const children =
      node.type === 'object'
        ? this.propertyNodes(node)
        : node.type === 'array'
          ? this.tupleNodes(node)
          : [];
    this.childrenCache.set(node, children);
    return children;
  }

  private propertyNodes(node: SchemaNode): SchemaNode[] {
    const properties = node.schema['properties'];
    if (properties === null || typeof properties !== 'object') {
      return [];
    }
    const required = Array.isArray(node.schema['required']) ? node.schema['required'] : [];
    const children: SchemaNode[] = [];
    for (const name of this.orderedNames(node, Object.keys(properties))) {
      const path = joinPath(node.path, name);
      const pointer = appendPointer(node.pointer, 'properties', name);
      if (name === '' || name.includes('.')) {
        this.diagnostics.push({
          severity: 'error',
          code: 'invalid-property-name',
          message: `The property name "${name}" cannot be part of a form path, so it is not rendered.`,
          path,
          pointer,
        });
        continue;
      }
      if (/^\d+$/.test(name)) {
        this.diagnostics.push({
          severity: 'warning',
          code: 'numeric-property-name',
          message: `The form writes "${name}" as an array index, so this object becomes an array.`,
          path,
          pointer,
        });
      }
      const child = this.createNode((properties as Record<string, unknown>)[name], {
        parent: node,
        name,
        path,
        pointer,
        required: required.includes(name),
        repeaterDepth: node.repeaterDepth,
        refTrail: this.refTrailOf(node),
      });
      if (child !== undefined) {
        children.push(child);
      }
    }
    return children;
  }

  /**
   * Property names in the `order` of the most specific layer that has one: the path override,
   * the `$defs` override, the hint, then the first matching declarative rule.
   */
  private orderedNames(node: SchemaNode, names: string[]): string[] {
    const order =
      [...this.patchesFor(node)].reverse().find((patch) => patch.order)?.order ??
      this.declarativeOrder(node);
    if (order === undefined) {
      return names;
    }
    const listed = order.filter((name) => name !== '*' && names.includes(name));
    const rest = names.filter((name) => !listed.includes(name));
    const restIndex = order.indexOf('*');
    if (restIndex === -1) {
      return [...listed, ...rest];
    }
    const before = order.slice(0, restIndex).filter((name) => listed.includes(name));
    const after = order.slice(restIndex + 1).filter((name) => listed.includes(name));
    return [...before, ...rest, ...after];
  }

  private declarativeOrder(node: SchemaNode): string[] | undefined {
    for (const rule of this.options.rules ?? []) {
      if (!isDeclarativeRule(rule) || rule.order === undefined) {
        continue;
      }
      try {
        if (matchesDeclarativeRule(rule, node)) {
          return rule.order;
        }
      } catch {
        // An invalid `$regex` is reported when the rule builds, not here as well.
      }
    }
    return undefined;
  }

  private tupleNodes(node: SchemaNode): SchemaNode[] {
    const positions = node.schema['prefixItems'];
    if (!Array.isArray(positions)) {
      return [];
    }
    const minItems = typeof node.schema['minItems'] === 'number' ? node.schema['minItems'] : 0;
    return positions.flatMap((raw, index) => {
      const child = this.createNode(raw, {
        parent: node,
        path: joinPath(node.path, String(index)),
        pointer: appendPointer(node.pointer, 'prefixItems', index),
        required: index < minItems,
        repeaterDepth: node.repeaterDepth,
        refTrail: this.refTrailOf(node),
      });
      return child === undefined ? [] : [child];
    });
  }

  private itemOf(node: SchemaNode): SchemaNode | undefined {
    if (this.itemCache.has(node)) {
      return this.itemCache.get(node);
    }
    const items = node.schema['items'];
    const item =
      node.type === 'array' && items !== undefined && items !== false
        ? this.createNode(items, {
            parent: node,
            path: joinPath(node.path, 'items'),
            pointer: appendPointer(node.pointer, 'items'),
            required: false,
            repeaterDepth: node.repeaterDepth + 1,
            refTrail: this.refTrailOf(node),
          })
        : undefined;
    this.itemCache.set(node, item);
    return item;
  }

  private createNode(raw: unknown, placement: Placement): SchemaNode | undefined {
    const pointer =
      (raw !== null && typeof raw === 'object' && this.pointers.get(raw)) || placement.pointer;
    const environment: NormalizeEnvironment = {
      root: this.refRoot,
      maxRefDepth: this.maxRefDepth,
      pointers: this.pointers,
      report: (problem) => this.diagnostics.push({ ...problem, path: placement.path }),
    };
    const normalized = normalizeNode(raw, pointer, placement.refTrail, environment);
    if (normalized === undefined) {
      return undefined;
    }
    const node: SchemaNode = {
      schema: normalized.schema,
      type: normalized.type,
      nullable: normalized.nullable,
      path: placement.path,
      name: placement.name,
      defName: normalized.defName,
      pointer,
      required: placement.required,
      repeaterDepth: placement.repeaterDepth,
      hint: this.hintOf(normalized, placement.path, pointer),
      parent: placement.parent,
    };
    this.normalizedNodes.set(node, normalized);
    this.reportUnsupported(node, normalized);
    return node;
  }

  private hintOf(
    normalized: NormalizedNode,
    path: string,
    pointer: string,
  ): WidgetPatch | undefined {
    if (this.vendorKeyword === false || !(this.vendorKeyword in normalized.schema)) {
      return undefined;
    }
    const hint = normalized.schema[this.vendorKeyword];
    if (hint !== null && typeof hint === 'object' && !Array.isArray(hint)) {
      return hint as WidgetPatch;
    }
    this.diagnostics.push({
      severity: 'warning',
      code: 'invalid-hint',
      message: `\`${this.vendorKeyword}\` must be an object, so it is ignored.`,
      path,
      pointer,
    });
    return undefined;
  }

  private reportUnsupported(node: SchemaNode, normalized: NormalizedNode): void {
    for (const keyword of UNSUPPORTED_KEYWORDS) {
      if (keyword in node.schema) {
        this.report(node, {
          severity: 'warning',
          code: 'unsupported-keyword',
          message: `\`${keyword}\` has no form equivalent, so the form does not check it.`,
        });
      }
    }
    const additional = node.schema['additionalProperties'];
    if (additional !== null && typeof additional === 'object') {
      this.report(node, {
        severity: 'warning',
        code: 'unsupported-keyword',
        message:
          'No widget edits free-form keys (`additionalProperties` with a schema). Only the declared properties are rendered.',
      });
    }
    for (const keyword of ['oneOf', 'anyOf']) {
      const branches = node.schema[keyword];
      if (Array.isArray(branches) && !isConstUnion(branches)) {
        this.report(node, {
          severity: 'warning',
          code: 'unsupported-keyword',
          message: `\`${keyword}\` with schema branches is not supported, so its branches are not rendered.`,
        });
      }
    }
    for (const conditional of normalized.conditionals) {
      this.diagnostics.push({
        severity: 'warning',
        code: 'unsupported-keyword',
        message: `\`${conditional.kind}\` is not supported, so the form shows every property without the condition.`,
        path: node.path,
        pointer: conditional.pointer,
      });
    }
  }

  private refTrailOf(node: SchemaNode): readonly string[] {
    return this.normalizedNodes.get(node)?.refTrail ?? [];
  }

  /** Counts a node, false once `maxNodes` is reached. The limit is reported once. */
  private countNode(node: SchemaNode): boolean {
    this.builtNodes++;
    if (this.builtNodes === this.maxNodes + 1) {
      this.report(node, {
        severity: 'error',
        code: 'max-nodes',
        message: `The schema has more than ${this.maxNodes} nodes, so the rest is not rendered.`,
      });
    }
    return this.builtNodes <= this.maxNodes;
  }

  private report(node: SchemaNode, diagnostic: Omit<Diagnostic, 'path' | 'pointer'>): void {
    this.diagnostics.push({ ...diagnostic, path: node.path, pointer: node.pointer });
  }
}

/** The schema `title`, otherwise the property name in readable form. */
function labelOf(node: SchemaNode): Localizable | undefined {
  const title = node.schema['title'];
  if (typeof title === 'string' && title !== '') {
    return title;
  }
  return node.name !== undefined ? humanize(node.name) : undefined;
}

function joinPath(parent: string, segment: string): string {
  return parent === '' ? segment : `${parent}.${segment}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
