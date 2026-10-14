import {
  preloadFormWidgets,
  type FormEvent,
  type FormHealth,
  type FormSubmitEvent,
} from '@golemui/core';
import { type GuiFormInitConfig } from '@golemui/gui-shared';
import { resolveFormInput } from '@golemui/gui-shared/internals';
import { initValidators } from '@golemui/gui-validators';
import {
  createFormComponent,
  type FormComponentHandle,
  type FormHealthBoundary,
  type WidgetErrorFallback,
} from '@golemui/react';
import { useEffect, useRef, useState, type Ref } from 'react';
import { InkFormHealthBoundary, inkWidgetErrorFallback } from '../boundaries';
import { FocusManager } from '../internal/focus/FocusManager';
import { ThemeProvider, type ThemeOverrides } from '../theme';
import { widgetLoaders } from '../widget.loaders';

/** Props of {@link GuiForm}. */
export interface InkFormComponentProps {
  config: GuiFormInitConfig;
  formEvent?: (event: FormEvent) => void;
  formSubmit?: (event: FormSubmitEvent) => void;
  formHealth?: (formHealth: FormHealth) => void;
  /** Wraps the form and renders the error UI for an errored FormHealth. Defaults to a red box. */
  formHealthBoundary?: FormHealthBoundary;
  /** Replacement UI for a widget that threw. Defaults to a red box naming the widget. */
  widgetErrorFallback?: WidgetErrorFallback;
  /**
   * Colors and glyphs that replace the ones of `defaultTheme`. Ink only, the other widget sets are
   * styled with CSS.
   *
   * @example
   * <GuiForm config={config} theme={{ colors: { focus: '#00afff' } }} />
   */
  theme?: ThemeOverrides;
  /** Receives the `setData` and `setMeta` handle of the form. */
  ref?: Ref<FormComponentHandle>;
}

const InkForm = createFormComponent<GuiFormInitConfig>(
  {
    widgetLoaders,
    validators: initValidators,
    resolveFormInput,
  },
  {
    // Ink cannot render a div or a form element, so the widget tree is rendered on its own.
    headless: true,
    widgetErrorFallback: inkWidgetErrorFallback,
    formHealthBoundary: InkFormHealthBoundary,
  },
);

/**
 * Renders a gui form definition in a terminal. Render it with Ink's `render`.
 *
 * @param props - The form config, the event callbacks, the error UI, the theme and the ref.
 * @returns Nothing until the widgets are loaded, then the form.
 *
 * @example
 * render(<GuiForm config={{ formDef }} formSubmit={(event) => console.log(event.data)} />);
 */
export function GuiForm({ theme, ref, ...formProps }: InkFormComponentProps) {
  const [arePreloaded, setArePreloaded] = useState(false);

  // The focus manager reads its registry once, in the mount effect that follows the first commit.
  // Preloading mounts the whole tree in that one commit, so the registry is complete and the focus
  // starts on the first field of the definition instead of on whichever module resolved first.
  //
  // The loaders are read from a ref so a host that builds `customWidgetLoaders` inline does not
  // preload again on every render. A loader added later still loads on demand through the
  // registry, and by then the initial focus is already settled.
  const widgetLoadersRef = useRef(formProps.config.customWidgetLoaders);
  useEffect(() => {
    let isMounted = true;
    const loaders = { ...widgetLoaders, ...(widgetLoadersRef.current ?? {}) };
    // A failed loader must not leave an empty screen. The form renders anyway, the renderer
    // retries the import per widget, and a second failure is reported as a form health error.
    const showForm = () => {
      if (isMounted) {
        setArePreloaded(true);
      }
    };
    preloadFormWidgets({ widgetLoaders: loaders }).then(showForm, showForm);
    return () => {
      isMounted = false;
    };
  }, []);

  if (!arePreloaded) {
    return null;
  }
  // The manager sits above the widget tree and inside the Ink tree, which is where it can both
  // own the form level Tab handling and see every widget register.
  return (
    <ThemeProvider overrides={theme}>
      <FocusManager>
        <InkForm ref={ref} {...formProps} />
      </FocusManager>
    </ThemeProvider>
  );
}
