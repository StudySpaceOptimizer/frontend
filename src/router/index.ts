import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import ProfileView from '@/views/ProfileView.vue'
import AdminViewVue from '@/views/AdminView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminViewVue,
      children: [
        {
          path: 'user',
          name: 'admin-user',
          component: () => import('@/views/admin/UserView.vue')
        },
        {
          path: 'visitor',
          name: 'admin-visitor',
          component: () => import('@/views/admin/VisitorView.vue')
        },
        {
          path: 'seat',
          name: 'admin-seat',
          component: () => import('@/views/admin/SeatView.vue')
        },
        {
          path: 'setting',
          name: 'admin-setting',
          component: () => import('@/views/admin/SettingView.vue')
        },
        {
          path: '',
          name: 'admin-booking',
          component: () => import('@/views/admin/BookingView.vue')
        },
        {
          path: '/:pathMatch(.*)*',
          name: 'admin-booking-default',
          component: () => import('@/views/admin/BookingView.vue')
        }
      ]
    }
  ]
})

export default router
