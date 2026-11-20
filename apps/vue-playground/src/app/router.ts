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
      path: '/json/signup',
      name: 'json-signup',
      component: () => import('./pages/signup/SignupPage.vue'),
    },
  ],
});
