<script setup lang="ts">
import type { ListItemRendererProps } from '@golemui/gui-vue';

type ProductItem = {
  product: string;
  description: string;
  price: string;
};

defineProps<ListItemRendererProps<ProductItem>>();
</script>

<template>
  <div
    :class="{
      product: true,
      disabled: !!disabled,
      selected: !!selected,
      focused: !!focused,
      odd: index % 2 === 0,
    }"
  >
    <div>
      <h2>{{ template?.product }}</h2>
      <p>{{ template?.description }}</p>
    </div>
    <div>
      <p>{{ template?.price }}</p>
    </div>
  </div>
</template>

<style scoped>
.product {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  cursor: pointer;
  height: 100%;
}
.product h2,
.product p {
  margin: 0;
  padding: 0;
}
.product.odd {
  background-color: #3b3e47;
}
.product.disabled {
  color: gray;
}
.product.selected {
  color: black;
  background-color: lightgray;
  font-weight: bold;
}
.product.focused {
  border: 2px solid black;
}
</style>
