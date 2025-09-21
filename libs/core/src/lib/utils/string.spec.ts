import { toCapitalizedWords } from './string';
describe('toCapitalizedWords', () => {
  test('converts camelCase userName to capitalized words', () => {
    expect(toCapitalizedWords('userName')).toBe('User Name');
  });

  test('converts snake_case user_name to capitalized words', () => {
    expect(toCapitalizedWords('user_name')).toBe('User Name');
  });

  test('converts camelCase firstName to capitalized words', () => {
    expect(toCapitalizedWords('firstName')).toBe('First Name');
  });

  test('converts snake_case phone_number to capitalized words', () => {
    expect(toCapitalizedWords('phone_number')).toBe('Phone Number');
  });

  test('converts camelCase isActiveUser to capitalized words', () => {
    expect(toCapitalizedWords('isActiveUser')).toBe('Is Active User');
  });

  // Additional test cases
  test('converts camelCase phoneNumber to capitalized words', () => {
    expect(toCapitalizedWords('phoneNumber')).toBe('Phone Number');
  });

  test('converts snake_case email_address to capitalized words', () => {
    expect(toCapitalizedWords('email_address')).toBe('Email Address');
  });

  test('converts camelCase isActive to capitalized words', () => {
    expect(toCapitalizedWords('isActive')).toBe('Is Active');
  });

  test('converts snake_case user_id to capitalized words', () => {
    expect(toCapitalizedWords('user_id')).toBe('User Id');
  });

  test('handles single word input', () => {
    expect(toCapitalizedWords('user')).toBe('User');
  });

  test('handles empty string', () => {
    expect(toCapitalizedWords('')).toBe('');
  });
});
