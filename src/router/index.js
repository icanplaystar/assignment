import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Profile from '../views/Profile.vue'
import Admin from '../views/Admin.vue'
import { useAuthStore } from '../stores/auth'

const FindVenue = () => import('../views/venues/FindVenue.vue')
const UpcomingEvents = () => import('../views/events/UpcomingEvents.vue')

// removed Programs/Resources/Get Involved/Stories sections for a simpler app

const MissionImpact = () => import('../views/about/MissionImpact.vue')
const GovernanceReports = () => import('../views/about/GovernanceReports.vue')

const Contact = () => import('../views/contact/Contact.vue')
const Faqs = () => import('../views/contact/Faqs.vue')
const Email = () => import('../views/Email.vue')
const Tables = () => import('../views/Tables.vue')
const Calendar = () => import('../views/Calendar.vue')
const BulkEmail = () => import('../views/BulkEmail.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/login', name: 'login', component: Login, meta: { guestOnly: true } },
    { path: '/register', name: 'register', component: Register, meta: { guestOnly: true } },
    { path: '/profile', name: 'profile', component: Profile, meta: { requiresAuth: true } },
    { path: '/admin', name: 'admin', component: Admin, meta: { requiresAuth: true, roles: ['admin'] } },
    { path: '/email', name: 'email', component: Email, meta: { requiresAuth: true } },
    // Venues & Events
    { path: '/venues/find', name: 'find-venue', component: FindVenue },
    { path: '/events/upcoming', name: 'upcoming-events', component: UpcomingEvents },
    // About
    { path: '/about/mission', name: 'mission-impact', component: MissionImpact },
    { path: '/about/governance', name: 'governance-reports', component: GovernanceReports },
    // Contact & FAQs
    { path: '/contact', name: 'contact', component: Contact },
    { path: '/faqs', name: 'faqs', component: Faqs },
    { path: '/tables', name: 'tables', component: Tables },
    { path: '/calendar', name: 'calendar', component: Calendar, meta: { requiresAuth: true } },
    { path: '/bulk-email', name: 'bulk-email', component: BulkEmail, meta: { requiresAuth: true, roles: ['admin'] } },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta?.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta?.roles && !to.meta.roles.includes(auth.currentUserRole)) {
    return { name: 'home' }
  }
  if (to.meta?.guestOnly && auth.isAuthenticated) {
    return { name: 'home' }
  }
  return true
})

export default router


