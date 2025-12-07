/* eslint-disable no-constant-binary-expression */
import { cn } from './cn';

describe('cn', () => {
  it('keeps object keys with truthy values', () => {
    expect(cn({ a: true, b: false, d: null, e: undefined })).toBe('a');
  });

  it('joins arrays of class names and ignore falsy values', () => {
    expect(cn('a', null, undefined, true, 'b')).toBe('a b');
  });

  it('supports heterogenous arguments', () => {
    expect(cn({ a: true }, 'b')).toBe('a b');
  });

  it('should be trimmed', () => {
    expect(cn('', 'b', {}, '')).toBe('b');
  });

  it('returns an empty string for an empty configuration', () => {
    expect(cn({})).toBe('');
  });

  it('supports an array of class names', () => {
    expect(cn(['a', 'b'])).toBe('a b');
  });

  it('joins array arguments with string arguments', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c');
    expect(cn('c', ['a', 'b'])).toBe('c a b');
  });

  it('handles multiple array arguments', () => {
    expect(cn(['a', 'b'], ['c', 'd'])).toBe('a b c d');
  });

  it('handles arrays that include falsy and true values', () => {
    expect(cn(['a', null, undefined, false, true, 'b'])).toBe('a b');
  });

  it('handles arrays that are empty', () => {
    expect(cn('a', [])).toBe('a');
  });

  it('strings', () => {
    expect(cn('')).toBe('');
    expect(cn('foo')).toBe('foo');
    expect(cn(true && 'foo')).toBe('foo');
    expect(cn(false && 'foo')).toBe('');
  });

  it('strings (variadic)', () => {
    expect(cn('')).toBe('');
    expect(cn('foo', 'bar')).toBe('foo bar');
    expect(cn(true && 'foo', false && 'bar', 'baz')).toBe('foo baz');
    expect(cn(false && 'foo', 'bar', 'baz', '')).toBe('bar baz');
  });

  it('objects', () => {
    expect(cn({})).toBe('');
    expect(cn({ foo: true })).toBe('foo');
    expect(cn({ foo: true, bar: false })).toBe('foo');
    expect(cn({ foo: 'hiya', bar: true })).toBe('foo bar');
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
    expect(cn({ '-foo': true, '--bar': true })).toBe('-foo --bar');
  });

  it('objects (variadic)', () => {
    expect(cn({}, {})).toBe('');
    expect(cn({ foo: true }, { bar: true })).toBe('foo bar');
    expect(cn({ foo: true }, undefined, { baz: true, bat: false })).toBe('foo baz');
    expect(cn({ foo: true }, {}, {}, { bar: 'a' }, { baz: null, bat: true })).toBe('foo bar bat');
  });

  it('arrays', () => {
    expect(cn([])).toBe('');
    expect(cn(['foo'])).toBe('foo');
    expect(cn(['foo', 'bar'])).toBe('foo bar');
    expect(cn(['foo', false && 'bar', true && 'baz'])).toBe('foo baz');
  });

  it('arrays (variadic)', () => {
    expect(cn([], [])).toBe('');
    expect(cn(['foo'], ['bar'])).toBe('foo bar');
    expect(cn(['foo'], null, ['baz', ''], true, '', [])).toBe('foo baz');
  });

  it('arrays (no `push` escape)', () => {
    expect(cn({ push: true })).toBe('push');
    expect(cn({ pop: true })).toBe('pop');
    expect(cn({ push: true })).toBe('push');
    expect(cn('hello', { world: true, push: true }), 'hello world push');
  });
});
