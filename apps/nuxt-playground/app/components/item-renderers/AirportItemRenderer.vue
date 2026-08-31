<script setup lang="ts">
import type { ListItemRendererProps } from '@golemui/gui-vue';
import type { AirportItem } from '@golemui/apps-shared';

defineProps<ListItemRendererProps<AirportItem>>();
</script>

<template>
  <div
    :class="{
      airport: true,
      disabled: !!disabled,
      selected: !!selected,
      focused: !!focused,
      odd: index % 2 === 0,
    }"
  >
    <div>
      <p>{{ template?.name }}</p>
    </div>
    <div>
      <h2>{{ template?.iata }}</h2>
    </div>
  </div>
</template>

<style scoped>
.airport {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  cursor: pointer;
  height: 100%;
}
.airport h2,
.airport p {
  margin: 0;
  padding: 0;
}
.airport.odd {
  background-color: #3b3e47;
}
.airport.disabled {
  color: gray;
}
.airport.selected {
  color: black;
  background-color: lightgray;
  font-weight: bold;
}
.airport.focused {
  border: 2px solid black;
}
</style>
