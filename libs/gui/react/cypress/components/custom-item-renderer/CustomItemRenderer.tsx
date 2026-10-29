import type { ItemRenderContext } from '@golemui/core';

/** Shows every field of the render context, so a test can read what the widget passed. */
export function CustomItemRenderer(props: ItemRenderContext<{ name: string }>) {
  return (
    <div data-cy="custom-item">
      {`${props.index}|${props.value}|${props.template.name}|${props.selected === true}`}
    </div>
  );
}
