// eslint-disable-next-line import/no-namespace
import type * as React from 'react';
import type { GuiButton } from '@golemui/gui-components/button';
import type { GuiCalendar } from '@golemui/gui-components/calendar';
import type { GuiDateTimeCalendar } from '@golemui/gui-components/date-time-calendar';
import type { GuiCheckbox } from '@golemui/gui-components/checkbox';
import type { GuiCurrency } from '@golemui/gui-components/currency';
import type { GuiDate } from '@golemui/gui-components/date-input';
import type { GuiDatePicker } from '@golemui/gui-components/date-picker';
import type { GuiDateTimePicker } from '@golemui/gui-components/date-time-picker';
import type { GuiErrors } from '@golemui/gui-components/errors';
import type { GuiLabel } from '@golemui/gui-components/label';
import type { GuiList } from '@golemui/gui-components/list';
import type { GuiMarkdown } from '@golemui/gui-components/markdown';
import type { GuiMarkdownText } from '@golemui/gui-components/markdown-text';
import type { GuiNumber } from '@golemui/gui-components/number';
import type { GuiPassword } from '@golemui/gui-components/password';
import type { GuiPills } from '@golemui/gui-components/pills';
import type { GuiRadiogroup } from '@golemui/gui-components/radiogroup';
import type { GuiRangeCalendar } from '@golemui/gui-components/range-calendar';
import type { GuiRangeDateInput } from '@golemui/gui-components/range-date-input';
import type { GuiRangeDateTimeInput } from '@golemui/gui-components/range-date-time-input';
import type { GuiRangeDateTimeCalendar } from '@golemui/gui-components/range-date-time-calendar';
import type { GuiRangeDateTimePicker } from '@golemui/gui-components/range-date-time-picker';
import type { GuiRangeTimeInput } from '@golemui/gui-components/range-time-input';
import type { GuiRangeDatePicker } from '@golemui/gui-components/range-date-picker';
import type { GuiRangeTimePicker } from '@golemui/gui-components/range-time-picker';
import type { GuiSelect } from '@golemui/gui-components/select';
import type { GuiTags } from '@golemui/gui-components/tags';
import type { GuiTextarea } from '@golemui/gui-components/textarea';
import type { GuiTextinput } from '@golemui/gui-components/textinput';
import type { GuiTimeList } from '@golemui/gui-components/time-list';
import type { GuiTimePicker } from '@golemui/gui-components/time-picker';
import type { GuiToggle } from '@golemui/gui-components/toggle';

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'gui-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiButton>;
      'gui-calendar': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiCalendar>;
      'gui-date-time-calendar': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > &
        Partial<GuiDateTimeCalendar>;
      'gui-checkbox': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiCheckbox>;
      'gui-currency': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiCurrency>;

      'gui-date': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiDate>;
      'gui-date-picker': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiDatePicker>;
      'gui-date-time-picker': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > &
        Partial<GuiDateTimePicker>;

      'gui-errors': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiErrors>;

      'gui-label': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiLabel>;
      'gui-list': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<Omit<GuiList, 'children'>>;

      'gui-markdown': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiMarkdown>;

      'gui-markdown-text': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiMarkdownText>;

      'gui-number': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiNumber>;

      'gui-password': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiPassword>;

      'gui-pills': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiPills>;

      'gui-radiogroup': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiRadiogroup>;
      'gui-range-calendar': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > &
        Partial<GuiRangeCalendar>;
      'gui-range-date': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiRangeDateInput>;
      'gui-range-date-time': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > &
        Partial<GuiRangeDateTimeInput>;
      'gui-range-date-time-calendar': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > &
        Partial<GuiRangeDateTimeCalendar>;
      'gui-range-date-time-picker': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > &
        Partial<GuiRangeDateTimePicker>;
      'gui-range-time': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiRangeTimeInput>;
      'gui-range-date-picker': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > &
        Partial<GuiRangeDatePicker>;
      'gui-range-time-picker': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > &
        Partial<GuiRangeTimePicker>;

      'gui-select': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiSelect>;

      'gui-tags': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiTags>;

      'gui-textarea': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiTextarea>;
      'gui-textinput': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiTextinput>;
      'gui-time-list': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiTimeList>;
      'gui-time-picker': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiTimePicker>;
      'gui-toggle': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiToggle>;
    }
  }
}
