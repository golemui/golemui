import * as React from 'react';
import {
  GuiCalendar,
  GuiCheckbox,
  GuiCurrency,
  GuiDate,
  GuiErrors,
  GuiLabel,
  GuiList,
  GuiMarkdown,
  GuiNumber,
  GuiPassword,
  GuiRadiogroup,
  GuiRangeCalendar,
  GuiRangeDateInput,
  GuiSelect,
  GuiTextarea,
  GuiTextinput,
  GuiToggle,
} from '@golemui/gui-components';

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'gui-calendar': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiCalendar>;
      'gui-checkbox': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiCheckbox>;
      'gui-currency': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiCurrency>;

      'gui-date': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiDate>;

      'gui-errors': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiErrors>;

      'gui-label': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiLabel>;
      'gui-list': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<Omit<GuiList, 'children'>>;

      'gui-markdown': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiMarkdown>;

      'gui-number': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiNumber>;

      'gui-password': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiPassword>;

      'gui-radiogroup': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiRadiogroup>;
      'gui-range-calendar': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > &
        Partial<GuiRangeCalendar>;
      'gui-range-date': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > &
        Partial<GuiRangeDateInput>;

      'gui-select': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiSelect>;

      'gui-textarea': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiTextarea>;
      'gui-textinput': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiTextinput>;
      'gui-toggle': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiToggle>;
    }
  }
}
