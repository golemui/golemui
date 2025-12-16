import * as jd from 'ts.data.json';
import { objectWithSuffix } from './decoder';

describe('objectWithSuffix', () => {
  it('decodes an object with the base key', () => {
    const decoder = objectWithSuffix<{ label: string }>(
      [{ key: 'label', decoder: jd.string() }],
      'MyObj',
    );

    const res = decoder.decode({ label: 'Submit' });

    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value).toEqual({ label: 'Submit' });
    }
  });

  it('decodes an object with suffixed keys', () => {
    const decoder = objectWithSuffix<Record<string, string>>(
      [{ key: 'label', decoder: jd.string() }],
      'MyObj',
    );

    const res = decoder.decode({
      'label.register': 'Register',
      'label.login': 'Login',
    });

    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value).toEqual({
        'label.register': 'Register',
        'label.login': 'Login',
      });
    }
  });

  it('accepts base and suffixed keys together', () => {
    const decoder = objectWithSuffix<Record<string, string>>(
      [{ key: 'label', decoder: jd.string() }],
      'MyObj',
    );

    const res = decoder.decode({
      label: 'Submit',
      'label.register': 'Register',
    });

    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value).toEqual({
        label: 'Submit',
        'label.register': 'Register',
      });
    }
  });

  it('fails on unexpected keys', () => {
    const decoder = objectWithSuffix<{ label: string }>(
      [{ key: 'label', decoder: jd.string() }],
      'MyObj',
    );

    const res = decoder.decode({
      title: 'Hello',
    });

    expect(res.isOk()).toBe(false);
    if (!res.isOk()) {
      expect(res.error).toContain('Unexpected object key title');
    }
  });

  it('fails when a value does not match the decoder', () => {
    const decoder = objectWithSuffix<Record<string, string>>(
      [{ key: 'label', decoder: jd.string() }],
      'MyObj',
    );

    const res = decoder.decode({
      'label.register': 123,
    });

    expect(res.isOk()).toBe(false);
  });

  it('fails when input is not an object literal', () => {
    const decoder = objectWithSuffix<Record<string, string>>(
      [{ key: 'label', decoder: jd.string() }],
      'MyObj',
    );

    const res = decoder.decode(null);

    expect(res.isOk()).toBe(false);
    if (!res.isOk()) {
      expect(res.error).toContain('Expected object literal');
    }
  });
});
