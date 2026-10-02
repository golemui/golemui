import { compileCondition } from './conditions.js';
import { isDeclarativeRule, matchesDeclarativeRule } from './declarative-rules.js';
import { enumOptionsOf, isConstUnion } from './enum-options.js';
import { dataReference, equalsAny, innermostItemNode } from './expressions.js';
import { normalizeNode, type NormalizedNode, type NormalizeEnvironment } from './normalize.js';
import { appendPointer } from './pointer.js';
import { humanize } from './text.js';
import { discriminatorOf, type Discriminator } from './unions.js';
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
import {
  applyPatch,
  asWidgetList,
  cleanWidget,
  removeDuplicateWidgets,
  withIncludeCondition,
} from './widget-json.js';

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

/** One object branch of a `oneOf`/`anyOf`, normalized. */
type UnionBranch = { raw: unknown; pointer: string; normalized: NormalizedNode };

/** A `oneOf`/`anyOf` whose branches are all objects. */
type ObjectUnion = {
  keyword: 'oneOf' | 'anyOf';
  branches: UnionBranch[];
  /** Undefined when no property tells the branches apart. */
  discriminator?: Discriminator;
};

/** Where a union property is defined: which branch, and how. */
type BranchProperty = {
  branchIndex: number;
  raw: unknown;
  required: boolean;
  pointer: string;
  refTrail: readonly string[];
};

/** One branch of a compiled conditional: when it applies, and what it adds. */
type ConditionalBranch = {
  /** A reactive expression, `undefined` when the `if` has no expression equivalent. */
  condition?: string;
  /** Prefix of the state name: `if` or `dep`. */
  statePrefix: 'if' | 'dep';
  /** Branches of one conditional share a group. `then` and `else` never apply together. */
  group: number;
  side?: 'then' | 'else';
  /** The branch schema, normalized. Undefined for `dependentRequired`. */
  schema?: NormalizedNode;
  schemaPointer: string;
  /** Names the branch requires besides `schema.required`, from `dependentRequired`. */
  requiredNames: string[];
  /** The properties the condition reads. Branch-only widgets go after the last of them. */
  reads: string[];
};

/** A branch that adds constraints to a declared property. `raw` is undefined for `required` only. */
type Overlay = { branch: ConditionalBranch; raw: unknown; required: boolean };

/** A property that only a conditional branch defines. */
type BranchDefinition = {
  branch: ConditionalBranch;
  raw: unknown;
  required: boolean;
  pointer: string;
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
  // Keyed by the normalized schema. `null` means the node has no union of objects.
  private readonly objectUnions = new WeakMap<JsonSchema, ObjectUnion | null>();
  // State expression -> state name. One state per distinct expression.
  private readonly states = new Map<string, string>();
  private readonly stateCounters = new Map<string, number>();
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
    const formDefinition: FormDefinitionJson = {
      ...(this.preset.schemaUrl === undefined ? {} : { $schema: this.preset.schemaUrl }),
      ...(this.states.size === 0
        ? {}
        : {
            states: Object.fromEntries(
              [...this.states].map(([expression, name]) => [name, expression]),
            ),
          }),
      form: form.map(cleanWidget),
    };
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
    const children = this.childrenOf(node);
    const union = this.objectUnions.get(node.schema);
    const widgets = union
      ? this.buildUnionChildren(node, children, union)
      : children.flatMap((child) => asWidgetList(this.buildNode(child)));
    return this.applyConditionals(node, children, widgets);
  }

  /**
   * Compiles the conditionals of an object (`if/then/else`, `dependentRequired`,
   * `dependentSchemas`) into its widgets:
   * - a property only a branch defines is built once, visible for the branches that define it,
   *   and placed after the last property the condition reads;
   * - a declared property that a branch constrains gets a `validator.<state>` for that branch.
   */
  private applyConditionals(
    owner: SchemaNode,
    children: SchemaNode[],
    widgets: FormWidgetJson[],
  ): FormWidgetJson[] {
    const branches = this.compileConditionals(owner);
    if (branches.length === 0) {
      return widgets;
    }
    const declared = new Map(
      children.flatMap((child) => (child.name === undefined ? [] : [[child.name, child] as const])),
    );
    const overlays = new Map<string, Overlay[]>();
    const definitions = new Map<string, BranchDefinition[]>();
    const add = <T>(map: Map<string, T[]>, name: string, entry: T) =>
      map.set(name, [...(map.get(name) ?? []), entry]);

    for (const branch of branches) {
      const schema = branch.schema?.schema ?? {};
      const properties = recordOf(schema['properties']);
      const required = [...requiredOf(schema), ...branch.requiredNames].filter(
        (name): name is string => typeof name === 'string',
      );
      for (const [name, raw] of Object.entries(properties)) {
        if (declared.has(name)) {
          add(overlays, name, { branch, raw, required: required.includes(name) });
        } else {
          add(definitions, name, {
            branch,
            raw,
            required: required.includes(name),
            pointer: this.pointerOf(raw) ?? appendPointer(branch.schemaPointer, 'properties', name),
          });
        }
      }
      for (const name of required) {
        if (!(name in properties) && declared.has(name)) {
          add(overlays, name, { branch, raw: undefined, required: true });
        }
      }
    }

    const withOverlays = this.applyOverlays(owner, declared, overlays, widgets);
    return this.insertBranchProperties(owner, definitions, withOverlays);
  }

  private compileConditionals(owner: SchemaNode): ConditionalBranch[] {
    const conditionals = this.normalizedNodes.get(owner)?.conditionals ?? [];
    const reference = (segments: string[]) =>
      dataReference(owner, joinPath(owner.path, segments.join('.')));
    const branches: ConditionalBranch[] = [];
    conditionals.forEach((conditional, group) => {
      if (conditional.kind !== 'if') {
        branches.push({
          condition: `${reference([conditional.property])} !== undefined`,
          statePrefix: 'dep',
          group,
          schema:
            conditional.kind === 'dependentSchemas'
              ? this.normalizeBranch(owner, conditional.schema, conditional.pointer)
              : undefined,
          schemaPointer: conditional.pointer,
          requiredNames: conditional.kind === 'dependentRequired' ? conditional.required : [],
          reads: [conditional.property],
        });
        return;
      }

      const compiled = compileCondition(conditional.if, reference);
      if ('unsupported' in compiled) {
        this.diagnostics.push({
          severity: 'warning',
          code: 'if-unsupported',
          message: `The \`if\` uses \`${compiled.unsupported}\`, which has no expression equivalent. The \`then\` and \`else\` properties are always shown and optional.`,
          path: owner.path,
          pointer: appendPointer(conditional.pointer, 'if'),
        });
      } else if (compiled.vacuous) {
        this.diagnostics.push({
          severity: 'info',
          code: 'if-vacuous',
          message:
            'The `if` also holds when a property it tests is absent, because that property is not in `if.required`. JSON Schema defines it that way.',
          path: owner.path,
          pointer: appendPointer(conditional.pointer, 'if'),
        });
      }
      const condition = 'unsupported' in compiled ? undefined : compiled.expression;
      for (const side of ['then', 'else'] as const) {
        const raw = conditional[side];
        if (raw === undefined) {
          continue;
        }
        const schemaPointer = appendPointer(conditional.pointer, side);
        branches.push({
          condition:
            condition === undefined ? undefined : side === 'then' ? condition : `!(${condition})`,
          statePrefix: 'if',
          group,
          side,
          schema: this.normalizeBranch(owner, raw, schemaPointer),
          schemaPointer,
          requiredNames: [],
          reads: 'unsupported' in compiled ? [] : compiled.reads,
        });
      }
    });
    return branches;
  }

  private normalizeBranch(
    owner: SchemaNode,
    raw: unknown,
    pointer: string,
  ): NormalizedNode | undefined {
    const branchPointer = this.pointerOf(raw) ?? pointer;
    const node = normalizeNode(
      raw,
      branchPointer,
      this.refTrailOf(owner),
      this.environmentFor(owner.path),
    );
    if (node !== undefined && node.conditionals.length > 0) {
      this.diagnostics.push({
        severity: 'warning',
        code: 'nested-conditional',
        message:
          'A conditional inside a conditional branch is not supported, so it is not applied.',
        path: owner.path,
        pointer: branchPointer,
      });
    }
    return node;
  }

  /**
   * Adds `validator.<state>` to the widget of each declared property a branch constrains. One
   * state applies per field at a time, so only these combinations are expressible: required
   * from any number of conditions (one state that ORs them), or the branches of one conditional
   * (they never hold together). Anything else keeps the first conditional and warns.
   */
  private applyOverlays(
    owner: SchemaNode,
    declared: Map<string, SchemaNode>,
    overlays: Map<string, Overlay[]>,
    widgets: FormWidgetJson[],
  ): FormWidgetJson[] {
    let updated = widgets;
    for (const [name, list] of overlays) {
      const child = declared.get(name) as SchemaNode;
      const compiled = list.filter((overlay) => overlay.branch.condition !== undefined);
      if (compiled.length === 0) {
        continue;
      }
      if (innermostItemNode(owner) !== undefined) {
        this.report(child, {
          severity: 'warning',
          code: 'conditional-validator-in-repeater',
          message: `Inside a repeater a condition can only show or hide widgets, so the conditional constraints of \`${name}\` are not applied.`,
        });
        continue;
      }

      const validators: Record<string, unknown> = {};
      for (const selected of this.selectOverlays(child, compiled)) {
        const state = this.stateFor(selected.prefix, selected.condition);
        const validator = this.preset.validator(
          this.derivedNode(child, selected.raw, selected.required || child.required),
        );
        if (validator !== undefined) {
          validators[`validator.${state}`] = validator;
        }
      }
      const index = updated.findIndex(
        (widget) => widget.kind === 'input' && widget.path === child.path,
      );
      if (index === -1) {
        this.report(child, {
          severity: 'warning',
          code: 'overlay-limit',
          message: `\`${name}\` is not built as one input, so its conditional constraints are not applied.`,
        });
        continue;
      }
      updated = [...updated];
      updated[index] = { ...updated[index], ...validators };
    }
    return updated;
  }

  private selectOverlays(
    child: SchemaNode,
    overlays: Overlay[],
  ): { condition: string; raw: unknown; required: boolean; prefix: string }[] {
    if (overlays.every((overlay) => overlay.raw === undefined)) {
      // Only `required`, from one or several conditions: one state that holds when any does.
      const conditions = [
        ...new Set(overlays.map((overlay) => overlay.branch.condition as string)),
      ];
      return [
        {
          condition: orConditions(conditions),
          raw: undefined,
          required: true,
          prefix: conditions.length === 1 ? overlays[0].branch.statePrefix : 'required',
        },
      ];
    }
    const firstGroup = overlays[0].branch.group;
    const inFirstGroup = overlays.filter((overlay) => overlay.branch.group === firstGroup);
    if (inFirstGroup.length < overlays.length) {
      this.report(child, {
        severity: 'warning',
        code: 'overlay-limit',
        message: `\`${child.name}\` gets constraints from several conditions. Only the first condition is applied.`,
      });
    }
    return inFirstGroup.map((overlay) => ({
      condition: overlay.branch.condition as string,
      raw: overlay.raw,
      required: overlay.required,
      prefix: overlay.branch.statePrefix,
    }));
  }

  /** The node with the constraints of a branch merged in, for the validator of that branch. */
  private derivedNode(node: SchemaNode, raw: unknown, required: boolean): SchemaNode {
    if (raw === undefined) {
      return { ...node, required };
    }
    const merged = normalizeNode(
      { allOf: [node.schema, raw] },
      node.pointer,
      this.refTrailOf(node),
      this.environmentFor(node.path),
    );
    return merged === undefined
      ? { ...node, required }
      : { ...node, schema: merged.schema, type: merged.type ?? node.type, required };
  }

  /**
   * Builds each property that only conditional branches define, once, visible when one of those
   * branches applies. It goes after the last property its condition reads, or at the end.
   */
  private insertBranchProperties(
    owner: SchemaNode,
    definitions: Map<string, BranchDefinition[]>,
    widgets: FormWidgetJson[],
  ): FormWidgetJson[] {
    const result = [...widgets];
    const inserted = new Set<FormWidgetJson>();
    for (const [name, list] of definitions) {
      const [first] = list;
      const path = joinPath(owner.path, name);
      if (!this.isValidPropertyName(name, path, first.pointer)) {
        continue;
      }
      // An `if` without an expression equivalent shows its branch properties always, optional.
      const unconditional = list.some((definition) => definition.branch.condition === undefined);
      const child = this.createNode(first.raw, {
        parent: owner,
        name,
        path,
        pointer: first.pointer,
        required: !unconditional && list.every((definition) => definition.required),
        repeaterDepth: owner.repeaterDepth,
        refTrail: first.branch.schema?.refTrail ?? this.refTrailOf(owner),
      });
      if (child === undefined) {
        continue;
      }
      if (
        list.some((entry) => !jsonEqual(entry.raw, first.raw) || entry.required !== first.required)
      ) {
        this.report(child, {
          severity: 'warning',
          code: 'branch-schema-conflict',
          message: `The branches define \`${name}\` differently. The form uses the first definition.`,
        });
      }

      let built = this.buildNode(child);
      if (!unconditional && !coversBothSides(list)) {
        const conditions = [
          ...new Set(list.map((definition) => definition.branch.condition as string)),
        ];
        built = withIncludeCondition(built, orConditions(conditions));
      }

      const readPaths = first.branch.reads.map((read) => joinPath(owner.path, read));
      let position = result.reduce(
        (last, widget, index) => (readPaths.includes(String(widget.path)) ? index + 1 : last),
        result.length,
      );
      if (position < result.length || readPaths.length > 0) {
        while (position < result.length && inserted.has(result[position])) {
          position++;
        }
      }
      const builtWidgets = asWidgetList(built);
      builtWidgets.forEach((widget) => inserted.add(widget));
      result.splice(position, 0, ...builtWidgets);
    }
    return result;
  }

  /** The name of the state for an expression. The same expression always gets the same state. */
  private stateFor(prefix: string, expression: string): string {
    const existing = this.states.get(expression);
    if (existing !== undefined) {
      return existing;
    }
    const count = (this.stateCounters.get(prefix) ?? 0) + 1;
    this.stateCounters.set(prefix, count);
    const name = `${prefix}${String(count).padStart(2, '0')}`;
    this.states.set(expression, name);
    return name;
  }

  /**
   * Builds an object whose `oneOf`/`anyOf` branches are objects. The discriminator becomes one
   * selector, in its own place when the object declares it, after the declared properties
   * otherwise. Then every branch property is built once, visible only for the branches that
   * define it, so no two widgets ever share a path.
   */
  private buildUnionChildren(
    owner: SchemaNode,
    children: SchemaNode[],
    union: ObjectUnion,
  ): FormWidgetJson[] {
    const { discriminator } = union;
    const widgets: FormWidgetJson[] = [];
    let selectorBuilt = false;
    for (const child of children) {
      if (discriminator !== undefined && child.name === discriminator.property) {
        widgets.push(...this.buildSelector(owner, union, discriminator));
        selectorBuilt = true;
      } else {
        widgets.push(...asWidgetList(this.buildNode(child)));
      }
    }
    if (discriminator === undefined) {
      this.report(owner, {
        severity: 'warning',
        code: 'no-discriminator',
        message: `No property tells the \`${union.keyword}\` branches apart (a \`const\` in every branch, or \`discriminator.propertyName\`). Every branch property is rendered, optional and always visible.`,
      });
    } else if (!selectorBuilt) {
      widgets.push(...this.buildSelector(owner, union, discriminator));
    }
    widgets.push(...this.buildUnionProperties(owner, union));
    return widgets;
  }

  /**
   * The discriminator as an enumeration of the branch values, labelled by the branch titles. A
   * declaration next to the union keeps its annotations, e.g. its title.
   */
  private buildSelector(
    owner: SchemaNode,
    union: ObjectUnion,
    discriminator: Discriminator,
  ): FormWidgetJson[] {
    const { property, values } = discriminator;
    const declared = recordOf(owner.schema['properties'])[property];
    const firstBranchDeclaration = recordOf(union.branches[0].normalized.schema['properties'])[
      property
    ];
    const choices = {
      oneOf: union.branches.map((branch, index) => ({
        const: values[index],
        title: branchTitle(branch, values[index]),
      })),
    };
    const raw =
      declared !== undefined
        ? { allOf: [declared, choices] }
        : { title: recordOf(firstBranchDeclaration)['title'], ...choices };
    const node = this.createNode(raw, {
      parent: owner,
      name: property,
      path: joinPath(owner.path, property),
      pointer:
        this.pointerOf(declared) ??
        this.pointerOf(firstBranchDeclaration) ??
        appendPointer(owner.pointer, 'properties', property),
      required:
        requiredOf(owner.schema).includes(property) ||
        union.branches.every((branch) => requiredOf(branch.normalized.schema).includes(property)),
      repeaterDepth: owner.repeaterDepth,
      refTrail: this.refTrailOf(owner),
    });
    return node === undefined ? [] : asWidgetList(this.buildNode(node));
  }

  /** Builds each branch property once, see {@link Conversion.buildUnionChildren}. */
  private buildUnionProperties(owner: SchemaNode, union: ObjectUnion): FormWidgetJson[] {
    const { discriminator } = union;
    const declared = recordOf(owner.schema['properties']);
    const definitions = new Map<string, BranchProperty[]>();
    union.branches.forEach((branch, branchIndex) => {
      const required = requiredOf(branch.normalized.schema);
      for (const [name, raw] of Object.entries(recordOf(branch.normalized.schema['properties']))) {
        if (name === discriminator?.property) {
          continue;
        }
        const pointer = this.pointerOf(raw) ?? appendPointer(branch.pointer, 'properties', name);
        if (name in declared) {
          if (!jsonEqual(raw, declared[name])) {
            this.diagnostics.push({
              severity: 'warning',
              code: 'branch-schema-conflict',
              message: `\`${name}\` is declared next to the union and again in a branch. The declaration next to the union is used.`,
              path: joinPath(owner.path, name),
              pointer,
            });
          }
          continue;
        }
        const list = definitions.get(name) ?? [];
        list.push({
          branchIndex,
          raw,
          required: required.includes(name),
          pointer,
          refTrail: branch.normalized.refTrail,
        });
        definitions.set(name, list);
      }
    });

    const widgets: FormWidgetJson[] = [];
    for (const [name, list] of definitions) {
      const [first] = list;
      const path = joinPath(owner.path, name);
      if (!this.isValidPropertyName(name, path, first.pointer)) {
        continue;
      }
      const child = this.createNode(first.raw, {
        parent: owner,
        name,
        path,
        pointer: first.pointer,
        // Without a discriminator no branch is known to be active, so nothing is required.
        required: discriminator !== undefined && first.required,
        repeaterDepth: owner.repeaterDepth,
        refTrail: first.refTrail,
      });
      if (child === undefined) {
        continue;
      }
      if (
        list.some((entry) => !jsonEqual(entry.raw, first.raw) || entry.required !== first.required)
      ) {
        this.report(child, {
          severity: 'warning',
          code: 'branch-schema-conflict',
          message: `The branches define \`${name}\` differently. The form uses the first definition.`,
        });
      }
      let result = this.buildNode(child);
      if (discriminator !== undefined && list.length < union.branches.length) {
        const reference = dataReference(owner, joinPath(owner.path, discriminator.property));
        const branchValues = list.map((entry) => discriminator.values[entry.branchIndex]);
        result = withIncludeCondition(result, equalsAny(reference, branchValues));
      }
      widgets.push(...asWidgetList(result));
    }
    return widgets;
  }

  /**
   * The union of object branches of a node, `undefined` when it has none. The branches are
   * normalized once, here, and the result is cached.
   */
  private objectUnionOf(
    normalized: NormalizedNode,
    pointer: string,
    path: string,
  ): ObjectUnion | undefined {
    const cached = this.objectUnions.get(normalized.schema);
    if (cached !== undefined) {
      return cached ?? undefined;
    }
    let union: ObjectUnion | null = null;
    const keyword = (['oneOf', 'anyOf'] as const).find(
      (candidate) =>
        Array.isArray(normalized.schema[candidate]) && !isConstUnion(normalized.schema[candidate]),
    );
    if (keyword !== undefined) {
      const environment = this.environmentFor(path);
      const branches = (normalized.schema[keyword] as unknown[]).flatMap((raw, index) => {
        const branchPointer = this.pointerOf(raw) ?? appendPointer(pointer, keyword, index);
        const node = normalizeNode(raw, branchPointer, normalized.refTrail, environment);
        return node === undefined ? [] : [{ raw, pointer: branchPointer, normalized: node }];
      });
      if (branches.length > 0 && branches.every((branch) => branch.normalized.type === 'object')) {
        const discriminator = discriminatorOf(
          normalized.schema,
          branches.map((branch) => ({
            schema: branch.normalized.schema,
            ref: refOf(branch.raw),
            defName: branch.normalized.defName,
          })),
        );
        union = { keyword, branches, discriminator };
      }
    }
    this.objectUnions.set(normalized.schema, union);
    return union ?? undefined;
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
      if (!this.isValidPropertyName(name, path, pointer)) {
        continue;
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

  /** False for a name that cannot be a path segment. Warns about a name the form reads as an index. */
  private isValidPropertyName(name: string, path: string, pointer: string): boolean {
    if (name === '' || name.includes('.')) {
      this.diagnostics.push({
        severity: 'error',
        code: 'invalid-property-name',
        message: `The property name "${name}" cannot be part of a form path, so it is not rendered.`,
        path,
        pointer,
      });
      return false;
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
    return true;
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
    const pointer = this.pointerOf(raw) ?? placement.pointer;
    const normalized = normalizeNode(
      raw,
      pointer,
      placement.refTrail,
      this.environmentFor(placement.path),
    );
    if (normalized === undefined) {
      return undefined;
    }
    // A union of objects is an object, also when the schema does not say so.
    if (this.objectUnionOf(normalized, pointer, placement.path) && normalized.type === undefined) {
      normalized.type = 'object';
      normalized.schema['type'] = 'object';
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
    const objectUnion = this.objectUnions.get(node.schema);
    for (const keyword of ['oneOf', 'anyOf']) {
      const branches = node.schema[keyword];
      if (Array.isArray(branches) && !isConstUnion(branches) && objectUnion?.keyword !== keyword) {
        this.report(node, {
          severity: 'warning',
          code: 'unsupported-keyword',
          message: `\`${keyword}\` is only supported with object branches, so its branches are not rendered.`,
        });
      }
    }
    // An object compiles its conditionals when its children are built.
    if (node.type !== 'object') {
      for (const conditional of normalized.conditionals) {
        this.diagnostics.push({
          severity: 'warning',
          code: 'unsupported-keyword',
          message: `\`${conditional.kind}\` is only supported on objects, so it is not applied.`,
          path: node.path,
          pointer: conditional.pointer,
        });
      }
    }
  }

  private refTrailOf(node: SchemaNode): readonly string[] {
    return this.normalizedNodes.get(node)?.refTrail ?? [];
  }

  /** The document pointer recorded for a subschema object. */
  private pointerOf(raw: unknown): string | undefined {
    return raw !== null && typeof raw === 'object' ? this.pointers.get(raw) : undefined;
  }

  /** Normalization problems get the form data path of the node being normalized. */
  private environmentFor(path: string): NormalizeEnvironment {
    return {
      root: this.refRoot,
      maxRefDepth: this.maxRefDepth,
      pointers: this.pointers,
      report: (problem) => this.diagnostics.push({ ...problem, path }),
    };
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

/** A condition that holds when any of `conditions` holds. */
function orConditions(conditions: string[]): string {
  return conditions.length === 1
    ? conditions[0]
    : conditions.map((condition) => `(${condition})`).join(' || ');
}

/** True when the definitions include both `then` and `else` of one `if`, so one always applies. */
function coversBothSides(definitions: BranchDefinition[]): boolean {
  return definitions.some(
    (definition) =>
      definition.branch.side === 'then' &&
      definitions.some(
        (other) => other.branch.group === definition.branch.group && other.branch.side === 'else',
      ),
  );
}

/** The selector label of a branch: its title, its definition name, or its value. */
function branchTitle(branch: UnionBranch, value: unknown): string {
  const title = branch.normalized.schema['title'];
  if (typeof title === 'string' && title !== '') {
    return title;
  }
  if (branch.normalized.defName !== undefined) {
    return humanize(branch.normalized.defName);
  }
  return typeof value === 'string' ? humanize(value) : String(value);
}

function recordOf(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function requiredOf(schema: JsonSchema): unknown[] {
  return Array.isArray(schema['required']) ? schema['required'] : [];
}

function refOf(raw: unknown): string | undefined {
  const ref = recordOf(raw)['$ref'];
  return typeof ref === 'string' ? ref : undefined;
}

// Enough for schema values: they come from JSON, so key order is the only false negative.
function jsonEqual(first: unknown, second: unknown): boolean {
  return first === second || JSON.stringify(first) === JSON.stringify(second);
}

function joinPath(parent: string, segment: string): string {
  return parent === '' ? segment : `${parent}.${segment}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
