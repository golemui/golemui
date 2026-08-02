import type { DxRuntimeParams } from '@golemui/dx';
import type { AlertDecorator, AlertEntry, GuiAlertShortcut } from './alert.domain';

type AlertFactoryProps = AlertDecorator;

export function _guiAlert(props: AlertFactoryProps, tags?: string[]): GuiAlertShortcut;
export function _guiAlert(
  callback: (params: DxRuntimeParams) => AlertFactoryProps,
  tags?: string[],
): GuiAlertShortcut;
export function _guiAlert(
  propsOrCallback: AlertFactoryProps | ((params: DxRuntimeParams) => AlertFactoryProps),
  tags?: string[],
): GuiAlertShortcut {
  const items: AlertEntry[] = [propsOrCallback];
  return { type: 'ITEMS', itemType: 'ALERTS', items, tags: tags ?? [] };
}
