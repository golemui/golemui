import { beforeEach, describe, expect, it } from 'vitest';
import { FormDefFacadeFactory } from './formDefFacadeFactory.service';

describe('KeysMergerService', () => {
  let service: FormDefFacadeFactory;

  beforeEach(() => {
    service = new FormDefFacadeFactory();
  });

  it('should throw an error when both keys are null', () => {
    expect(() => service.mergeKeys(null, null)).toThrow('Both keysLeff and keysRight cannot be null');
  });

  it('should return keysRight when only keysLeff is null', () => {
    const keysRight = ['key1', 'key2'];
    const result = service.mergeKeys(null, keysRight);
    expect(result).toEqual(keysRight);
  });

  it('should return keysLeff when only keysRight is null', () => {
    const keysLeff = ['key1', 'key2'];
    const result = service.mergeKeys(keysLeff, null);
    expect(result).toEqual(keysLeff);
  });

  it('should merge both arrays when both are provided', () => {
    const keysLeff = ['key1', 'key2'];
    const keysRight = ['key3', 'key4'];
    const result = service.mergeKeys(keysLeff, keysRight);
    expect(result).toEqual(['key1', 'key2', 'key3', 'key4']);
  });

  it('should rearrange keys when the definion specifies right key', () => {
    const keysLeff = ['key3', 'key1', 'key2'];
    const keysRight = ['key3', 'key4'];
    const result = service.mergeKeys(keysLeff, keysRight);
    expect(result).toEqual(['key3', 'key1', 'key2', 'key4']);
  });

  it('should rearrange complex scenarios', () => {
    const keysLeff = ['key3', 'key1', 'key4', 'key2'];
    const keysRight = ['key3', 'key4', 'key5'];
    const result = service.mergeKeys(keysLeff, keysRight);
    expect(result).toEqual(['key3', 'key1', 'key4', 'key2', 'key5']);
  });
});
