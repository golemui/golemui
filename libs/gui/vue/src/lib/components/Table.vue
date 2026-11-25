<script setup lang="ts">
import { computed } from 'vue';
import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWidget } from '@golemui/vue';
import { tableCellClass, tableCellText, type TableProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/table';

const props = defineProps<WithWidget>();
const widget = props.widget as DisplayWidget;
const { domId, templateData } = useDisplayWidget<TableProps>(widget);
const columns = computed(() => templateData.value.columns ?? []);
</script>

<template>
  <div class="gui-table gui-field">
    <gui-table :id="domId">
      <table>
        <caption>
          {{
            templateData.caption
          }}
        </caption>
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :class="tableCellClass(column)"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-if="templateData.rows?.length">
            <tr v-for="(row, index) in templateData.rows" :key="index">
              <td v-for="column in columns" :key="column.key" :class="tableCellClass(column)">
                {{ tableCellText(row[column.key], column, templateData.lang) }}
              </td>
            </tr>
          </template>
          <tr v-else-if="templateData.emptyMessage">
            <td class="gui-table__empty" :colspan="columns.length">
              {{ templateData.emptyMessage }}
            </td>
          </tr>
        </tbody>
      </table>
    </gui-table>
  </div>
</template>
