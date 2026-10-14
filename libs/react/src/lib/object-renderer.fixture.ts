import { act, createContext, type ReactNode } from 'react';
import createReconciler, { type ReactContext } from 'react-reconciler';
import {
  ConcurrentRoot,
  DefaultEventPriority,
  LegacyRoot,
  NoEventPriority,
} from 'react-reconciler/constants';

/**
 * A test-only React renderer that renders into plain objects, not into DOM nodes.
 *
 * The headless specs use it as a host without a DOM. It runs effects like any other host,
 * and a spec reads the rendered elements and calls their handler props directly.
 */

/** A host element: its type, its props without `children`, and its rendered children. */
export interface ObjectElement {
  type: string;
  props: Record<string, any>;
  children: ObjectNode[];
}

export interface ObjectText {
  text: string;
}

export type ObjectNode = ObjectElement | ObjectText;

interface ObjectContainer {
  children: ObjectNode[];
}

/** The two root types a React host can create. A host chooses one, so the specs run in both. */
export type RootKind = 'legacy' | 'concurrent';

export interface ObjectRender {
  /** Every rendered element of the given type, in tree order. */
  findAllByType: (type: string) => ObjectElement[];
  /** The only rendered element of the given type. Throws when there is none or more than one. */
  findByType: (type: string) => ObjectElement;
  /** The types of all rendered elements. */
  hostTypes: () => Set<string>;
  /** Runs a callback inside `act`, so the updates it causes are committed when it resolves. */
  act: (callback: () => void) => Promise<void>;
  unmount: () => Promise<void>;
}

type Props = Record<string, any>;

function propsWithoutChildren(props: Props): Props {
  const copy = { ...props };
  delete copy['children'];
  return copy;
}

function removeNode(parent: { children: ObjectNode[] }, child: ObjectNode) {
  const index = parent.children.indexOf(child);
  if (index !== -1) {
    parent.children.splice(index, 1);
  }
}

// React moves an existing child by appending or inserting it again, so remove it first.
function appendNode(parent: { children: ObjectNode[] }, child: ObjectNode) {
  removeNode(parent, child);
  parent.children.push(child);
}

function insertNodeBefore(
  parent: { children: ObjectNode[] },
  child: ObjectNode,
  beforeChild: ObjectNode,
) {
  removeNode(parent, child);
  parent.children.splice(parent.children.indexOf(beforeChild), 0, child);
}

function createObjectReconciler() {
  let currentUpdatePriority: number = NoEventPriority;
  const sharedHostContext = {};

  return createReconciler({
    supportsMutation: true,
    supportsPersistence: false,
    supportsHydration: false,
    isPrimaryRenderer: true,
    // Makes React warn about an update outside `act`, which the specs would then miss.
    warnsIfNotActing: true,
    rendererPackageName: 'golemui-object-renderer',
    rendererVersion: '0.0.0',
    extraDevToolsConfig: null,
    bindToConsole: (methodName: string, args: unknown[]) => {
      const method = console[methodName as keyof Console] as (...values: unknown[]) => void;
      return method.bind(console, ...args);
    },

    createInstance: (type: string, props: Props): ObjectElement => ({
      type,
      props: propsWithoutChildren(props),
      children: [],
    }),
    createTextInstance: (text: string): ObjectText => ({ text }),
    appendInitialChild: appendNode,
    appendChild: appendNode,
    appendChildToContainer: appendNode,
    insertBefore: insertNodeBefore,
    insertInContainerBefore: insertNodeBefore,
    removeChild: removeNode,
    removeChildFromContainer: removeNode,
    clearContainer: (container: ObjectContainer) => {
      container.children.splice(0);
    },
    // @ts-expect-error The 0.31 types still list the React 18 parameters with `updatePayload`.
    commitUpdate: (instance: ObjectElement, _type: string, _oldProps: Props, newProps: Props) => {
      instance.props = propsWithoutChildren(newProps);
    },
    commitTextUpdate: (textInstance: ObjectText, _oldText: string, newText: string) => {
      textInstance.text = newText;
    },
    resetTextContent: () => undefined,
    finalizeInitialChildren: () => false,
    shouldSetTextContent: () => false,
    // React treats a null host context as missing, so every element shares one empty object.
    getRootHostContext: () => sharedHostContext,
    getChildHostContext: (parentHostContext: object) => parentHostContext,
    getPublicInstance: (instance: ObjectElement | ObjectText) => instance,
    prepareForCommit: () => null,
    resetAfterCommit: () => undefined,
    preparePortalMount: () => undefined,
    detachDeletedInstance: () => undefined,

    scheduleTimeout: setTimeout,
    cancelTimeout: clearTimeout,
    noTimeout: -1,
    supportsMicrotasks: true,
    scheduleMicrotask: queueMicrotask,
    setCurrentUpdatePriority: (newPriority: number) => {
      currentUpdatePriority = newPriority;
    },
    getCurrentUpdatePriority: () => currentUpdatePriority,
    resolveUpdatePriority: () =>
      currentUpdatePriority === NoEventPriority ? DefaultEventPriority : currentUpdatePriority,

    // Not used by these specs: events, scopes, transitions, form actions and suspended commits.
    getInstanceFromNode: () => null,
    beforeActiveInstanceBlur: () => undefined,
    afterActiveInstanceBlur: () => undefined,
    prepareScopeUpdate: () => undefined,
    getInstanceFromScope: () => null,
    NotPendingTransition: null,
    // The public context type of @types/react hides the internal fields the reconciler type lists.
    HostTransitionContext: createContext(null) as unknown as ReactContext<null>,
    resetFormInstance: () => undefined,
    requestPostPaintCallback: () => undefined,
    shouldAttemptEagerTransition: () => false,
    resolveEventType: () => null,
    // React's value for "no event timestamp".
    resolveEventTimeStamp: () => -1.1,
    maySuspendCommit: () => false,
    preloadInstance: () => true,
    startSuspendingCommit: () => null,
    suspendInstance: () => undefined,
    waitForCommitToBeReady: () => null,
  });
}

// Created on first use, so a REACT18=1 run that only imports this file never builds a
// React 19 reconciler on top of React 18.
let objectReconciler: ReturnType<typeof createObjectReconciler> | undefined;

function collectElements(nodes: ObjectNode[], found: ObjectElement[] = []): ObjectElement[] {
  for (const node of nodes) {
    if ('type' in node) {
      found.push(node);
      collectElements(node.children, found);
    }
  }
  return found;
}

/**
 * Renders an element into plain objects and commits the first render and its effects.
 *
 * @param element - The element to render.
 * @param rootKind - The root type. Defaults to `legacy`.
 * @returns Queries over the rendered elements, `act` and `unmount`.
 * @example
 * const rendered = await renderToObjects(<FormComponent headless {...props} />);
 * await rendered.act(() => rendered.findByType('stub-button').props.onPress());
 */
export async function renderToObjects(
  element: ReactNode,
  rootKind: RootKind = 'legacy',
): Promise<ObjectRender> {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  objectReconciler ??= createObjectReconciler();
  const reconciler = objectReconciler;

  const container: ObjectContainer = { children: [] };
  // An error that no error boundary caught fails the next `act` call of the spec.
  const uncaughtErrors: unknown[] = [];
  // The 0.31 types still list the React 18 parameters. The 0.31 runtime takes three error
  // callbacks after `identifierPrefix`, then `transitionCallbacks`.
  const createContainer = reconciler.createContainer as (
    ...args: unknown[]
  ) => ReturnType<typeof reconciler.createContainer>;
  const root = createContainer(
    container,
    rootKind === 'legacy' ? LegacyRoot : ConcurrentRoot,
    null,
    false,
    null,
    '',
    (error: unknown) => uncaughtErrors.push(error),
    // The widget and form boundaries log what they catch.
    () => undefined,
    (error: unknown) => console.error('Recoverable error in the object renderer:', error),
    null,
  );

  const runInAct = async (callback: () => void) => {
    await act(async () => {
      callback();
    });
    if (uncaughtErrors.length > 0) {
      throw uncaughtErrors[0];
    }
  };

  const findAllByType = (type: string) =>
    collectElements(container.children).filter((found) => found.type === type);

  await runInAct(() => {
    reconciler.updateContainer(element, root, null, null);
  });

  return {
    findAllByType,
    findByType: (type) => {
      const found = findAllByType(type);
      if (found.length !== 1) {
        throw new Error(`Expected one "${type}" element, found ${found.length}.`);
      }
      return found[0];
    },
    hostTypes: () => new Set(collectElements(container.children).map((found) => found.type)),
    act: runInAct,
    unmount: () =>
      runInAct(() => {
        reconciler.updateContainer(null, root, null, null);
      }),
  };
}
