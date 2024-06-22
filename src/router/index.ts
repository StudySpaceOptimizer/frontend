import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import ProfileView from '@/views/ProfileView.vue'
import AdminViewVue from '@/views/AdminView.vue'
import { useAccountStore } from '@/stores/account'
import { ElMessage } from 'element-plus'

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
      component: ProfileView,
      meta: { requiresAuth: true }
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminViewVue,
      meta: { requiresAdmin: true },
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

router.beforeEach(async (to, from, next) => {
  const accountStore = useAccountStore();

  if (to.matched.some(record => record.meta.requiresAuth)) {
    await accountStore.checkIsSignIn();

    if (accountStore.isSignIn) {
      next();
    } else {
      next({ name: 'home' });
    }
  } else if (to.matched.some(record => record.meta.requiresAdmin)) {
    await accountStore.checkIsSignIn();

    if (accountStore.isSignIn && accountStore.adminRole === 'admin') {
      next();
    } else {
      ElMessage.error('權限不足');
      next({ name: 'home' });
    }
  } else {
    next();
  }
});

export default router
