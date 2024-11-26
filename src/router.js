// src/router.js
import { createRouter, createWebHistory } from 'vue-router';
import LoginPage from './components/login.vue';
import LandingPage from './components/landing.vue';
import AboutPage from './components/about.vue';
import LivePage from './components/live.vue';
import RegisterPage from './components/register.vue';
import ContactPage from './components/contact.vue';
import VoterComponent from '@/components/voters.vue';
import DetailsPage from '@/components/details.vue';

const routes = [
  { path: '/', component: LoginPage },
  { path: '/landing', component: LandingPage },
  { path: '/about', component: AboutPage },
  { path: '/live', component: LivePage },
  { path: '/register', component: RegisterPage },
  { path: '/contact', component: ContactPage },
  { path: '/voters', component: VoterComponent },
  { path: '/details', component: DetailsPage },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
