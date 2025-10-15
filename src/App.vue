<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useAuthStore } from './stores/auth'
import { useRouter } from 'vue-router'
import AiAssist from './components/AiAssist.vue'
import { useUiStore } from './stores/ui'
import { usePresenceStore } from './stores/presence'

const auth = useAuthStore()
const router = useRouter()
const ui = useUiStore()
const presence = usePresenceStore()

const isAuthenticated = computed(() => auth.isAuthenticated)
const isAdmin = computed(() => auth.currentUserRole === 'admin')
const displayName = computed(() => auth.currentUser?.name || auth.currentUser?.email || 'User')

function logout() {
  auth.logout()
  router.push({ name: 'home' })
}

onMounted(() => ui.apply())

function speak(text) {
  try {
    const utter = new SpeechSynthesisUtterance(String(text || ''))
    speechSynthesis.cancel(); speechSynthesis.speak(utter)
  } catch {}
}

function extractLabel(el) {
  if (!el) return ''
  const aria = el.getAttribute?.('aria-label')
  if (aria) return aria
  const alt = el.getAttribute?.('alt')
  if (alt) return alt
  const title = el.getAttribute?.('title')
  if (title) return title
  return (el.innerText || el.textContent || '').trim()
}

function onDocClick(e) {
  if (!ui.ttsEnabled) return
  const target = e.target
  const text = extractLabel(target)
  if (text) speak(text)
}

onMounted(() => {
  document.addEventListener('click', onDocClick, true)
  // presence
  presence.startListening()
  if (isAuthenticated.value) presence.startForCurrentUser()
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick, true)
  presence.stopListening()
  presence.stopForCurrentUser()
})
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
            
            <li class="nav-item"><router-link class="nav-link" to="/contact">Contact</router-link></li>
            <li class="nav-item"><router-link class="nav-link" to="/tables">Users and Events Table</router-link></li>
            <li v-if="isAuthenticated" class="nav-item"><router-link class="nav-link" to="/profile">Profile</router-link></li>
            <li v-if="isAuthenticated && isAdmin" class="nav-item"><router-link class="nav-link" to="/admin">Admin</router-link></li>
            <li v-if="isAuthenticated" class="nav-item"><router-link class="nav-link" to="/email">Email</router-link></li>
          </ul>
          <ul class="navbar-nav ms-auto">
            <li v-if="isAuthenticated" class="nav-item d-flex align-items-center me-2">
              <span class="navbar-text text-white-50 small">Hello, {{ displayName }}</span>
            </li>
            <li class="nav-item dropdown me-2">
              <a class="nav-link dropdown-toggle" href="#" id="navTextSize" role="button" data-bs-toggle="dropdown" aria-expanded="false">Text Size</a>
              <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navTextSize">
                <li><a class="dropdown-item" href="#" @click.prevent="ui.setFontSize('sm')">Small</a></li>
                <li><a class="dropdown-item" href="#" @click.prevent="ui.setFontSize('md')">Medium</a></li>
                <li><a class="dropdown-item" href="#" @click.prevent="ui.setFontSize('lg')">Large</a></li>
              </ul>
            </li>
            <li class="nav-item me-2 d-flex align-items-center">
              <button class="btn btn-outline-light btn-sm" :class="{ 'opacity-75': !ui.ttsEnabled }" @click="ui.toggleTts()" aria-pressed="ui.ttsEnabled" aria-label="Toggle voice mode">
                {{ ui.ttsEnabled ? 'Voice: ON' : 'Voice: OFF' }}
              </button>
            </li>
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
