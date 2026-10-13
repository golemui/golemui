import { Box, Text } from 'ink';
import { type ReactNode } from 'react';
import { type Theme } from '../theme';

/** Props of {@link Field}. */
export type FieldProps = {
  theme: Theme;
  /** Omit it to render no label line. The checkbox draws its own label next to the glyph. */
  label?: string;
  hint?: string;
  /** The widget `size`, used as the flex grow factor. */
  size?: number;
  isRequired?: boolean;
  isFocused: boolean;
  isTouched?: boolean;
  errors?: string[] | null;
  /** The control itself, for example the text line or the checkbox glyph. */
  children: ReactNode;
};

/**
 * The chrome every ink input widget shares: a label line, the control, and either the hint or
 * the validation errors.
 *
 * Errors replace the hint instead of stacking below it, because a terminal form is read one
 * line at a time and two explanations of the same field compete for attention.
 *
 * @example
 * <Field theme={theme} label="Email" isFocused={isFocused} errors={errors} isTouched={isTouched}>
 *   <Text>{value}</Text>
 * </Field>
 */
export function Field({
  theme,
  label,
  hint,
  size,
  isRequired,
  isFocused,
  isTouched,
  errors,
  children,
}: FieldProps) {
  const visibleErrors = isTouched && errors?.length ? errors : [];

  return (
    <Box flexDirection="column" flexGrow={size ?? 1} flexBasis={0}>
      {label !== undefined && (
        <Text color={theme.colors.label} bold={isFocused}>
          {label}
          {isRequired ? theme.glyphs.required : ''}
        </Text>
      )}
      {children}
      {visibleErrors.length > 0
        ? visibleErrors.map((message, index) => (
            <Text key={`${index}-${message}`} color={theme.colors.error}>
              {message}
            </Text>
          ))
        : hint !== undefined && hint !== '' && <Text color={theme.colors.hint}>{hint}</Text>}
    </Box>
  );
}
