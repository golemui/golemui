import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { actionWidgets, displayWidgets, inputWidgets, layoutWidgets } from './widgets';

// The skill index is written by hand. It tells an agent where the reference page of each
// widget type is, so a type that it does not list has no page for the agent.
const skillIndexPath = join(__dirname, '../../../../../skills/golemui/references/widgets-index.md');

// `flex` is deprecated.
const typesWithoutIndexEntry = new Set<string>(['flex']);

function listedTypes(): Set<string> {
  const listed = new Set<string>();
  for (const line of readFileSync(skillIndexPath, 'utf-8').split('\n')) {
    const entry = /^- ((?:`[^`]+`(?:, )?)+) - https:/.exec(line);
    if (!entry) {
      continue;
    }
    for (const name of entry[1].matchAll(/`([^`]+)`/g)) {
      listed.add(name[1]);
    }
  }
  return listed;
}

describe('the widget index of the skill', () => {
  const widgetTypes = [...inputWidgets, ...actionWidgets, ...displayWidgets, ...layoutWidgets];

  it('lists every widget type that a JSON form can hold', () => {
    const listed = listedTypes();
    const missing = widgetTypes.filter(
      (type) => !typesWithoutIndexEntry.has(type) && !listed.has(type),
    );

    expect(missing).toEqual([]);
  });

  it('lists no type that the widget set does not have', () => {
    const known = new Set<string>(widgetTypes);
    const unknown = [...listedTypes()].filter((type) => !known.has(type));

    expect(unknown).toEqual([]);
  });
});
