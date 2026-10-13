import { Text, useInput, useStdin, type Key } from 'ink';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { comparePaths, type FocusPath } from './path-order';

const NO_TERMINAL_MESSAGE = 'Keyboard input needs a terminal. The form is shown read-only.';

/** Receives the keys a widget gets while it holds the focus. */
export type KeyHandler = (input: string, key: Key) => void;

/** What the manager keeps for one registered widget. */
type FocusEntry = {
  path: FocusPath;
  /** A disabled widget registers as inactive, so the tab order skips it. */
  isActive: boolean;
  handleKey?: KeyHandler;
};

/** The focus API every widget of the form reads. */
export type FocusManagerApi = {
  /** The uid of the focused widget, or undefined while nothing is focused. */
  activeUid: string | undefined;
  /** False when the host has no terminal, which is when no widget may subscribe to input. */
  isInteractive: boolean;
  /**
   * Adds the widget to the registry, or updates the entry of a widget that is already there.
   * `handleKey` receives every key except Tab while the widget holds the focus.
   */
  register: (uid: string, path: FocusPath, isActive: boolean, handleKey?: KeyHandler) => void;
  /** Removes the widget. When it was focused, the focus moves on by itself. */
  unregister: (uid: string) => void;
  /** Focuses the next widget in path order, wrapping around at the end. */
  focusNext: () => void;
  /** Focuses the previous widget in path order, wrapping around at the start. */
  focusPrevious: () => void;
};

const FocusManagerContext = createContext<FocusManagerApi | null>(null);

/** Props of {@link FocusManager}. */
export type FocusManagerProps = {
  children: ReactNode;
};

/**
 * Owns the focus of one form: the registry, the focused widget, and the keyboard input.
 *
 * Ink's own focus manager orders the widgets by the order in which they registered, so a widget
 * that mounts later, for example one included by `when`, lands behind every widget that was
 * already on screen. This manager orders by the path of each widget in the tree instead, which is
 * the order the user reads.
 *
 * It renders inside the Ink tree and above the widget tree, so its mount effect runs after every
 * widget has registered and the first field of the form can take the focus.
 *
 * @param props - The widget tree of the form.
 * @returns The tree, plus one notice line when the host has no terminal.
 */
export function FocusManager({ children }: FocusManagerProps) {
  const { isRawModeSupported } = useStdin();
  const isInteractive = Boolean(isRawModeSupported);

  // The registry is a ref, not state: a widget registers in its mount effect, and the mount effect
  // of this component has to read a registry that is already complete.
  const registryRef = useRef(new Map<string, FocusEntry>());
  const [activeUid, setActiveUid] = useState<string | undefined>(undefined);
  const activeUidRef = useRef<string | undefined>(undefined);
  const hasInitialFocusRunRef = useRef(false);

  const applyActiveUid = useCallback((uid: string | undefined) => {
    activeUidRef.current = uid;
    setActiveUid(uid);
  }, []);

  const orderedEntries = useCallback((): [string, FocusEntry][] => {
    const entries = [...registryRef.current.entries()].filter(([, entry]) => entry.isActive);
    entries.sort(([leftUid, left], [rightUid, right]) => {
      const byPath = comparePaths(left.path, right.path);
      if (byPath !== 0) {
        return byPath;
      }
      // Two widgets never share a path, but a stable order keeps a bug from looking random.
      return leftUid < rightUid ? -1 : 1;
    });
    return entries;
  }, []);

  // Used when the focused widget leaves the order, so the focus lands where reading would continue.
  const findSuccessor = useCallback(
    (path: FocusPath | undefined): string | undefined => {
      const entries = orderedEntries();
      if (entries.length === 0) {
        return undefined;
      }
      if (!path) {
        return entries[0][0];
      }
      const next = entries.find(([, entry]) => comparePaths(entry.path, path) > 0);
      if (next) {
        return next[0];
      }
      return entries[entries.length - 1][0];
    },
    [orderedEntries],
  );

  const register = useCallback(
    (uid: string, path: FocusPath, isActive: boolean, handleKey?: KeyHandler) => {
      registryRef.current.set(uid, { path, isActive, handleKey });
      if (!hasInitialFocusRunRef.current || !isInteractive) {
        return;
      }
      if (!isActive && activeUidRef.current === uid) {
        applyActiveUid(findSuccessor(path));
        return;
      }
      // A form whose only focusable widget arrived late still starts focused.
      if (isActive && activeUidRef.current === undefined) {
        applyActiveUid(uid);
      }
    },
    [applyActiveUid, findSuccessor, isInteractive],
  );

  const unregister = useCallback(
    (uid: string) => {
      const entry = registryRef.current.get(uid);
      registryRef.current.delete(uid);
      if (activeUidRef.current !== uid) {
        return;
      }
      applyActiveUid(findSuccessor(entry?.path));
    },
    [applyActiveUid, findSuccessor],
  );

  const moveFocus = useCallback(
    (step: 1 | -1) => {
      const entries = orderedEntries();
      if (entries.length === 0) {
        applyActiveUid(undefined);
        return;
      }
      const currentIndex = entries.findIndex(([uid]) => uid === activeUidRef.current);
      if (currentIndex === -1) {
        applyActiveUid(step === 1 ? entries[0][0] : entries[entries.length - 1][0]);
        return;
      }
      const nextIndex = (currentIndex + step + entries.length) % entries.length;
      applyActiveUid(entries[nextIndex][0]);
    },
    [applyActiveUid, orderedEntries],
  );

  const focusNext = useCallback(() => moveFocus(1), [moveFocus]);
  const focusPrevious = useCallback(() => moveFocus(-1), [moveFocus]);

  // Effects run from the children up, so every widget of the first commit is registered by now.
  useEffect(() => {
    hasInitialFocusRunRef.current = true;
    if (!isInteractive) {
      return;
    }
    const entries = orderedEntries();
    if (entries.length > 0) {
      applyActiveUid(entries[0][0]);
    }
  }, [applyActiveUid, isInteractive, orderedEntries]);

  // The only input subscription of the form. Each key goes to the widget that is focused when the
  // key arrives, read from the ref because React may not have rendered the last focus change yet.
  // Ink calls every subscription of one key in a row, so with a subscription per widget a key that
  // moves the focus would also reach the widget it focused.
  useInput(
    (input, key) => {
      if (key.tab) {
        if (key.shift) {
          focusPrevious();
        } else {
          focusNext();
        }
        return;
      }
      const focusedUid = activeUidRef.current;
      if (focusedUid === undefined) {
        return;
      }
      registryRef.current.get(focusedUid)?.handleKey?.(input, key);
    },
    { isActive: isInteractive },
  );

  const api = useMemo<FocusManagerApi>(
    () => ({
      activeUid,
      isInteractive,
      register,
      unregister,
      focusNext,
      focusPrevious,
    }),
    [activeUid, isInteractive, register, unregister, focusNext, focusPrevious],
  );

  return (
    <FocusManagerContext.Provider value={api}>
      {children}
      {!isInteractive && <Text dimColor>{NO_TERMINAL_MESSAGE}</Text>}
    </FocusManagerContext.Provider>
  );
}

/**
 * Reads the focus API of the form.
 *
 * @returns The focus API.
 * @throws When the widget renders outside a {@link FocusManager}, which means outside a GuiForm.
 */
export function useFocusManager(): FocusManagerApi {
  const api = useContext(FocusManagerContext);
  if (!api) {
    throw new Error('An ink widget can only render inside a GuiForm.');
  }
  return api;
}
