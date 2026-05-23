import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import type { GuiButton } from '@golemui/gui-components/button';
import type { GuiCalendar } from '@golemui/gui-components/calendar';
import type { GuiCheckbox } from '@golemui/gui-components/checkbox';
import type { GuiCurrency } from '@golemui/gui-components/currency';
import type { GuiDate } from '@golemui/gui-components/date-input';
import type { GuiErrors } from '@golemui/gui-components/errors';
import type { GuiLabel } from '@golemui/gui-components/label';
import type { GuiList } from '@golemui/gui-components/list';
import type { GuiMarkdown } from '@golemui/gui-components/markdown';
import type { GuiMarkdownText } from '@golemui/gui-components/markdown-text';
import type { GuiNumber } from '@golemui/gui-components/number';
import type { GuiPassword } from '@golemui/gui-components/password';
import type { GuiRadiogroup } from '@golemui/gui-components/radiogroup';
import type { GuiRangeCalendar } from '@golemui/gui-components/range-calendar';
import type { GuiRangeDateInput } from '@golemui/gui-components/range-date-input';
import type { GuiSelect } from '@golemui/gui-components/select';
import type { GuiTags } from '@golemui/gui-components/tags';
import type { GuiTextarea } from '@golemui/gui-components/textarea';
import type { GuiTextinput } from '@golemui/gui-components/textinput';
import type { GuiToggle } from '@golemui/gui-components/toggle';

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

      'gui-date': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & Partial<GuiDate>;

      'gui-errors': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiErrors>;

      'gui-label': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & Partial<GuiLabel>;
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
      'gui-range-calendar': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiRangeCalendar>;
      'gui-range-date': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiRangeDateInput>;

      'gui-select': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiSelect>;

      'gui-tags': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & Partial<GuiTags>;

      'gui-textarea': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiTextarea>;
      'gui-textinput': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiTextinput>;
      'gui-toggle': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
        Partial<GuiToggle>;
    }
  }
}
