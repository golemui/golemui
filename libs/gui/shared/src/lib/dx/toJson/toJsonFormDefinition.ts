import { collectWidgetUids } from '@golemui/core/internals';
import { isDxDefinitions, withForm, type EventRegistry } from '@golemui/dx';
import { AUTOMATIC_ROOT_UID, guiImplementation } from '../gui';
import { describeHandler, describeWidget } from './diagnosticText';
import { toNamePart, uniqueName, widgetNameForEvents } from './eventNames';
import type {
  GuiFormSource,
  JsonFormDefinition,
  JsonFormDiagnostic,
  JsonFormDiagnosticCode,
  JsonFormResult,
  JsonFormWidget,
} from './jsonFormTypes';

const FORM_SCHEMA_URL = 'https://golemui.com/schemas/form.schema.json';

// A JSON form ignores the form config, so these values move to the config of the form component.
const HOST_CONFIG_KEYS: readonly { formConfigKey: string; componentConfigKey: string }[] = [
  { formConfigKey: 'functions', componentConfigKey: 'functions' },
  { formConfigKey: 'dependencies', componentConfigKey: 'dependencies' },
  { formConfigKey: 'validateOn', componentConfigKey: 'validateOn' },
  { formConfigKey: 'itemRenderers', componentConfigKey: 'itemRenderers' },
  { formConfigKey: 'widgetLoaders', componentConfigKey: 'customWidgetLoaders' },
];

// The builder adds the path as `placeholder` to these inputs too. They have no placeholder: no
// component reads the prop, and the JSON schema of a form rejects it.
const INPUT_TYPES_WITHOUT_PLACEHOLDER: readonly unknown[] = [
  'toggle',
  'datePicker',
  'dateTimePicker',
  'timePicker',
  'rangeDatePicker',
];

// The order of the keys of a widget in the JSON form. Other keys follow, then `props` and
// `children`.
const WIDGET_KEY_ORDER: readonly string[] = [
  'kind',
  'type',
  'uid',
  'path',
  'label',
  'actionType',
  'defaultValue',
  'validator',
  'disabled',
  'readonly',
  'size',
  'include',
  'exclude',
  'on',
];

type PlainObject = Record<string, unknown>;
type AnyFunction = (...parameters: any[]) => unknown;

/** One `on` entry whose value is an event name that the builder generated for a function. */
interface EventHandlerUse {
  /** The `on` object of the widget in the JSON form. */
  on: PlainObject;
  /** The key of the entry, for example `click` or `click.register`. */
  onKey: string;
  widget: JsonFormWidget;
  /** Its message is written when the event has its final name. */
  diagnostic: JsonFormDiagnostic;
}

interface ConversionContext {
  diagnostics: JsonFormDiagnostic[];
  eventRegistry: EventRegistry;
  /** The event names that the author wrote. A generated name must differ from each of them. */
  writtenEventNames: Set<string>;
  eventHandlerUses: EventHandlerUse[];
  /** Each widget of the JSON form by its JSON Pointer. */
  widgetByPointer: Map<string, JsonFormWidget>;
}

/**
 * Converts a form written with the `gui.*` builder to a JSON form definition.
 *
 * The JSON form holds what the builder adds to the widgets: the values of the selectors, the
 * automatic labels and placeholders, the typed validators and the states of the form config. A
 * widget keeps the uid that its definition has, and the first input of a path has the path as
 * its uid. A uid that the builder generates is not written. When two widgets would have the same
 * uid, one of them gets another uid or none, with a diagnostic.
 *
 * JSON cannot hold a function. Each function of the form gives one diagnostic that says where it
 * was and what the JSON form holds in its place:
 *
 * - An event handler becomes an event name, for example `on: { click: 'save_click' }`. The host
 *   handles that event in the `formEvent` handler of the form component.
 * - A widget that is a callback becomes the result of one call with an empty form.
 * - A display widget that is a render function is left out.
 * - Any other function value is left out.
 *
 * The values `functions`, `dependencies`, `validateOn`, `itemRenderers` and `widgetLoaders` of
 * the form config are not part of a JSON form. Each gives one diagnostic.
 *
 * The function builds the form in the same way as a form component does, so it calls each
 * widget callback one time and each event handler that has no parameters one time. It does not
 * check the result with the JSON schema of a form: a value that the builder accepts and the
 * schema rejects stays in the JSON form.
 *
 * @param source - The `formDef`, the `formSelectors` and the `formConfig` of the form.
 * @returns The JSON form definition, and one diagnostic for each thing that the JSON form does
 *   not hold in the same way as the form that the builder gives.
 * @throws TypeError when `formDef` is not built with `gui.*`, for example a JSON form.
 *
 * @example
 * const { formDefinition, diagnostics } = toJsonFormDefinition({
 *   formDef: [
 *     gui.inputs.textInput('email', { validator: { required: true } }),
 *     gui.actions.button({ uid: 'save', label: 'Save', onClick: (data) => save(data) }),
 *   ],
 * });
 * // formDefinition.form[1].on is { click: 'save_click' }
 * // diagnostics[0] is { severity: 'warning', code: 'event-handler', pointer: '/form/1/on/click', ... }
 * writeFileSync('form.json', JSON.stringify(formDefinition, null, 2));
 */
export function toJsonFormDefinition(source: GuiFormSource): JsonFormResult {
  const { formDef, formSelectors, formConfig } = source;
  if (!isDxDefinitions(formDef)) {
    throw new TypeError(
      '[GolemUI] toJsonFormDefinition takes a form that is built with gui.*: an array of ' +
        'gui.* widgets, or one gui.* widget. This `formDef` is not one.',
    );
  }

  const parts = guiImplementation.formDefs.buildFormParts(formDef, formSelectors, formConfig, {
    omitGeneratedUids: true,
  });
  const context: ConversionContext = {
    diagnostics: [],
    eventRegistry: parts.eventRegistry,
    writtenEventNames: new Set(),
    eventHandlerUses: [],
    widgetByPointer: new Map(),
  };

  const states = convertStates(parts.form.states, context);
  const hasAutomaticRoot = parts.formConfig.suppressAutomaticStack !== true;
  const form = convertRoot(parts.form.form, hasAutomaticRoot, context);
  const formDefinition: JsonFormDefinition = {
    $schema: FORM_SCHEMA_URL,
    ...(states === undefined ? {} : { states }),
    form,
  };

  nameEventHandlers(context);
  resolveRepeatedUids(formDefinition, context);
  reportHostConfig(parts.formConfig as PlainObject, context);

  return { formDefinition, diagnostics: context.diagnostics };
}

// --------------------------------
// States and root
// --------------------------------

function convertStates(
  states: unknown,
  context: ConversionContext,
): Record<string, string> | undefined {
  if (!isPlainObject(states) || Object.keys(states).length === 0) {
    return undefined;
  }
  return toJsonValue(states, '/states', 'states', 'form', context) as
    | Record<string, string>
    | undefined;
}

/**
 * The `form` array of a JSON form has no props: the form puts its widgets in a default grid. So
 * the children of a default root grid become the array, and any other root stays as one widget.
 */
function convertRoot(
  root: unknown,
  hasAutomaticRoot: boolean,
  context: ConversionContext,
): JsonFormWidget[] {
  const rootSource = isFunction(root)
    ? callWidgetCallback(root, '/form/0', '/form', 0, context)
    : root;
  if (!isPlainObject(rootSource)) {
    return [];
  }
  if (isDefaultRootGrid(rootSource, hasAutomaticRoot)) {
    return convertWidgets(rootSource['children'] as unknown[], '/form', context);
  }

  if (rootSource['kind'] === 'layout') {
    context.diagnostics.push({
      severity: 'info',
      code: 'root-layout',
      message:
        'The root layout of the form has values that the `form` array of a JSON form cannot ' +
        'hold. The JSON form keeps the layout as the one widget of `form`.',
      pointer: '/form/0',
    });
  }
  const rootWidget = convertWidgetObject(rootSource, '/form/0', context);
  if (hasAutomaticRoot && rootWidget.uid === AUTOMATIC_ROOT_UID) {
    delete rootWidget.uid;
  }
  return [rootWidget];
}

function isDefaultRootGrid(root: PlainObject, hasAutomaticRoot: boolean): boolean {
  if (root['kind'] !== 'layout' || root['type'] !== 'grid' || !Array.isArray(root['children'])) {
    return false;
  }
  const uid = root['uid'];
  const hasWrittenUid =
    uid !== undefined && uid !== '' && !(hasAutomaticRoot && uid === AUTOMATIC_ROOT_UID);
  if (hasWrittenUid) {
    return false;
  }
  const keysOfEveryGrid = ['kind', 'type', 'uid', 'props', 'children'];
  for (const [key, value] of Object.entries(root)) {
    if (value !== undefined && !keysOfEveryGrid.includes(key)) {
      return false;
    }
  }
  const props = root['props'];
  if (props === undefined) {
    return true;
  }
  if (!isPlainObject(props)) {
    return false;
  }
  return Object.entries(props).every(
    ([key, value]) => value === undefined || (key === 'direction' && value === 'column'),
  );
}

// --------------------------------
// Widgets
// --------------------------------

function convertWidgets(
  widgets: readonly unknown[],
  arrayPointer: string,
  context: ConversionContext,
): JsonFormWidget[] {
  const converted: JsonFormWidget[] = [];
  widgets.forEach((widget, sourceIndex) => {
    // A widget that is left out takes no index, so the pointer counts the converted widgets.
    const pointer = `${arrayPointer}/${converted.length}`;
    const convertedWidget = convertWidget(widget, pointer, arrayPointer, sourceIndex, context);
    if (convertedWidget !== undefined) {
      converted.push(convertedWidget);
    }
  });
  return converted;
}

/**
 * @param containerPointer - The pointer of the array or the object that holds the widget. A
 *   diagnostic about a widget that is left out uses it.
 * @param sourceIndex - The index of the widget in its list in the `gui.*` form.
 */
function convertWidget(
  widget: unknown,
  pointer: string,
  containerPointer: string,
  sourceIndex: number,
  context: ConversionContext,
): JsonFormWidget | undefined {
  const widgetSource = isFunction(widget)
    ? callWidgetCallback(widget, pointer, containerPointer, sourceIndex, context)
    : widget;
  if (widgetSource === undefined) {
    return undefined;
  }
  if (!isPlainObject(widgetSource)) {
    context.diagnostics.push({
      severity: 'error',
      code: 'not-json-value',
      message: `The widget at position ${sourceIndex + 1} of its list is ${describeValue(widgetSource)}, not a widget object. It is left out.`,
      pointer: containerPointer,
    });
    return undefined;
  }
  return convertWidgetObject(widgetSource, pointer, context);
}

function callWidgetCallback(
  widgetCallback: AnyFunction,
  pointer: string,
  containerPointer: string,
  sourceIndex: number,
  context: ConversionContext,
): PlainObject | undefined {
  const position = `The widget at position ${sourceIndex + 1} of its list`;
  let widget: unknown;
  try {
    // The values that core gives a widget callback when it decodes a form.
    widget = widgetCallback(withForm());
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    context.diagnostics.push({
      severity: 'error',
      code: 'callback-failed',
      message: `${position} is a callback, and the callback threw when it was called with an empty form: ${reason}. The widget is left out.`,
      pointer: containerPointer,
    });
    return undefined;
  }
  if (!isPlainObject(widget)) {
    context.diagnostics.push({
      severity: 'error',
      code: 'callback-failed',
      message: `${position} is a callback, and the callback returned no widget object. The widget is left out.`,
      pointer: containerPointer,
    });
    return undefined;
  }
  if (widget['kind'] === 'display' && widget['type'] === 'renderer') {
    context.diagnostics.push({
      severity: 'error',
      code: 'render-function',
      message: `${position} is a render function, and JSON cannot hold a function. The widget is left out. Register a custom display widget, and add it to the JSON form by its type.`,
      pointer: containerPointer,
    });
    return undefined;
  }
  context.diagnostics.push({
    severity: 'warning',
    code: 'callback-widget',
    message: `The ${describeWidget(widget)} is a callback, and JSON cannot hold a function. The JSON form holds the result of one call with an empty form. Use a template ({{ }}), a \`when\` rule or a state for each value that the callback computes from the form data.`,
    pointer,
  });
  return widget;
}

function convertWidgetObject(
  widgetSource: PlainObject,
  pointer: string,
  context: ConversionContext,
): JsonFormWidget {
  const owner = describeWidget(widgetSource);
  const widget = {} as JsonFormWidget;
  context.widgetByPointer.set(pointer, widget);

  for (const key of orderedWidgetKeys(widgetSource)) {
    const value = widgetSource[key];
    // The builder writes an empty uid for a widget that has none.
    if (key === 'uid' && value === '') {
      continue;
    }
    if (key === 'on' && isPlainObject(value)) {
      const on = convertOn(value, `${pointer}/on`, widget, owner, context);
      if (Object.keys(on).length > 0) {
        widget['on'] = on;
      }
      continue;
    }
    const converted = toJsonValue(value, `${pointer}/${pointerPart(key)}`, key, owner, context);
    if (converted !== undefined) {
      widget[key] = converted;
    }
  }

  const props = widgetSource['props'];
  if (isPlainObject(props)) {
    const convertedProps = convertProps(widgetSource, props, `${pointer}/props`, owner, context);
    // The builder writes an empty `props` object for some widgets. It has no effect.
    if (Object.keys(convertedProps).length > 0) {
      widget.props = convertedProps;
    }
  } else {
    const convertedProps = toJsonValue(props, `${pointer}/props`, 'props', owner, context);
    if (convertedProps !== undefined) {
      (widget as PlainObject)['props'] = convertedProps;
    }
  }

  const children = widgetSource['children'];
  if (Array.isArray(children)) {
    widget.children = convertWidgets(children, `${pointer}/children`, context);
  } else {
    const convertedChildren = toJsonValue(
      children,
      `${pointer}/children`,
      'children',
      owner,
      context,
    );
    if (convertedChildren !== undefined) {
      (widget as PlainObject)['children'] = convertedChildren;
    }
  }

  return widget;
}

function orderedWidgetKeys(widgetSource: PlainObject): string[] {
  const rankOf = (key: string): number => {
    // A key with a state suffix, such as `label.register`, stays next to its base key.
    const baseKey = key.split('.')[0];
    const rank = WIDGET_KEY_ORDER.indexOf(baseKey);
    return rank < 0 ? WIDGET_KEY_ORDER.length : rank;
  };
  return Object.keys(widgetSource)
    .filter((key) => key !== 'props' && key !== 'children')
    .map((key, index) => ({ key, rank: rankOf(key), index }))
    .sort((first, second) => first.rank - second.rank || first.index - second.index)
    .map((entry) => entry.key);
}

function convertProps(
  widgetSource: PlainObject,
  props: PlainObject,
  propsPointer: string,
  owner: string,
  context: ConversionContext,
): PlainObject {
  const isInput = widgetSource['kind'] === 'input';
  const isRepeater = isInput && widgetSource['type'] === 'repeater';
  const hasNoPlaceholder =
    isInput && INPUT_TYPES_WITHOUT_PLACEHOLDER.includes(widgetSource['type']);
  const convertedProps: PlainObject = {};
  for (const [key, value] of Object.entries(props)) {
    if (key === 'placeholder' && hasNoPlaceholder) {
      continue;
    }
    const valuePointer = `${propsPointer}/${pointerPart(key)}`;
    // The template of a repeater is a layout widget, and its children can be callbacks.
    const isRepeaterTemplate = isRepeater && (key === 'template' || key.startsWith('template.'));
    if (isRepeaterTemplate && (isPlainObject(value) || isFunction(value))) {
      const template = convertWidget(value, valuePointer, propsPointer, 0, context);
      if (template !== undefined) {
        convertedProps[key] = template;
      }
      continue;
    }
    const converted = toJsonValue(value, valuePointer, `props.${key}`, owner, context);
    if (converted !== undefined) {
      convertedProps[key] = converted;
    }
  }
  return convertedProps;
}

// --------------------------------
// Events
// --------------------------------

function convertOn(
  onSource: PlainObject,
  onPointer: string,
  widget: JsonFormWidget,
  owner: string,
  context: ConversionContext,
): PlainObject {
  const on: PlainObject = {};
  for (const [onKey, value] of Object.entries(onSource)) {
    const valuePointer = `${onPointer}/${pointerPart(onKey)}`;
    if (typeof value !== 'string') {
      const converted = toJsonValue(value, valuePointer, `on.${onKey}`, owner, context);
      if (converted !== undefined) {
        on[onKey] = converted;
      }
      continue;
    }
    on[onKey] = value;
    if (!context.eventRegistry.has(value)) {
      context.writtenEventNames.add(value);
      continue;
    }
    // The registry holds the handler function under a generated name. The final name needs
    // every written event name of the form, so `nameEventHandlers` writes it later.
    const diagnostic: JsonFormDiagnostic = {
      severity: 'warning',
      code: 'event-handler',
      message: '',
      pointer: valuePointer,
    };
    context.diagnostics.push(diagnostic);
    context.eventHandlerUses.push({ on, onKey, widget, diagnostic });
  }
  return on;
}

/**
 * Replaces each generated event name with a name made of the widget and the event, for example
 * `save_click`. The generated name is a counter, so it changes when a widget is added before it.
 */
function nameEventHandlers(context: ConversionContext): void {
  const takenNames = new Set(context.writtenEventNames);
  const nameByGeneratedName = new Map<string, string>();
  for (const use of context.eventHandlerUses) {
    const generatedName = use.on[use.onKey] as string;
    let eventName = nameByGeneratedName.get(generatedName);
    if (eventName === undefined) {
      const baseName = `${widgetNameForEvents(use.widget)}_${toNamePart(use.onKey)}`;
      eventName = uniqueName(baseName, takenNames);
      takenNames.add(eventName);
      nameByGeneratedName.set(generatedName, eventName);
    }
    use.on[use.onKey] = eventName;
    use.diagnostic.message = `The ${describeHandler(use.onKey, use.widget)} is a function, and JSON cannot hold a function. The JSON form holds the event name "${eventName}". Handle this event in the formEvent handler of the form component.`;
  }
}

// --------------------------------
// Uids
// --------------------------------

/**
 * Two widgets of a form cannot have the same uid: the form does not start. The form of the
 * builder avoids that in two cases where a JSON form does not:
 *
 * - The builder replaces the uid of every action with a generated one. So the uid that the
 *   definition of an action has can be the uid of another widget.
 * - The builder gives the second input of a path a generated uid. A JSON form derives
 *   `<path>-<type>` for an input without a uid, so two such inputs get the same uid.
 */
function resolveRepeatedUids(formDefinition: JsonFormDefinition, context: ConversionContext): void {
  const uidEntries = collectWidgetUids(formDefinition);
  const everyUid = new Set(uidEntries.map((entry) => entry.uid));
  // The form keeps the widgets of one repeater depth in one map, so a uid repeats only there.
  const usedUidsByDepth = new Map<number, Set<string>>();
  const usedUidsOf = (repeaterDepth: number): Set<string> => {
    let usedUids = usedUidsByDepth.get(repeaterDepth);
    if (usedUids === undefined) {
      usedUids = new Set();
      usedUidsByDepth.set(repeaterDepth, usedUids);
    }
    return usedUids;
  };
  const isWrittenUidOfAction = (entry: (typeof uidEntries)[number]): boolean =>
    entry.origin === 'written' && context.widgetByPointer.get(entry.pointer)?.kind === 'action';

  // First the uids that stay as they are, so an action or a derived uid never takes one of them.
  for (const entry of uidEntries) {
    if (entry.origin !== 'derived' && !isWrittenUidOfAction(entry)) {
      usedUidsOf(entry.repeaterDepth).add(entry.uid);
    }
  }

  for (const entry of uidEntries) {
    if (!isWrittenUidOfAction(entry)) {
      continue;
    }
    const usedUids = usedUidsOf(entry.repeaterDepth);
    const widget = context.widgetByPointer.get(entry.pointer);
    if (!usedUids.has(entry.uid) || widget === undefined) {
      usedUids.add(entry.uid);
      continue;
    }
    delete widget.uid;
    context.diagnostics.push({
      severity: 'info',
      code: 'repeated-uid',
      message: `Another widget also has the uid "${entry.uid}", and two widgets of a JSON form cannot have the same uid. The JSON form writes no uid for this ${widget.type}.`,
      pointer: entry.pointer,
    });
  }

  for (const entry of uidEntries) {
    if (entry.origin !== 'derived') {
      continue;
    }
    const usedUids = usedUidsOf(entry.repeaterDepth);
    const widget = context.widgetByPointer.get(entry.pointer);
    if (!usedUids.has(entry.uid) || widget === undefined) {
      usedUids.add(entry.uid);
      continue;
    }
    const writtenUid = uniqueName(entry.uid, everyUid);
    everyUid.add(writtenUid);
    usedUids.add(writtenUid);
    writeUid(widget, writtenUid);
    context.diagnostics.push({
      severity: 'info',
      code: 'repeated-uid',
      message: `A JSON form derives the uid "${entry.uid}" for this input from its path and its type, and another widget already has that uid. The JSON form gives this input the uid "${writtenUid}".`,
      pointer: entry.pointer,
    });
  }
}

/** Adds a uid to a widget at its place in the key order. A new key of an object goes to its end. */
function writeUid(widget: JsonFormWidget, uid: string): void {
  const widgetWithUid: PlainObject = { ...widget, uid };
  for (const key of Object.keys(widget)) {
    delete widget[key];
  }
  for (const key of orderedWidgetKeys(widgetWithUid)) {
    widget[key] = widgetWithUid[key];
  }
  for (const key of ['props', 'children']) {
    if (key in widgetWithUid) {
      widget[key] = widgetWithUid[key];
    }
  }
}

// --------------------------------
// Form config
// --------------------------------

function reportHostConfig(formConfig: PlainObject, context: ConversionContext): void {
  for (const { formConfigKey, componentConfigKey } of HOST_CONFIG_KEYS) {
    // The builder also forwards a value of the form config only when it is set.
    if (!formConfig[formConfigKey]) {
      continue;
    }
    context.diagnostics.push({
      severity: 'warning',
      code: 'host-config',
      message: `\`formConfig.${formConfigKey}\` is not part of a JSON form, and a form component ignores the form config of a JSON form. Pass the same value as \`${componentConfigKey}\` in the config of the form component.`,
      pointer: '',
    });
  }
}

// --------------------------------
// Values
// --------------------------------

/**
 * Converts one value to a JSON value. A value that JSON cannot hold gives a diagnostic. It is
 * left out of an object, and it becomes `null` in an array, so the other entries keep their index.
 *
 * @returns The JSON value, or `undefined` for a value that is left out.
 * @param keyPath - The place of the value inside its widget, for the message. For example
 *   `props.items[2].label`.
 * @param owner - The description of the widget, or `form`.
 */
function toJsonValue(
  value: unknown,
  pointer: string,
  keyPath: string,
  owner: string,
  context: ConversionContext,
  isArrayEntry = false,
  ancestors: Set<object> = new Set(),
): unknown {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const report = (
    code: JsonFormDiagnosticCode,
    sentences: string[],
    description = describeValue(value),
  ): void => {
    context.diagnostics.push({
      severity: 'warning',
      code,
      message: [`The value \`${keyPath}\` of the ${owner} is ${description}.`, ...sentences].join(
        ' ',
      ),
      pointer,
    });
  };
  const whatTheJsonHolds = isArrayEntry
    ? 'JSON cannot hold it, so the JSON form holds null in its place.'
    : 'JSON cannot hold it, so the value is left out.';

  if (typeof value === 'function') {
    const advice = keyPath.startsWith('validator')
      ? 'Use a validator object, a state that sets another validator, or a custom validator.'
      : 'Use a template ({{ }}), a `when` rule or a state.';
    report('function-value', [whatTheJsonHolds, advice]);
    return undefined;
  }
  if (typeof value !== 'object') {
    // A number that is not finite, a bigint or a symbol.
    report('not-json-value', [whatTheJsonHolds]);
    return undefined;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const dateText = value.toISOString();
    report('not-json-value', [`The JSON form holds the string "${dateText}".`]);
    return dateText;
  }
  if (ancestors.has(value)) {
    report('not-json-value', [whatTheJsonHolds], 'an object that contains itself');
    return undefined;
  }

  if (Array.isArray(value)) {
    ancestors.add(value);
    // Array.from also visits the empty places of an array. `map` skips them.
    const convertedArray = Array.from(value, (entry: unknown, index) => {
      const converted = toJsonValue(
        entry,
        `${pointer}/${index}`,
        `${keyPath}[${index}]`,
        owner,
        context,
        true,
        ancestors,
      );
      return converted === undefined ? null : converted;
    });
    ancestors.delete(value);
    return convertedArray;
  }
  if (!isPlainObject(value)) {
    report('not-json-value', [whatTheJsonHolds]);
    return undefined;
  }

  ancestors.add(value);
  const convertedObject: PlainObject = {};
  for (const [key, entry] of Object.entries(value)) {
    const converted = toJsonValue(
      entry,
      `${pointer}/${pointerPart(key)}`,
      `${keyPath}.${key}`,
      owner,
      context,
      false,
      ancestors,
    );
    if (converted !== undefined) {
      convertedObject[key] = converted;
    }
  }
  ancestors.delete(value);
  return convertedObject;
}

function describeValue(value: unknown): string {
  if (typeof value === 'function') {
    return 'a function';
  }
  if (typeof value === 'number') {
    return `the number ${String(value)}`;
  }
  if (typeof value === 'bigint' || typeof value === 'symbol') {
    return `a ${typeof value}`;
  }
  if (value === null || typeof value !== 'object') {
    return `the value ${String(value)}`;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? 'a Date that is not valid' : 'a Date';
  }
  if (Array.isArray(value)) {
    return 'an array';
  }
  if (isPlainObject(value)) {
    return 'an object';
  }
  const constructorName = (value as { constructor?: { name?: string } }).constructor?.name;
  return constructorName ? `an instance of ${constructorName}` : 'an object that is not plain';
}

function isFunction(value: unknown): value is AnyFunction {
  return typeof value === 'function';
}

function isPlainObject(value: unknown): value is PlainObject {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/** Escapes a key as one part of a JSON Pointer (RFC 6901). */
function pointerPart(key: string): string {
  return key.replace(/~/g, '~0').replace(/\//g, '~1');
}
