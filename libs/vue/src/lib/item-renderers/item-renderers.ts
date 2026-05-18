import type { ItemRenderContext, ItemRenderItemData } from '@golemui/core';
import type { Component } from 'vue';

// `Partial<>` because `template` and `value` are legitimately undefined while
// the list is still loading items or virtualized rows haven't been populated.
// Renderers handle that with optional chaining (`template?.foo`).
export type VueItemRenderer<T extends ItemRenderItemData> = Component<Partial<ItemRenderContext<T>>>;
