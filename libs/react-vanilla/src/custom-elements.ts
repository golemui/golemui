import * as React from 'react';
import {
  GuiCalendar,
  GuiCheckbox,
  GuiCurrency,
  GuiDate,
  GuiErrors,
  GuiLabel,
  GuiList,
  GuiNumber,
  GuiPassword,
  GuiRadiogroup,
  GuiRangeCalendar,
  GuiSelect,
  GuiTextarea,
  GuiTextinput,
  GuiToggle,
} from '@golemui/shared-vanilla';

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'gui-textinput': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiTextinput>;
      'gui-password': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiPassword>;
      'gui-currency': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiCurrency>;
      'gui-list': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<Omit<GuiList, 'children'>>;
      'gui-label': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiLabel>;
      'gui-errors': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiErrors>;
      'gui-checkbox': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiCheckbox>;
      'gui-select': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiSelect>;
      'gui-date': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiDate>;
      'gui-calendar': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiCalendar>;
      'gui-range-calendar': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > &
        Partial<GuiRangeCalendar>;
      'gui-number': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiNumber>;
      'gui-radiogroup': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiRadiogroup>;
      'gui-textarea': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiTextarea>;
      'gui-toggle': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiToggle>;
    }
  }
}
