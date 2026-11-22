import { optional, string, succeed } from 'ts.data.json';
import { functionInDefinitionMessage, noFunction, objectWithSuffix } from './decoder';

describe('objectWithSuffix (KeySpec)', () => {
  it('decodes a non-suffixed key (exact match)', () => {
    const decoder = objectWithSuffix<{ label: string }>({
      label: {
        suffixed: false,
        decoder: string(),
      },
    });

    const res = decoder.decode({ label: 'Submit' });

    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value).toEqual({ label: 'Submit' });
    }
  });

  it('accepts base and suffixed keys together when suffixed is true', () => {
    const decoder = objectWithSuffix<Record<string, string>>({
      label: {
        suffixed: true,
        decoder: string(),
      },
    });

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
    const decoder = objectWithSuffix<Record<string, string>>({
      label: {
        suffixed: false,
        decoder: string(),
      },
    });

    const res = decoder.decode({
      'label.register': 'Register',
    });

    expect(res.isOk()).toBe(false);
    if (!res.isOk()) {
      expect(res.issues).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('is not a valid string'),
          path: ['label'],
        }),
      );
    }
  });

  it('fails when a required spec key is not provided', () => {
    const decoder = objectWithSuffix<{ label: string }>({
      label: {
        suffixed: false,
        decoder: string(),
      },
    });

    const res = decoder.decode({
      somethingelse: 'Hello',
    });

    expect(res.isOk()).toBe(false);
    if (!res.isOk()) {
      expect(res.issues).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('is not a valid string'),
          path: ['label'],
        }),
      );
    }
  });

  it('fails when a value does not match the decoder', () => {
    const decoder = objectWithSuffix<Record<string, string>>({
      label: {
        suffixed: true,
        decoder: string(),
      },
    });

    const res = decoder.decode({
      'label.register': 123,
    });

    expect(res.isOk()).toBe(false);
  });

  it('fails when input is not an object literal', () => {
    const decoder = objectWithSuffix<Record<string, string>>({
      label: {
        suffixed: true,
        decoder: string(),
      },
    });

    const res = decoder.decode(null);

    expect(res.isOk()).toBe(false);
    if (!res.isOk()) {
      expect(res.issues).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('Expected object literal'),
        }),
      );
    }
  });

  it('autogenerates uid when empty string', () => {
    const generateId = vi.fn(() => 'generated-id-123');
    const uidDecoder = optional(string()).map((s) => s || generateId());

    const decoder = objectWithSuffix<{ uid: string }>({
      uid: { suffixed: false, decoder: uidDecoder },
    });

    const res = decoder.decode({ uid: '' });
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value.uid).toBe('generated-id-123');
    }
  });

  it('autogenerates uid when undefined', () => {
    const generateId = vi.fn(() => 'generated-id-123');
    const uidDecoder = optional(string()).map((s) => s || generateId());

    const decoder = objectWithSuffix<{ uid: string }>({
      uid: { suffixed: false, decoder: uidDecoder },
    });

    const res = decoder.decode({});
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value.uid).toBe('generated-id-123');
    }
  });

  it('preserves custom uid when provided', () => {
    const generateId = vi.fn(() => 'generated-id-123');
    const uidDecoder = optional(string()).map((s) => s || generateId());

    const decoder = objectWithSuffix<{ uid: string }>({
      uid: { suffixed: false, decoder: uidDecoder },
    });

    const res = decoder.decode({ uid: 'my-custom-id' });
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value.uid).toBe('my-custom-id');
    }
  });
});

describe('objectWithSuffix - a value that is a function', () => {
  const decoder = objectWithSuffix<Record<string, unknown>>({
    label: { suffixed: true, decoder: optional(string()) },
    validator: { decoder: optional(succeed()) },
  });

  it('gives the issue for a function in a definition for a key of the specification', () => {
    const res = decoder.decode({ label: () => 'Name' });

    expect(res).toMatchObject({
      issues: [{ message: functionInDefinitionMessage, path: ['label'] }],
    });
  });

  it('gives the same issue for a key with a suffix', () => {
    const res = decoder.decode({ label: 'Name', 'label.company': () => 'Company name' });

    expect(res).toMatchObject({
      issues: [{ message: functionInDefinitionMessage, path: ['label.company'] }],
    });
  });

  it('gives the same issue when the decoder of the key accepts every value', () => {
    const res = decoder.decode({ validator: () => ({ required: true }) });

    expect(res).toMatchObject({
      issues: [{ message: functionInDefinitionMessage, path: ['validator'] }],
    });
  });

  it('ignores a function under a key that the specification does not have', () => {
    const res = decoder.decode({ label: 'Name', onClick: () => undefined });

    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value).toEqual({ label: 'Name', validator: undefined });
    }
  });

  it('gives an issue for an array and does not read its inherited keys', () => {
    const eventsDecoder = objectWithSuffix<Record<string, unknown>>({
      filter: { suffixed: true, decoder: optional(string()) },
    });

    const res = eventsDecoder.decode([]);

    expect(res).toMatchObject({
      issues: [{ message: 'Expected object literal, got "array"', path: [] }],
    });
  });

  it('reads the keys of an object that is not a plain object', () => {
    class Widget {
      label = () => 'Name';
    }

    const res = decoder.decode(new Widget());

    expect(res).toMatchObject({
      issues: [{ message: functionInDefinitionMessage, path: ['label'] }],
    });
  });
});

describe('noFunction', () => {
  describe('tsdoc examples', () => {
    it('gives the issue for a function in a definition', () => {
      const res = noFunction(optional(string())).decode(() => 'Name');

      expect(res).toMatchObject({ issues: [{ message: functionInDefinitionMessage, path: [] }] });
    });

    it('gives the value of the wrapped decoder for another value', () => {
      const res = noFunction(optional(string())).decode('Name');

      expect(res).toMatchObject({ value: 'Name' });
    });
  });

  it('keeps the issue of the wrapped decoder for a value that is not a function', () => {
    const res = noFunction(string()).decode(5);

    expect(res.isOk()).toBe(false);
    if (!res.isOk()) {
      expect(res.issues[0].message).not.toBe(functionInDefinitionMessage);
    }
  });

  it('gives the issue for a class, which is a function too', () => {
    class Component {}

    const res = noFunction(succeed()).decode(Component);

    expect(res).toMatchObject({ issues: [{ message: functionInDefinitionMessage, path: [] }] });
  });
});
