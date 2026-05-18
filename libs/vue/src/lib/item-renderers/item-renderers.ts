import type { ItemRenderContext, ItemRenderItemData } from '@golemui/core';
import type { Component } from 'vue';

export type VueItemRenderer<T extends ItemRenderItemData> = Component<ItemRenderContext<T>>;
