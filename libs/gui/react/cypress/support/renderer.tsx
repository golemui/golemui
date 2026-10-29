import { type RenderTextFn } from '@golemui/ui-testing';

/** Builds a span with the class `renderer-text` for the renderer display tests. */
export const renderText: RenderTextFn = (text) => <span className="renderer-text">{text}</span>;
