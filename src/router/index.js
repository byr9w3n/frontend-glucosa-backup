import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import Registro from '../components/Registro.vue'
import DashboardPrincipal from '../components/Dashboard/DashboardPrincipal.vue'
import Formulario from '../components/Formulario.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/registro', component: Registro },
  { path: '/dashboard', component: DashboardPrincipal },
  { path: '/formulario', component: Formulario }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router