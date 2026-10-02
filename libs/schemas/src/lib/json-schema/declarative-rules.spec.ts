import { describe, expect, it } from 'vitest';
import { isDeclarativeRule, matchesDeclarativeRule, matchesPathGlob } from './declarative-rules';
import { type DeclarativeRule, type SchemaNode } from './types';

const node = (fields: Partial<SchemaNode> = {}): SchemaNode => ({
  schema: { type: 'string', format: 'email', maxLength: 120 },
  type: 'string',
  nullable: false,
  path: 'contact.email',
  name: 'email',
  pointer: '/properties/contact/properties/email',
  required: true,
  repeaterDepth: 0,
  ...fields,
});

const matches = (match: DeclarativeRule['match'], target = node()) =>
  matchesDeclarativeRule({ match }, target);

describe('isDeclarativeRule', () => {
  it('tells a declarative rule from a predicate rule', () => {
    expect(isDeclarativeRule({ match: {} })).toBe(true);
    expect(isDeclarativeRule({ when: () => true, build: () => null })).toBe(false);
  });
});

describe('matchesDeclarativeRule', () => {
  it('matches schema keywords by deep equality', () => {
    expect(matches({ format: 'email' })).toBe(true);
    expect(matches({ format: 'email', maxLength: 120 })).toBe(true);
    expect(matches({ format: 'uri' })).toBe(false);
    expect(matches({ enum: ['a'] })).toBe(false);
  });

  it('matches an empty match against every node', () => {
    expect(matches({})).toBe(true);
  });

  it.each([
    [{ $type: 'string' }, true],
    [{ $type: 'number' }, false],
    [{ $name: 'email' }, true],
    [{ $required: true }, true],
    [{ $required: false }, false],
    [{ $inRepeater: false }, true],
    [{ $defName: 'Email' }, false],
  ])('matches the node field in %j: %s', (match, expected) => {
    expect(matches(match)).toBe(expected);
  });

  it('matches $defName and $inRepeater on a node inside a repeater', () => {
    const itemNode = node({ defName: 'Email', repeaterDepth: 1, path: 'people.items.email' });

    expect(matches({ $defName: 'Email', $inRepeater: true }, itemNode)).toBe(true);
  });

  it('matches $path as a glob', () => {
    expect(matches({ $path: 'contact.email' })).toBe(true);
    expect(matches({ $path: 'contact.*' })).toBe(true);
    expect(matches({ $path: '**.email' })).toBe(true);
    expect(matches({ $path: 'contact' })).toBe(false);
  });

  it.each([
    [{ format: { $in: ['email', 'idn-email'] } }, true],
    [{ format: { $in: ['uri'] } }, false],
    [{ pattern: { $exists: false } }, true],
    [{ maxLength: { $exists: true } }, true],
    [{ $name: { $regex: '^e' } }, true],
    [{ $name: { $regex: 'phone$' } }, false],
    [{ maxLength: { $regex: '1' } }, false],
  ])('applies the operator in %j: %s', (match, expected) => {
    expect(matches(match as DeclarativeRule['match'])).toBe(expected);
  });

  it('throws for an invalid regular expression, so the caller can report the rule', () => {
    expect(() => matches({ $name: { $regex: '(' } })).toThrow();
  });
});

describe('matchesPathGlob', () => {
  it.each([
    ['a.b', 'a.b', true],
    ['a.*', 'a.b', true],
    ['a.*', 'a.b.c', false],
    ['a.**', 'a', true],
    ['a.**', 'a.b.c', true],
    ['**', '', true],
    ['**.c', 'c', true],
    ['**.c', 'a.b.c', true],
    ['lines.*.name', 'lines.items.name', true],
    ['*', '', false],
    ['', '', true],
    ['', 'a', false],
  ])('%s against %s: %s', (glob, path, expected) => {
    expect(matchesPathGlob(glob, path)).toBe(expected);
  });
});
