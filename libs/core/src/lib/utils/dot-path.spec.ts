import { toLabel } from './dot-path';
describe('toLabel', () => {
  test('converts camelCase userName to capitalized words', () => {
    expect(toLabel('userName')).toBe('User Name');
    expect(toLabel('some.path.userName')).toBe('User Name');
  });

  test('converts snake_case user_name to capitalized words', () => {
    expect(toLabel('user_name')).toBe('User Name');
    expect(toLabel('some.path.user_name')).toBe('User Name');
  });
});
