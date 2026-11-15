const REPEATER_CARD_CLASS = 'gui-repeater__main-card';
const ROW_CARD_CLASS = 'gui-repeater__card';
const ADD_BUTTON_CLASS = 'gui-repeater__add-btn';
const REMOVE_BUTTON_CLASS = 'gui-repeater__remove-btn';

/** One element on the way from a row card to the focused element. */
interface FocusPathStep {
  /** The key of the element, see `elementKey`. */
  key: string;
  /** The position among the elements with the same key in the scope of the step. */
  position: number;
}

/**
 * @internal Used by framework Repeater components, not part of the end-user public API.
 *
 * The place of the focus inside a row of a repeater, read before the update removes that row.
 */
export interface RepeaterRowFocus {
  /** The element that had the focus. */
  focusedElement: Element;
  /** The index of the row that holds the focused element. */
  rowIndex: number;
  /** The way from the row card to the focused element, to find the same element in another row. */
  path: readonly FocusPathStep[];
}

/** The row cards of a repeater, in order. A nested repeater has its own row cards deeper inside. */
function rowCards(repeaterCard: Element): Element[] {
  return Array.from(repeaterCard.children).filter((child) =>
    child.classList.contains(ROW_CARD_CLASS),
  );
}

function isRowCard(element: Element): boolean {
  return (
    element.classList.contains(ROW_CARD_CLASS) &&
    element.parentElement?.classList.contains(REPEATER_CARD_CLASS) === true
  );
}

function isRemoveButton(element: Element): boolean {
  return element.classList.contains(REMOVE_BUTTON_CLASS);
}

/**
 * The focused element in the tree of `element`. For an element inside a shadow root,
 * `document.activeElement` is the outermost shadow host.
 */
function activeElementInTree(element: Element): Element | null {
  // The DOM of a server render can lack `getRootNode` and `activeElement`.
  if (typeof element.getRootNode !== 'function') {
    return null;
  }
  const root = element.getRootNode() as Partial<DocumentOrShadowRoot>;
  return root.activeElement ?? null;
}

/**
 * The uid of a widget in a row ends with the row indexes, for example `name[2]` or `name[0][2]`,
 * and the ids and `data-cy` values of the widget contain that uid. Without the indexes, they are
 * the same in every row.
 */
function withoutRowIndexes(value: string): string {
  return value.replace(/\[\d+\]/g, '[]');
}

/**
 * The key of an element that is the same in every row, or `undefined` when only the tag name and
 * the position can find the element.
 */
function rowIndependentKey(element: Element): string | undefined {
  const parent = element.parentElement;
  if (parent !== null && isRowCard(element)) {
    // The key of the repeater card tells the nested repeaters apart.
    return `row of ${elementKey(parent)}`;
  }
  const id = element.getAttribute('id');
  const dataCy = element.getAttribute('data-cy');
  if (!id && !dataCy) {
    return undefined;
  }
  return `${element.localName}#${withoutRowIndexes(id ?? '')}|${withoutRowIndexes(dataCy ?? '')}`;
}

// The Add and Remove buttons have no id and no `data-cy`. Only the class tells them apart.
function repeaterButtonClass(element: Element): string {
  if (element.classList.contains(ADD_BUTTON_CLASS)) {
    return `.${ADD_BUTTON_CLASS}`;
  }
  if (isRemoveButton(element)) {
    return `.${REMOVE_BUTTON_CLASS}`;
  }
  return '';
}

function elementKey(element: Element): string {
  return rowIndependentKey(element) ?? `${element.localName}${repeaterButtonClass(element)}`;
}

/**
 * The matching elements inside `scope`, in document order. The walk visits the row cards of a
 * nested repeater but does not enter them, so a position never counts the elements of other rows.
 */
function elementsInScope(scope: Element, matches: (element: Element) => boolean): Element[] {
  const found: Element[] = [];
  const visit = (parent: Element) => {
    for (const child of Array.from(parent.children)) {
      if (matches(child)) {
        found.push(child);
      }
      if (!isRowCard(child)) {
        visit(child);
      }
    }
  };
  visit(scope);
  return found;
}

/**
 * The path has a step for each element between the row card and the focused element that has a
 * row-independent key, and a last step for the focused element. A position counts only the
 * elements with the same key, so a widget that one row hides and another row shows does not move
 * the other steps.
 */
function pathInRow(rowCard: Element, focusedElement: Element): FocusPathStep[] {
  const stepElements: Element[] = [];
  for (
    let element: Element | null = focusedElement;
    element !== null && element !== rowCard;
    element = element.parentElement
  ) {
    if (element === focusedElement || rowIndependentKey(element) !== undefined) {
      stepElements.unshift(element);
    }
  }

  let scope = rowCard;
  return stepElements.map((element) => {
    const key = elementKey(element);
    const position = elementsInScope(scope, (candidate) => elementKey(candidate) === key).indexOf(
      element,
    );
    scope = element;
    return { key, position };
  });
}

function findByPath(rowCard: Element, path: readonly FocusPathStep[]): Element | undefined {
  let scope: Element | undefined = rowCard;
  for (const step of path) {
    scope = elementsInScope(scope, (candidate) => elementKey(candidate) === step.key)[
      step.position
    ];
    if (scope === undefined) {
      return undefined;
    }
  }
  return scope;
}

/**
 * The elements in the tab order of the browser, before a check that they can take the focus. The
 * next Space or Enter on a Remove button removes a row, so a Remove button is never a candidate.
 */
function fallbackCandidates(scope: Element): Element[] {
  return Array.from(scope.querySelectorAll('*')).filter(
    (element) => (element as HTMLElement).tabIndex >= 0 && !isRemoveButton(element),
  );
}

/**
 * Only the browser knows if an element can take the focus: a disabled control, a hidden element
 * or an inert element cannot. So each candidate gets the focus until one keeps it.
 */
function focusFirstThatTakesFocus(candidates: Element[]): HTMLElement | null {
  for (const candidate of candidates) {
    const element = candidate as HTMLElement;
    if (typeof element.focus !== 'function') {
      continue;
    }
    element.focus();
    if (activeElementInTree(element) === element) {
      return element;
    }
  }
  return null;
}

/**
 * @internal Used by framework Repeater components, not part of the end-user public API.
 *
 * Finds the place of the focus when the next update removes its row. Call it before the framework
 * updates the DOM of the rows, and give the result to `focusAfterRowRemoval` after the update.
 *
 * @param repeaterCard - The card of the repeater: the element with the class
 * `gui-repeater__main-card`, whose children are the row cards and the Add button.
 * @param nextRowCount - The number of rows after the update.
 * @returns The place of the focus, or `null` when the focus is not inside a row of this repeater
 * or its row stays. A focus inside a row of a nested repeater counts as a focus inside the outer
 * row.
 */
export function findRepeaterRowFocus(
  repeaterCard: Element | null | undefined,
  nextRowCount: number,
): RepeaterRowFocus | null {
  if (!repeaterCard) {
    return null;
  }
  // A key press in a row also updates the repeater, so the work is done only for a removed row.
  const rows = rowCards(repeaterCard);
  if (rows.length <= nextRowCount) {
    return null;
  }
  const focusedElement = activeElementInTree(repeaterCard);
  if (!focusedElement || !repeaterCard.contains(focusedElement)) {
    return null;
  }
  const rowIndex = rows.findIndex((row) => row.contains(focusedElement));
  if (rowIndex === -1 || rowIndex < nextRowCount) {
    return null;
  }
  return { focusedElement, rowIndex, path: pathInRow(rows[rowIndex], focusedElement) };
}

/**
 * @internal Used by framework Repeater components, not part of the end-user public API.
 *
 * Moves the focus when the DOM update removed the row that had it, so a keyboard user does not
 * start again from the top of the page. Call it after the framework updated the DOM of the rows.
 *
 * - At least one row is left: the same element of the last row gets the focus. When the last row
 *   does not have that element, its first element that can take the focus gets it.
 * - No row is left: the Add button gets the focus, when it is rendered and enabled.
 * - A Remove button never gets the focus, and a focus that was on a Remove button does not move.
 * - In every other case the focus does not move: the row of the focus still exists, the focus was
 *   outside the rows, or another element took the focus during the update.
 *
 * @param repeaterCard - The same element that `findRepeaterRowFocus` got.
 * @param rowFocus - What `findRepeaterRowFocus` returned before the update.
 * @returns The element that got the focus, or `null` when the focus did not move.
 * @example
 * const rowFocus = findRepeaterRowFocus(repeaterCard, nextRows.length); // before the update
 * focusAfterRowRemoval(repeaterCard, rowFocus); // after the update
 */
export function focusAfterRowRemoval(
  repeaterCard: Element | null | undefined,
  rowFocus: RepeaterRowFocus | null,
): HTMLElement | null {
  if (!repeaterCard || !rowFocus || rowFocus.focusedElement.isConnected) {
    return null;
  }
  // With the Enter key held down on a Remove button, a moved focus would remove one row after
  // another.
  if (isRemoveButton(rowFocus.focusedElement)) {
    return null;
  }
  // The document, not the shadow root: a focus anywhere else on the page must stay there.
  const activeElement = repeaterCard.ownerDocument.activeElement;
  if (activeElement !== null && activeElement !== repeaterCard.ownerDocument.body) {
    return null;
  }

  const rows = rowCards(repeaterCard);
  if (rowFocus.rowIndex < rows.length) {
    return null;
  }
  if (rows.length > 0) {
    const lastRow = rows[rows.length - 1];
    const sameElement = findByPath(lastRow, rowFocus.path);
    const focusedSameElement = sameElement ? focusFirstThatTakesFocus([sameElement]) : null;
    return focusedSameElement ?? focusFirstThatTakesFocus(fallbackCandidates(lastRow));
  }
  // A disabled Add button does not take the focus.
  const addButton = Array.from(repeaterCard.children).find((child) =>
    child.classList.contains(ADD_BUTTON_CLASS),
  );
  return addButton ? focusFirstThatTakesFocus([addButton]) : null;
}
