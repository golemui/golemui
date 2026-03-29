import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeRepeaterItemConfig, transformRepeaterItemWhenExpression } from './repeater';
import { isInputWidget, NonFunctionWidget } from '../form-widget';

// Mock the external dependency to easily control the execution branch
vi.mock('../form-widget', () => ({
  isInputWidget: vi.fn(),
}));

describe('makeRepeaterItemConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Non-input widgets', () => {
    it('should update only the uid and retain other properties', () => {
      vi.mocked(isInputWidget).mockReturnValue(false);

      const mockWidget = {
        uid: 'base-widget',
      } as unknown as NonFunctionWidget<string>;

      const result = makeRepeaterItemConfig(mockWidget, [0, 5]);

      expect(result).toEqual({
        uid: 'base-widget[0][5]',
      });
      // Ensure the original object was not mutated
      expect(result).not.toBe(mockWidget);
    });
  });

  describe('Input widgets', () => {
    it('should update both the uid and the path for a single level of nesting', () => {
      vi.mocked(isInputWidget).mockReturnValue(true);

      const mockWidget = {
        uid: 'user-name',
        path: 'users.items.name',
      } as unknown as NonFunctionWidget<string>;

      const result = makeRepeaterItemConfig(mockWidget, [2]);

      expect(result).toEqual({
        uid: 'user-name[2]',
        path: 'users.2.name',
      });
    });

    it('should update both the uid and the path for multiple levels of nesting', () => {
      vi.mocked(isInputWidget).mockReturnValue(true);

      const mockWidget = {
        uid: 'user-address-street',
        path: 'users.items.addresses.items.street',
      } as unknown as NonFunctionWidget<string>;

      const result = makeRepeaterItemConfig(mockWidget, [1, 3]);

      expect(result).toEqual({
        uid: 'user-address-street[1][3]',
        path: 'users.1.addresses.3.street',
      });
    });
  });

  describe('Error handling', () => {
    it('should throw an error if repeaterIndexes is an empty array', () => {
      const mockWidget = {
        uid: 'base-widget',
      } as unknown as NonFunctionWidget<string>;

      expect(() => makeRepeaterItemConfig(mockWidget, [])).toThrowError(
        'Repeater indexes cannot be an empty array',
      );
    });

    it('should throw an error if an input widget path has fewer "items" tokens than provided indexes', () => {
      vi.mocked(isInputWidget).mockReturnValue(true);

      const mockWidget = {
        uid: 'user-name',
        path: 'users.items.name', // 1 token
      } as unknown as NonFunctionWidget<string>;

      // Providing 2 indexes for 1 token
      expect(() => makeRepeaterItemConfig(mockWidget, [0, 1])).toThrowError(
        "Path contains 1 'items' occurrences, but 2 indexes were provided.",
      );
    });

    it('should throw an error if an input widget path has more "items" tokens than provided indexes', () => {
      vi.mocked(isInputWidget).mockReturnValue(true);

      const mockWidget = {
        uid: 'user-address-street',
        path: 'users.items.addresses.items.street', // 2 tokens
      } as unknown as NonFunctionWidget<string>;

      // Providing 1 index for 2 tokens
      expect(() => makeRepeaterItemConfig(mockWidget, [0])).toThrowError(
        "Path contains 2 'items' occurrences, but 1 indexes were provided.",
      );
    });
  });
});

describe('transformRepeaterItemWhenExpression', () => {
  it('should return the expression unchanged when it has no .items. token', () => {
    expect(transformRepeaterItemWhenExpression('form.active', [0])).toBe('form.active');
  });

  it('should replace a single .items. token with the corresponding index', () => {
    expect(transformRepeaterItemWhenExpression('users.items.active', [2])).toBe('users.2.active');
  });

  it('should replace multiple .items. tokens with the corresponding indexes', () => {
    expect(
      transformRepeaterItemWhenExpression('users.items.addresses.items.active', [1, 3]),
    ).toBe('users.1.addresses.3.active');
  });

  it('should leave excess .items. tokens unreplaced when fewer indexes than tokens are provided', () => {
    expect(
      transformRepeaterItemWhenExpression('users.items.addresses.items.active', [1]),
    ).toBe('users.1.addresses.items.active');
  });
});
