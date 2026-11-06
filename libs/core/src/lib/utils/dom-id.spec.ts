import { describe, expect, it } from 'vitest';
import { toDomId } from './dom-id';

describe('toDomId', () => {
  it('puts the form name in front of the uid', () => {
    expect(toDomId('signup', 'email-textinput')).toBe('signup-email-textinput');
  });

  it('keeps the row indexes of a repeater item uid', () => {
    expect(toDomId('order', 'line-textinput[1]')).toBe('order-line-textinput[1]');
  });

  it('leaves the uid as it is without a form name', () => {
    expect(toDomId('', 'email-textinput')).toBe('email-textinput');
    expect(toDomId(undefined, 'email-textinput')).toBe('email-textinput');
  });
});
