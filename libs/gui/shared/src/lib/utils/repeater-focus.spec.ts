// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { findRepeaterRowFocus, focusAfterRowRemoval } from './repeater-focus';

type AddButton = 'enabled' | 'disabled' | 'none';

/** The DOM that the Repeater components render. The ids and `data-cy` values contain the uids. */
const repeaterHtml = (uid: string, rowContents: string[], addButton: AddButton = 'enabled') => {
  const rows = rowContents
    .map(
      (content) => `
        <div class="gui-repeater__card">
          <div class="gui-repeater__card-header">
            <button type="button" class="gui-button gui-repeater__remove-btn">Remove</button>
          </div>
          ${content}
        </div>`,
    )
    .join('');
  const add =
    addButton === 'none'
      ? ''
      : `<button type="button" class="gui-button gui-repeater__add-btn"
           ${addButton === 'disabled' ? 'disabled' : ''}>Add</button>`;
  return `
    <div class="gui-repeater gui-field">
      <div id="form-${uid}" class="gui-repeater__main-card gui-repeater__card">
        <gui-label></gui-label>
        ${rows}
        ${add}
      </div>
    </div>`;
};

const textInput = (uid: string) =>
  `<div class="gui-field"><input type="text" id="form-${uid}" data-cy="${uid}_textinput" /></div>`;

const memberRow = (index: number, { hideName = false } = {}) => `
  <div id="form-memberGrid[${index}]">
    ${hideName ? '' : textInput(`name[${index}]`)}
    ${textInput(`role[${index}]`)}
  </div>`;

const mountRepeater = (html: string, outsideHtml = '') => {
  document.body.innerHTML = `${html}${outsideHtml}`;
  return document.getElementById('form-members') as HTMLElement;
};

const byDataCy = (dataCy: string) => document.querySelector(`[data-cy="${dataCy}"]`) as HTMLElement;

const rowCardsOf = (repeaterCard: Element) =>
  Array.from(repeaterCard.children).filter((child) =>
    child.classList.contains('gui-repeater__card'),
  );

const removeRow = (repeaterCard: Element, index: number) => {
  rowCardsOf(repeaterCard)[index].remove();
};

/** Reads the focus, removes the rows from `firstRemovedRow` to the end, and moves the focus. */
const removeRowsFrom = (repeaterCard: Element, firstRemovedRow: number) => {
  const rowFocus = findRepeaterRowFocus(repeaterCard, firstRemovedRow);
  const rowCount = rowCardsOf(repeaterCard).length;
  for (let index = rowCount - 1; index >= firstRemovedRow; index--) {
    removeRow(repeaterCard, index);
  }
  return focusAfterRowRemoval(repeaterCard, rowFocus);
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('findRepeaterRowFocus', () => {
  it('returns null without a repeater card', () => {
    expect(findRepeaterRowFocus(null, 0)).toBeNull();
    expect(findRepeaterRowFocus(undefined, 0)).toBeNull();
  });

  it('returns null when the focus is outside the repeater', () => {
    const repeaterCard = mountRepeater(
      repeaterHtml('members', [memberRow(0)]),
      textInput('outside'),
    );
    byDataCy('outside_textinput').focus();

    expect(findRepeaterRowFocus(repeaterCard, 0)).toBeNull();
  });

  it('returns null when the focus is on the Add button, outside the rows', () => {
    const repeaterCard = mountRepeater(repeaterHtml('members', [memberRow(0)]));
    (repeaterCard.querySelector('.gui-repeater__add-btn') as HTMLElement).focus();

    expect(findRepeaterRowFocus(repeaterCard, 0)).toBeNull();
  });

  it('returns null for a DOM without getRootNode, such as the DOM of a server render', () => {
    const repeaterCard = mountRepeater(repeaterHtml('members', [memberRow(0), memberRow(1)]));
    byDataCy('name[1]_textinput').focus();
    Object.defineProperty(repeaterCard, 'getRootNode', { value: undefined });

    expect(findRepeaterRowFocus(repeaterCard, 1)).toBeNull();
  });

  it('returns null when the row of the focus stays after the update', () => {
    const repeaterCard = mountRepeater(
      repeaterHtml('members', [memberRow(0), memberRow(1), memberRow(2)]),
    );
    byDataCy('role[1]_textinput').focus();

    expect(findRepeaterRowFocus(repeaterCard, 3)).toBeNull();
    expect(findRepeaterRowFocus(repeaterCard, 2)).toBeNull();
  });

  it('returns the focused element and the index of its row when the update removes the row', () => {
    const repeaterCard = mountRepeater(
      repeaterHtml('members', [memberRow(0), memberRow(1), memberRow(2)]),
    );
    byDataCy('role[1]_textinput').focus();

    expect(findRepeaterRowFocus(repeaterCard, 1)).toMatchObject({
      focusedElement: byDataCy('role[1]_textinput'),
      rowIndex: 1,
    });
  });
});

describe('focusAfterRowRemoval', () => {
  describe('when at least one row is left', () => {
    it('moves the focus to the same input of the last row', () => {
      const repeaterCard = mountRepeater(
        repeaterHtml('members', [memberRow(0), memberRow(1), memberRow(2)]),
      );
      byDataCy('name[2]_textinput').focus();

      const focused = removeRowsFrom(repeaterCard, 2);

      expect(focused).toBe(byDataCy('name[1]_textinput'));
      expect(document.activeElement).toBe(byDataCy('name[1]_textinput'));
    });

    it('moves the focus to the same input of the last row when several rows are removed', () => {
      const repeaterCard = mountRepeater(
        repeaterHtml('members', [memberRow(0), memberRow(1), memberRow(2)]),
      );
      byDataCy('role[2]_textinput').focus();

      removeRowsFrom(repeaterCard, 1);

      expect(document.activeElement).toBe(byDataCy('role[0]_textinput'));
    });

    it('moves the focus nowhere when the focus was on the Remove button of the removed row', () => {
      const repeaterCard = mountRepeater(
        repeaterHtml('members', [memberRow(0), memberRow(1), memberRow(2)]),
      );
      (repeaterCard.querySelectorAll('.gui-repeater__remove-btn')[2] as HTMLElement).focus();

      expect(removeRowsFrom(repeaterCard, 2)).toBeNull();
      expect(document.activeElement).toBe(document.body);
    });

    it('finds the same input when the last row hides a widget that comes before it', () => {
      const repeaterCard = mountRepeater(
        repeaterHtml('members', [memberRow(0), memberRow(1, { hideName: true }), memberRow(2)]),
      );
      byDataCy('role[2]_textinput').focus();

      removeRowsFrom(repeaterCard, 2);

      expect(document.activeElement).toBe(byDataCy('role[1]_textinput'));
    });

    it('moves the focus to the first element of the last row when the id of the focused input is different in every row', () => {
      const generatedIdRow = (firstId: number) => `
        <div><input type="text" id="gui-textinput-${firstId}" /></div>
        <div><input type="text" id="gui-textinput-${firstId + 1}" /></div>`;
      const repeaterCard = mountRepeater(
        repeaterHtml('members', [generatedIdRow(1), generatedIdRow(3), generatedIdRow(5)]),
      );
      (document.getElementById('gui-textinput-6') as HTMLElement).focus();

      removeRowsFrom(repeaterCard, 2);

      expect(document.activeElement).toBe(document.getElementById('gui-textinput-3'));
    });

    it('moves the focus to another element of the last row, not its Remove button, when the last row does not have the same element', () => {
      const repeaterCard = mountRepeater(
        repeaterHtml('members', [
          `<div id="form-memberGrid[0]"><textarea id="form-notes[0]"></textarea></div>`,
          `<div id="form-memberGrid[1]">${textInput('name[1]')}</div>`,
        ]),
      );
      byDataCy('name[1]_textinput').focus();

      removeRowsFrom(repeaterCard, 1);

      expect(document.activeElement).toBe(document.getElementById('form-notes[0]'));
    });

    it('moves the focus nowhere when the last row has no element but its Remove button', () => {
      const repeaterCard = mountRepeater(repeaterHtml('members', ['', textInput('name[1]')]));
      byDataCy('name[1]_textinput').focus();

      expect(removeRowsFrom(repeaterCard, 1)).toBeNull();
      expect(document.activeElement).toBe(document.body);
    });

    it('moves the focus to the first element that can take the focus when the same element is disabled', () => {
      const repeaterCard = mountRepeater(repeaterHtml('members', [memberRow(0), memberRow(1)]));
      byDataCy('name[1]_textinput').focus();
      const rowFocus = findRepeaterRowFocus(repeaterCard, 1);
      removeRow(repeaterCard, 1);
      byDataCy('name[0]_textinput').setAttribute('disabled', '');

      focusAfterRowRemoval(repeaterCard, rowFocus);

      expect(document.activeElement).toBe(byDataCy('role[0]_textinput'));
    });
  });

  describe('when no row is left', () => {
    it('moves the focus to the Add button', () => {
      const repeaterCard = mountRepeater(repeaterHtml('members', [memberRow(0)]));
      byDataCy('name[0]_textinput').focus();

      const focused = removeRowsFrom(repeaterCard, 0);

      expect(focused).toBe(repeaterCard.querySelector('.gui-repeater__add-btn'));
      expect(document.activeElement).toBe(focused);
    });

    it('moves the focus nowhere when the Add button is disabled', () => {
      const repeaterCard = mountRepeater(repeaterHtml('members', [memberRow(0)], 'disabled'));
      byDataCy('name[0]_textinput').focus();

      expect(removeRowsFrom(repeaterCard, 0)).toBeNull();
      expect(document.activeElement).toBe(document.body);
    });

    it('moves the focus nowhere when there is no Add button', () => {
      const repeaterCard = mountRepeater(repeaterHtml('members', [memberRow(0)], 'none'));
      byDataCy('name[0]_textinput').focus();

      expect(removeRowsFrom(repeaterCard, 0)).toBeNull();
      expect(document.activeElement).toBe(document.body);
    });
  });

  describe('when the focus must not move', () => {
    it('keeps the focus on the same node when the row of the focus still exists', () => {
      const repeaterCard = mountRepeater(
        repeaterHtml('members', [memberRow(0), memberRow(1), memberRow(2)]),
      );
      const focusedInput = byDataCy('name[0]_textinput');
      focusedInput.focus();

      expect(removeRowsFrom(repeaterCard, 2)).toBeNull();
      expect(document.activeElement).toBe(focusedInput);
    });

    it('moves the focus nowhere when the focused element is removed from a row that still exists', () => {
      const repeaterCard = mountRepeater(
        repeaterHtml('members', [memberRow(0), memberRow(1), memberRow(2)]),
      );
      byDataCy('name[2]_textinput').focus();
      const rowFocus = findRepeaterRowFocus(repeaterCard, 2);
      byDataCy('name[2]_textinput').remove();

      expect(focusAfterRowRemoval(repeaterCard, rowFocus)).toBeNull();
      expect(document.activeElement).toBe(document.body);
    });

    it('keeps the focus in an element outside the repeater', () => {
      const repeaterCard = mountRepeater(
        repeaterHtml('members', [memberRow(0), memberRow(1), memberRow(2)]),
        textInput('outside'),
      );
      byDataCy('outside_textinput').focus();

      expect(removeRowsFrom(repeaterCard, 1)).toBeNull();
      expect(document.activeElement).toBe(byDataCy('outside_textinput'));
    });

    it('keeps the focus on an element that took it during the update', () => {
      const repeaterCard = mountRepeater(
        repeaterHtml('members', [memberRow(0), memberRow(1), memberRow(2)]),
        textInput('outside'),
      );
      byDataCy('name[2]_textinput').focus();
      const rowFocus = findRepeaterRowFocus(repeaterCard, 2);
      removeRow(repeaterCard, 2);
      byDataCy('outside_textinput').focus();

      expect(focusAfterRowRemoval(repeaterCard, rowFocus)).toBeNull();
      expect(document.activeElement).toBe(byDataCy('outside_textinput'));
    });

    it('moves the focus nowhere without a place of the focus', () => {
      const repeaterCard = mountRepeater(repeaterHtml('members', [memberRow(0)]));

      expect(focusAfterRowRemoval(repeaterCard, null)).toBeNull();
      expect(focusAfterRowRemoval(null, null)).toBeNull();
    });
  });

  describe('with a nested repeater', () => {
    const skillsRow = (uidSuffix: string) => `<div>${textInput(`skill${uidSuffix}`)}</div>`;

    /** A team row with a nested repeater of skills. `skillCount` sets the rows of the skills. */
    const teamRow = (teamIndex: number, skillCount: number) => {
      const skillRows = Array.from({ length: skillCount }, (_, skillIndex) =>
        skillsRow(`[${teamIndex}][${skillIndex}]`),
      );
      return `
        <div id="form-teamGrid[${teamIndex}]">
          ${textInput(`teamName[${teamIndex}]`)}
          ${repeaterHtml(`skills[${teamIndex}]`, skillRows)}
        </div>`;
    };

    const mountTeams = (skillCounts: number[]) => {
      document.body.innerHTML = repeaterHtml(
        'teams',
        skillCounts.map((skillCount, teamIndex) => teamRow(teamIndex, skillCount)),
      );
      return document.getElementById('form-teams') as HTMLElement;
    };

    const skillsCard = (teamIndex: number) =>
      document.getElementById(`form-skills[${teamIndex}]`) as HTMLElement;

    const nestedAddButton = (teamIndex: number) =>
      Array.from(skillsCard(teamIndex).children).find((child) =>
        child.classList.contains('gui-repeater__add-btn'),
      ) as HTMLElement;

    it('moves the focus to the same input of the last inner row when an inner row is removed', () => {
      mountTeams([3]);
      byDataCy('skill[0][2]_textinput').focus();

      removeRowsFrom(skillsCard(0), 2);

      expect(document.activeElement).toBe(byDataCy('skill[0][1]_textinput'));
    });

    it('moves the focus to the same inner input of the last outer row when an outer row is removed', () => {
      const teamsCard = mountTeams([1, 2, 2]);
      byDataCy('skill[2][1]_textinput').focus();

      removeRowsFrom(teamsCard, 2);

      expect(document.activeElement).toBe(byDataCy('skill[1][1]_textinput'));
    });

    it('moves the focus to the nested Add button of the last outer row when the outer rows have different numbers of inner rows', () => {
      const teamsCard = mountTeams([1, 5, 2]);
      nestedAddButton(2).focus();

      removeRowsFrom(teamsCard, 2);

      expect(document.activeElement).toBe(nestedAddButton(1));
    });

    it('moves the focus to the first element of the last outer row that is not a Remove button when it does not have the inner row of the focus', () => {
      const teamsCard = mountTeams([1, 3]);
      byDataCy('skill[1][2]_textinput').focus();

      removeRowsFrom(teamsCard, 1);

      expect(document.activeElement).toBe(byDataCy('teamName[0]_textinput'));
    });

    it('moves the focus nowhere when the focus was on an inner Remove button of the removed outer row', () => {
      const teamsCard = mountTeams([1, 3]);
      (skillsCard(1).querySelectorAll('.gui-repeater__remove-btn')[2] as HTMLElement).focus();

      expect(removeRowsFrom(teamsCard, 1)).toBeNull();
      expect(document.activeElement).toBe(document.body);
    });

    it('keeps the focus in an inner row when its outer row still exists', () => {
      const teamsCard = mountTeams([2, 2]);
      byDataCy('skill[0][1]_textinput').focus();

      expect(removeRowsFrom(teamsCard, 1)).toBeNull();
      expect(document.activeElement).toBe(byDataCy('skill[0][1]_textinput'));
    });
  });

  describe('inside a shadow root', () => {
    it('moves the focus to the same input of the last row', () => {
      const host = document.createElement('div');
      document.body.append(host);
      const shadowRoot = host.attachShadow({ mode: 'open' });
      shadowRoot.innerHTML = repeaterHtml('members', [memberRow(0), memberRow(1), memberRow(2)]);
      const repeaterCard = shadowRoot.getElementById('form-members') as HTMLElement;
      const inShadow = (dataCy: string) =>
        shadowRoot.querySelector(`[data-cy="${dataCy}"]`) as HTMLElement;
      inShadow('name[2]_textinput').focus();

      expect(findRepeaterRowFocus(repeaterCard, 2)).toMatchObject({ rowIndex: 2 });
      const focused = removeRowsFrom(repeaterCard, 2);

      expect(focused).toBe(inShadow('name[1]_textinput'));
      expect(shadowRoot.activeElement).toBe(inShadow('name[1]_textinput'));
    });
  });
});
