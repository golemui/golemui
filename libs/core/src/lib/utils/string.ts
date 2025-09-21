/**
 * Converts a camelCase or snake_case variable name into capitalized words.
 *
 * @param variableName - The variable name to convert (camelCase or snake_case)
 * @returns A string with capitalized words separated by spaces
 *
 * @example
 * ```typescript
 * toCapitalizedWords('userName') // returns "User Name"
 * toCapitalizedWords('user_name') // returns "User Name"
 * toCapitalizedWords('firstName') // returns "First Name"
 * toCapitalizedWords('phone_number') // returns "Phone Number"
 * toCapitalizedWords('isActiveUser') // returns "Is Active User"
 * ```
 */
export const toCapitalizedWords = (variableName: string): string => {
  return (
    variableName
      // Handle snake_case: replace underscores with spaces
      .replace(/_/g, ' ')
      // Handle camelCase: insert space before uppercase letters
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Split into words, capitalize each word, and join with spaces
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  );
};
