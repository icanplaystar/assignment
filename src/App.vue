<script setup>
import { computed } from 'vue'
import { useAuthStore } from './stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const isAuthenticated = computed(() => auth.isAuthenticated)
const isAdmin = computed(() => auth.currentUserRole === 'admin')

function logout() {
  auth.logout()
  router.push({ name: 'home' })
}
</script>

<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
        <a class="navbar-brand" href="#" @click.prevent="$router.push({ name: 'home' })">PingPong Pathways</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarsExample">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarsExample">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item"><router-link class="nav-link" to="/">Home</router-link></li>
            <li class="nav-item"><router-link class="nav-link" to="/tables">Tables</router-link></li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="navPrograms" role="button" data-bs-toggle="dropdown" aria-expanded="false">Programs</a>
              <ul class="dropdown-menu" aria-labelledby="navPrograms">
                <li><router-link class="dropdown-item" to="/programs">Overview</router-link></li>
                <li><router-link class="dropdown-item" to="/programs/community">Community Sessions</router-link></li>
                <li><router-link class="dropdown-item" to="/programs/youth">Youth Pathways</router-link></li>
                <li><router-link class="dropdown-item" to="/programs/women">Women & Girls Nights</router-link></li>
              </ul>
            </li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="navVenues" role="button" data-bs-toggle="dropdown" aria-expanded="false">Venues & Events</a>
              <ul class="dropdown-menu" aria-labelledby="navVenues">
                <li><router-link class="dropdown-item" to="/venues/find">Find a Venue</router-link></li>
                <li><router-link class="dropdown-item" to="/events/upcoming">Upcoming Events</router-link></li>
                <li><router-link class="dropdown-item" to="/tables">Tables</router-link></li>
              </ul>
            </li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="navResources" role="button" data-bs-toggle="dropdown" aria-expanded="false">Resources</a>
              <ul class="dropdown-menu" aria-labelledby="navResources">
                <li><router-link class="dropdown-item" to="/resources/getting-started">Getting Started</router-link></li>
                <li><router-link class="dropdown-item" to="/resources/health">Health & Wellbeing</router-link></li>
                <li><router-link class="dropdown-item" to="/resources/safety">Safety & Inclusion</router-link></li>
              </ul>
            </li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="navInvolved" role="button" data-bs-toggle="dropdown" aria-expanded="false">Get Involved</a>
              <ul class="dropdown-menu" aria-labelledby="navInvolved">
                <li><router-link class="dropdown-item" to="/involved/volunteer">Volunteer</router-link></li>
                <li><router-link class="dropdown-item" to="/involved/partner">Partner with Us</router-link></li>
                <li><router-link class="dropdown-item" to="/involved/donate">Donate</router-link></li>
              </ul>
            </li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="navStories" role="button" data-bs-toggle="dropdown" aria-expanded="false">Stories</a>
              <ul class="dropdown-menu" aria-labelledby="navStories">
                <li><router-link class="dropdown-item" to="/stories/participants">Participant Stories</router-link></li>
                <li><router-link class="dropdown-item" to="/stories/news">News & Highlights</router-link></li>
              </ul>
            </li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="navAbout" role="button" data-bs-toggle="dropdown" aria-expanded="false">About</a>
              <ul class="dropdown-menu" aria-labelledby="navAbout">
                <li><router-link class="dropdown-item" to="/about/mission">Mission & Impact</router-link></li>
                <li><router-link class="dropdown-item" to="/about/governance">Governance & Reports</router-link></li>
              </ul>
            </li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="navContact" role="button" data-bs-toggle="dropdown" aria-expanded="false">Contact & FAQs</a>
              <ul class="dropdown-menu" aria-labelledby="navContact">
                <li><router-link class="dropdown-item" to="/contact">Contact</router-link></li>
                <li><router-link class="dropdown-item" to="/faqs">FAQs</router-link></li>
              </ul>
            </li>
            <li v-if="isAuthenticated" class="nav-item"><router-link class="nav-link" to="/profile">Profile</router-link></li>
            <li v-if="isAuthenticated && isAdmin" class="nav-item"><router-link class="nav-link" to="/admin">Admin</router-link></li>
            <li v-if="isAuthenticated" class="nav-item"><router-link class="nav-link" to="/email">Email</router-link></li>
          </ul>
          <ul class="navbar-nav ms-auto">
            <li v-if="!isAuthenticated" class="nav-item"><router-link class="nav-link" to="/login">Login</router-link></li>
            <li v-if="!isAuthenticated" class="nav-item"><router-link class="nav-link" to="/register">Register</router-link></li>
            <li v-if="isAuthenticated" class="nav-item"><button class="btn btn-outline-light btn-sm" @click="logout">Logout</button></li>
          </ul>
        </div>
      </div>
    </nav>

    <main class="container-fluid my-4">
      <router-view />
    </main>
  </div>
  
</template>

<style scoped>
/* Keep scoped minimal; Bootstrap provides most styles */
</style>
