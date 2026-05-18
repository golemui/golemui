import { optional, string } from 'ts.data.json';
import { objectWithSuffix } from './decoder';

describe('objectWithSuffix (KeySpec)', () => {
  it('decodes a non-suffixed key (exact match)', () => {
    const decoder = objectWithSuffix<{ label: string }>(
      {
        label: {
          suffixed: false,
          decoder: string(),
        },
      },
      'MyObj',
    );

    const res = decoder.decode({ label: 'Submit' });

    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value).toEqual({ label: 'Submit' });
    }
  });

  it('accepts base and suffixed keys together when suffixed is true', () => {
    const decoder = objectWithSuffix<Record<string, string>>(
      {
        label: {
          suffixed: true,
          decoder: string(),
        },
      },
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

  it('rejects suffixed keys when suffixed is false', () => {
    const decoder = objectWithSuffix<Record<string, string>>(
      {
        label: {
          suffixed: false,
          decoder: string(),
        },
      },
      'MyObj',
    );

    const res = decoder.decode({
      'label.register': 'Register',
    });

    expect(res.isOk()).toBe(false);
    if (!res.isOk()) {
      expect(res.error).toContain('<MyObj> failed at "label" with undefined is not a valid string');
    }
  });

  it('fails when a required spec key is not provided', () => {
    const decoder = objectWithSuffix<{ label: string }>(
      {
        label: {
          suffixed: false,
          decoder: string(),
        },
      },
      'MyObj',
    );

    const res = decoder.decode({
      somethingelse: 'Hello',
    });

    expect(res.isOk()).toBe(false);
    if (!res.isOk()) {
      expect(res.error).toContain('<MyObj> failed at "label" with undefined is not a valid string');
    }
  });

  it('fails when a value does not match the decoder', () => {
    const decoder = objectWithSuffix<Record<string, string>>(
      {
        label: {
          suffixed: true,
          decoder: string(),
        },
      },
      'MyObj',
    );

    const res = decoder.decode({
      'label.register': 123,
    });

    expect(res.isOk()).toBe(false);
  });

  it('fails when input is not an object literal', () => {
    const decoder = objectWithSuffix<Record<string, string>>(
      {
        label: {
          suffixed: true,
          decoder: string(),
        },
      },
      'MyObj',
    );

    const res = decoder.decode(null);

    expect(res.isOk()).toBe(false);
    if (!res.isOk()) {
      expect(res.error).toContain('Expected object literal');
    }
  });

  it('autogenerates uid when empty string', () => {
    const generateId = vi.fn(() => 'generated-id-123');
    const uidDecoder = optional(string()).map((s) => s || generateId());

    const decoder = objectWithSuffix<{ uid: string }>(
      {
        uid: { suffixed: false, decoder: uidDecoder },
      },
      'MyObj',
    );

    const res = decoder.decode({ uid: '' });
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value.uid).toBe('generated-id-123');
    }
  });

  it('autogenerates uid when undefined', () => {
    const generateId = vi.fn(() => 'generated-id-123');
    const uidDecoder = optional(string()).map((s) => s || generateId());

    const decoder = objectWithSuffix<{ uid: string }>(
      {
        uid: { suffixed: false, decoder: uidDecoder },
      },
      'MyObj',
    );

    const res = decoder.decode({});
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value.uid).toBe('generated-id-123');
    }
  });

  it('preserves custom uid when provided', () => {
    const generateId = vi.fn(() => 'generated-id-123');
    const uidDecoder = optional(string()).map((s) => s || generateId());

    const decoder = objectWithSuffix<{ uid: string }>(
      {
        uid: { suffixed: false, decoder: uidDecoder },
      },
      'MyObj',
    );

    const res = decoder.decode({ uid: 'my-custom-id' });
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value.uid).toBe('my-custom-id');
    }
  });
});
