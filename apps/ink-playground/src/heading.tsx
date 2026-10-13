import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWidget } from '@golemui/react';
import { Text } from 'ink';

type HeadingWidgetProps = {
  text: string;
  level?: number;
};

/**
 * The playgrounds' custom `heading` widget, drawn for a terminal.
 *
 * A terminal has one font size, so the heading level is ignored and the text is only bold.
 */
export function Heading(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as DisplayWidget;
  const { templateData } = useDisplayWidget<HeadingWidgetProps>(widget);

  return <Text bold>{templateData.text}</Text>;
}
