import { Box, Text } from 'ink';
import { type FormHealthBoundary, type WidgetErrorFallback } from '@golemui/react';

/**
 * Terminal replacement for the adapter's default form health boundary.
 *
 * The default one renders `div` elements, which Ink cannot draw, so every Ink form has to pass
 * this instead. The form stays mounted below the error so a recovered health restores it in place.
 */
export const InkFormHealthBoundary: FormHealthBoundary = ({ health, children }) => {
  if (health.status !== 'errored') {
    return children;
  }
  return (
    <Box flexDirection="column">
      <Box flexDirection="column" borderStyle="round" borderColor="red" paddingX={1}>
        <Text color="red" bold>
          GolemUI form error
        </Text>
        <Text color="red">{health.message}</Text>
      </Box>
      {children}
    </Box>
  );
};

/**
 * Terminal replacement UI for a widget that threw while rendering.
 *
 * @example
 * createFormComponent(widgetSet, { widgetErrorFallback: inkWidgetErrorFallback });
 */
export const inkWidgetErrorFallback: WidgetErrorFallback = (error, widget) => (
  <Box flexDirection="column" borderStyle="round" borderColor="red" paddingX={1}>
    <Text color="red" bold>
      {widget.type}[{widget.uid}] failed
    </Text>
    <Text color="red">{error.message}</Text>
  </Box>
);
