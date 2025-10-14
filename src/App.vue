<script setup>
import { computed } from 'vue'
import { useAuthStore } from './stores/auth'
import { useRouter } from 'vue-router'
import AiAssist from './components/AiAssist.vue'

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
    <a href="#main" class="visually-hidden-focusable skip-link">Skip to main content</a>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark" role="navigation" aria-label="Primary">
      <div class="container-fluid">
        <a class="navbar-brand" href="#" @click.prevent="$router.push({ name: 'home' })"><span role="img" aria-label="PingPong Pathways brand">PingPong Pathways</span></a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarsExample" aria-controls="navbarsExample" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarsExample">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item"><router-link class="nav-link" to="/">Home</router-link></li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="navVenues" role="button" data-bs-toggle="dropdown" aria-expanded="false">Venues & Events</a>
              <ul class="dropdown-menu" aria-labelledby="navVenues">
                <li><router-link class="dropdown-item" to="/venues/find">Find a Venue</router-link></li>
                <li><router-link class="dropdown-item" to="/events/upcoming">Upcoming Events</router-link></li>
                <li><router-link class="dropdown-item" to="/calendar">Calendar</router-link></li>
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
            <li v-if="isAuthenticated && isAdmin" class="nav-item"><router-link class="nav-link" to="/bulk-email">Bulk Email</router-link></li>
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

    <main id="main" class="container-fluid my-4" role="main">
      <router-view aria-live="polite" />
      <AiAssist />
    </main>
  </div>
  
</template>

<style scoped>
/* Keep scoped minimal; Bootstrap provides most styles */
</style>
