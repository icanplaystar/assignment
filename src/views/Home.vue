<script setup>
import { computed } from 'vue'
import { useDataStore } from '../stores/data'
import { useAuthStore } from '../stores/auth'
import Rating from '../components/Rating.vue'

const dataStore = useDataStore()
const auth = useAuthStore()

const items = computed(() => dataStore.items)
const canRate = computed(() => auth.isAuthenticated)

function onRate(itemId, value) {
  if (!canRate.value) return
  dataStore.setRating(itemId, auth.currentUser?.id, value)
}
</script>

<template>
  <div>
    <!-- Hero section -->
    <div class="hero card shadow-sm mb-4 overflow-hidden">
      <div class="row g-0 align-items-center">
        <div class="col-12 col-lg-6 p-4">
          <h1 class="mb-2">Welcome to PingPong Pathways</h1>
          <p class="lead mb-3">A friendly community for table tennis in Melbourne. Find venues, join events, and stay active with inclusive, beginner‑friendly sessions.</p>
          <div class="d-flex gap-2">
            <router-link class="btn btn-primary" to="/venues/find">Find a Venue</router-link>
            <router-link class="btn btn-outline-secondary" to="/events/upcoming">Upcoming Events</router-link>
          </div>
        </div>
        <div class="col-12 col-lg-6 p-3 text-center">
          <!-- Inline SVG illustration (no external network needed) -->
          <svg class="hero-img rounded-4" viewBox="0 0 400 260" role="img" aria-label="Table tennis illustration">
            <defs>
              <linearGradient id="bgGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stop-color="#e7f0ff"/>
                <stop offset="100%" stop-color="#f5e8ff"/>
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="400" height="260" fill="url(#bgGrad)" rx="16"/>
            <!-- paddle 1 -->
            <circle cx="150" cy="120" r="55" fill="#ff6b6b"/>
            <rect x="190" y="150" width="20" height="70" rx="10" fill="#ffa8a8" transform="rotate(35 200 185)"/>
            <!-- paddle 2 -->
            <circle cx="250" cy="110" r="55" fill="#339af0"/>
            <rect x="210" y="140" width="20" height="70" rx="10" fill="#74c0fc" transform="rotate(-35 220 175)"/>
            <!-- ball -->
            <circle cx="205" cy="70" r="10" fill="#ffd43b"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Intro cards -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-md-4">
        <div class="card h-100 text-center p-3">
          <div class="icon-circle bg-primary-subtle text-primary">🤝</div>
          <h2 class="h5">Inclusive Community</h2>
          <p class="mb-0">Beginner‑friendly sessions and welcoming volunteers help everyone enjoy ping‑pong.</p>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <div class="card h-100 text-center p-3">
          <div class="icon-circle bg-success-subtle text-success">🎉</div>
          <h2 class="h5">Fun Events</h2>
          <p class="mb-0">Coaching, social doubles, and women & girls nights across Melbourne suburbs.</p>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <div class="card h-100 text-center p-3">
          <div class="icon-circle bg-warning-subtle text-warning">🌟</div>
          <h2 class="h5">Move & Feel Better</h2>
          <p class="mb-0">Light exercise and friendly matches to stay active and make new friends.</p>
        </div>
      </div>
    </div>

    <h2 class="mb-3">Featured Items</h2>
    <div class="row g-3">
      <div v-for="item in items" :key="item.id" class="col-12 col-md-6 col-lg-4">
        <div class="card h-100">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">{{ item.name }}</h5>
            <p class="card-text">{{ item.description }}</p>
            <div class="mt-auto position-relative">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <strong>Average:</strong> {{ dataStore.getAverage(item.id).toFixed(2) }} / 5
                </div>
              </div>
              <div class="mt-2 rating-corner">
                <Rating
                  :value="dataStore.getUserRating(item.id, auth.currentUser?.id)"
                  :readonly="!canRate"
                  @update:value="val => onRate(item.id, val)"
                />
                <div v-if="!canRate" class="form-text">Login to rate.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero { background: radial-gradient(1200px 600px at 0% 0%, rgba(13,110,253,0.08), transparent 60%),
                radial-gradient(1200px 700px at 100% 20%, rgba(102,16,242,0.08), transparent 60%); }
.hero-img { width: 100%; max-width: 400px; height: 260px; }
.icon-circle { width:80px; height:80px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:36px; margin:0 auto 8px; }
.rating-corner { position: absolute; right: 12px; bottom: 12px; }
</style>


