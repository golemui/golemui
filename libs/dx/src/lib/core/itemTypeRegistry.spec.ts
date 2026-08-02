import { createItemTypeRegistry, type ItemTypeHandler } from '../../index';

function buildHandler(): ItemTypeHandler {
  return {
    rollUpSensibleDefaults: () => ({}),
    applySensibleDefaults: (def) => def,
    mapToWidget: () => ({ uid: '', kind: 'input', type: 'textinput', path: '', props: {} }) as any,
    parseEntry: (entry) => ({ baseDef: entry }),
  };
}

describe('createItemTypeRegistry', () => {
  it('keeps registrations separate between instances', () => {
    const first = createItemTypeRegistry();
    const second = createItemTypeRegistry();
    first.registerItemType('SHARED_NAME', buildHandler(), 'input');

    expect(first.hasItemTypeHandler('SHARED_NAME')).toBe(true);
    expect(second.hasItemTypeHandler('SHARED_NAME')).toBe(false);
    // The same name registers fine in another instance.
    second.registerItemType('SHARED_NAME', buildHandler(), 'layout');
    expect(second.getItemTypeKind('SHARED_NAME')).toBe('layout');
    expect(first.getItemTypeKind('SHARED_NAME')).toBe('input');
  });

  it('throws on duplicate registration inside one instance', () => {
    const registry = createItemTypeRegistry();
    registry.registerItemType('MY_TYPE', buildHandler(), 'input');
    expect(() => registry.registerItemType('MY_TYPE', buildHandler(), 'input')).toThrow(
      'Item type "MY_TYPE" is already registered.',
    );
  });

  it('throws a descriptive error for unknown item types', () => {
    const registry = createItemTypeRegistry();
    expect(() => registry.getItemTypeHandler('UNKNOWN')).toThrow(
      'No handler registered for item type "UNKNOWN"',
    );
  });

  it('answers kind queries and kind membership', () => {
    const registry = createItemTypeRegistry();
    registry.registerItemType('TEXT', buildHandler(), 'input');
    registry.registerItemType('STACK', buildHandler(), 'layout');
    registry.registerItemType('NO_KIND', buildHandler());

    expect(registry.getItemTypeKind('TEXT')).toBe('input');
    expect(registry.getItemTypeKind('NO_KIND')).toBeUndefined();
    expect(registry.getRegisteredItemTypes().sort()).toEqual(['NO_KIND', 'STACK', 'TEXT']);
    expect(registry.getItemTypesOfKind('input')).toEqual(['TEXT']);
    expect(registry.getItemTypesOfKind('layout')).toEqual(['STACK']);
    expect(registry.getItemTypesOfKind('display')).toEqual([]);
  });
});
