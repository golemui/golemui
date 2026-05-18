import { createRouter, createWebHashHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('./pages/Landing.vue'),
    },
    {
      path: '/json/kitchen-sink',
      name: 'json-kitchen-sink',
      component: () => import('./pages/form/FormPage.vue'),
    },
    {
      path: '/dx/kitchen-sink',
      name: 'dx-kitchen-sink',
      component: () => import('./pages/dx-form/DxFormPage.vue'),
    },
    {
      path: '/dx/modular',
      name: 'dx-modular',
      component: () => import('./pages/modular-dx/ModularDxPage.vue'),
    },
  ],
});
