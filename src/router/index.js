import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import BandPage from '../views/BandPage.vue';
import Gallery from '../views/Gallery.vue';
import StreamTest from '../views/StreamTest.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/band/:id',
    name: 'BandPage',
    component: BandPage,
    props: true
  },
  {
    path: '/gallery',
    name: 'Gallery',
    component: Gallery
  },
  {
    path: '/stream-test',
    name: 'StreamTest',
    component: StreamTest
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;