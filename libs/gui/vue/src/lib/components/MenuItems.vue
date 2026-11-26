<script setup lang="ts">
import { isMenuGroup, menuGroupId, menuItemCy, type MenuItem } from '@golemui/gui-shared/internals';

// The items of one level of a navigation menu, and the levels inside them.
defineProps<{
  items: MenuItem[] | undefined;
  /** Whether this level's groups open dropdowns: the first level of a horizontal menu. */
  dropdowns: boolean;
  uid: string;
  domId: string;
  current: string | undefined;
  disabled: boolean;
  /** The values of the groups open in place. */
  open: string[];
}>();
</script>

<template>
  <li v-for="item in items ?? []" :key="item.value">
    <button
      type="button"
      :value="item.value"
      :data-cy="menuItemCy(uid, item.value)"
      :aria-current="!isMenuGroup(item) && item.value === current ? 'page' : undefined"
      :aria-expanded="isMenuGroup(item) && !dropdowns ? open.includes(item.value) : undefined"
      :aria-controls="isMenuGroup(item) && !dropdowns ? menuGroupId(domId, item.value) : undefined"
      :popovertarget="isMenuGroup(item) && dropdowns ? menuGroupId(domId, item.value) : undefined"
      :disabled="disabled || item.disabled === true"
    >
      <span
        v-if="item.icon"
        :class="`gui-widget-icon ${item.icon}`"
        :data-icon="item.icon"
        aria-hidden="true"
      ></span>
      <span>{{ item.label }}</span>
    </button>
    <gui-popover v-if="isMenuGroup(item) && dropdowns">
      <ul :id="menuGroupId(domId, item.value)" popover>
        <MenuItems
          :items="item.items"
          :dropdowns="false"
          :uid="uid"
          :dom-id="domId"
          :current="current"
          :disabled="disabled"
          :open="open"
        />
      </ul>
    </gui-popover>
    <ul
      v-else-if="isMenuGroup(item)"
      :id="menuGroupId(domId, item.value)"
      :hidden="!open.includes(item.value)"
    >
      <MenuItems
        :items="item.items"
        :dropdowns="false"
        :uid="uid"
        :dom-id="domId"
        :current="current"
        :disabled="disabled"
        :open="open"
      />
    </ul>
  </li>
</template>
