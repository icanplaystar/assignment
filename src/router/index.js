import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Profile from '../views/Profile.vue'
import Admin from '../views/Admin.vue'
import { useAuthStore } from '../stores/auth'
// Newly added sitemap views
const Programs = () => import('../views/Programs.vue')
const CommunitySessions = () => import('../views/programs/CommunitySessions.vue')
const YouthPathways = () => import('../views/programs/YouthPathways.vue')
const WomenGirlsNights = () => import('../views/programs/WomenGirlsNights.vue')

const FindVenue = () => import('../views/venues/FindVenue.vue')
const UpcomingEvents = () => import('../views/events/UpcomingEvents.vue')

const GettingStarted = () => import('../views/resources/GettingStarted.vue')
const HealthWellbeing = () => import('../views/resources/HealthWellbeing.vue')
const SafetyInclusion = () => import('../views/resources/SafetyInclusion.vue')

const Volunteer = () => import('../views/getinvolved/Volunteer.vue')
const PartnerWithUs = () => import('../views/getinvolved/PartnerWithUs.vue')
const Donate = () => import('../views/getinvolved/Donate.vue')

const ParticipantStories = () => import('../views/stories/ParticipantStories.vue')
const NewsHighlights = () => import('../views/stories/NewsHighlights.vue')

const MissionImpact = () => import('../views/about/MissionImpact.vue')
const GovernanceReports = () => import('../views/about/GovernanceReports.vue')

const Contact = () => import('../views/contact/Contact.vue')
const Faqs = () => import('../views/contact/Faqs.vue')
const Email = () => import('../views/Email.vue')
const Tables = () => import('../views/Tables.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/login', name: 'login', component: Login, meta: { guestOnly: true } },
    { path: '/register', name: 'register', component: Register, meta: { guestOnly: true } },
    { path: '/profile', name: 'profile', component: Profile, meta: { requiresAuth: true } },
    { path: '/admin', name: 'admin', component: Admin, meta: { requiresAuth: true, roles: ['admin'] } },
    { path: '/email', name: 'email', component: Email, meta: { requiresAuth: true } },
    // Programs
    { path: '/programs', name: 'programs', component: Programs },
    { path: '/programs/community', name: 'programs-community', component: CommunitySessions },
    { path: '/programs/youth', name: 'programs-youth', component: YouthPathways },
    { path: '/programs/women', name: 'programs-women', component: WomenGirlsNights },
    // Venues & Events
    { path: '/venues/find', name: 'find-venue', component: FindVenue },
    { path: '/events/upcoming', name: 'upcoming-events', component: UpcomingEvents },
    // Resources
    { path: '/resources/getting-started', name: 'getting-started', component: GettingStarted },
    { path: '/resources/health', name: 'health-wellbeing', component: HealthWellbeing },
    { path: '/resources/safety', name: 'safety-inclusion', component: SafetyInclusion },
    // Get Involved
    { path: '/involved/volunteer', name: 'volunteer', component: Volunteer },
    { path: '/involved/partner', name: 'partner-with-us', component: PartnerWithUs },
    { path: '/involved/donate', name: 'donate', component: Donate },
    // Stories
    { path: '/stories/participants', name: 'participant-stories', component: ParticipantStories },
    { path: '/stories/news', name: 'news-highlights', component: NewsHighlights },
    // About
    { path: '/about/mission', name: 'mission-impact', component: MissionImpact },
    { path: '/about/governance', name: 'governance-reports', component: GovernanceReports },
    // Contact & FAQs
    { path: '/contact', name: 'contact', component: Contact },
    { path: '/faqs', name: 'faqs', component: Faqs },
    { path: '/tables', name: 'tables', component: Tables },
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


