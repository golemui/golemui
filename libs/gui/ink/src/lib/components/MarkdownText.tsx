import type { DisplayWidget, WithWidget } from '@golemui/core';
import type { MarkdownTextProps } from '@golemui/gui-shared/internals';
import { useDisplayWidget } from '@golemui/react';
import { Box, Text } from 'ink';

/**
 * The `markdownText` display widget.
 *
 * The markdown source is printed verbatim. Nothing parses it, so a form written for the DOM
 * shows its markup characters in the terminal.
 */
export function MarkdownText(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as DisplayWidget;
  const { templateData } = useDisplayWidget<MarkdownTextProps>(widget);

  return (
    <Box flexGrow={templateData.size ?? 1} flexBasis={0}>
      <Text>{templateData.md ?? ''}</Text>
    </Box>
  );
}
