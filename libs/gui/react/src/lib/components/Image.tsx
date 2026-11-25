import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWidget } from '@golemui/react';
import { imageClasses, type ImageProps } from '@golemui/gui-shared/internals';

export function Image(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as DisplayWidget;
  const { domId, templateData } = useDisplayWidget<ImageProps>(widget);
  const { src, alt, ratio, fit, caption, loading } = templateData;

  return (
    <div className="gui-image-field gui-field">
      <figure id={domId} className={imageClasses({ ratio, fit })}>
        <img
          src={src}
          alt={(alt as string | undefined) ?? ''}
          loading={loading || 'lazy'}
          decoding="async"
        />
        {caption ? <figcaption>{caption as string}</figcaption> : null}
      </figure>
    </div>
  );
}
