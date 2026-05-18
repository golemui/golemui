import type { DetailedHTMLProps, HTMLAttributes } from 'react'
import {
  type GuiButton,
  type GuiCalendar,
  type GuiCheckbox,
  type GuiCurrency,
  type GuiDate,
  type GuiErrors,
  type GuiLabel,
  type GuiList,
  type GuiMarkdown,
  type GuiMarkdownText,
  type GuiNumber,
  type GuiPassword,
  type GuiRadiogroup,
  type GuiRangeCalendar,
  type GuiRangeDateInput,
  type GuiSelect,
  type GuiTextarea,
  type GuiTextinput,
  type GuiToggle,
} from '@golemui/gui-components';

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'gui-button': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiButton>;
      'gui-calendar': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiCalendar>;
      'gui-checkbox': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiCheckbox>;
      'gui-currency': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiCurrency>;

      'gui-date': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiDate>;

      'gui-errors': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiErrors>;

      'gui-label': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiLabel>;
      'gui-list': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<Omit<GuiList, 'children'>>;

      'gui-markdown': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiMarkdown>;

      'gui-markdown-text': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiMarkdownText>;

      'gui-number': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiNumber>;

      'gui-password': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiPassword>;

      'gui-radiogroup': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiRadiogroup>;
      'gui-range-calendar': DetailedHTMLProps<
        HTMLAttributes<HTMLElement>,
        HTMLElement
      > &
        Partial<GuiRangeCalendar>;
      'gui-range-date': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiRangeDateInput>;

      'gui-select': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiSelect>;

      'gui-textarea': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiTextarea>;
      'gui-textinput': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiTextinput>;
      'gui-toggle': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiToggle>;
    }
  }
}
