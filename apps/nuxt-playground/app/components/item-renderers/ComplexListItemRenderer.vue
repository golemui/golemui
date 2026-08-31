<script setup lang="ts">
import type { ListItemRendererProps } from '@golemui/gui-vue';

type ComplexItem = {
  title: string;
  description: string;
};

defineProps<ListItemRendererProps<ComplexItem>>();
</script>

<template>
  <div
    :class="{
      'my-custom-class': true,
      disabled: !!disabled,
      selected: !!selected,
      focused: !!focused,
      odd: index % 2 === 0,
    }"
  >
    <h2>{{ template?.title }}</h2>
    <p>{{ template?.description }}</p>
  </div>
</template>

<style scoped>
.my-custom-class {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 0 12px;
  cursor: pointer;
  height: 100%;
}
.my-custom-class h2,
.my-custom-class p {
  margin: 0;
  padding: 0;
}
.my-custom-class.odd {
  background-color: #3b3e47;
}
.my-custom-class.disabled {
  color: gray;
}
.my-custom-class.selected {
  color: black;
  background-color: lightgray;
  font-weight: bold;
}
.my-custom-class.focused {
  border: 2px solid black;
}
</style>
