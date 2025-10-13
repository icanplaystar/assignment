<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const user = computed(() => auth.currentUser)
</script>

<template>
  <div>
    <h1 class="mb-4">Your Profile</h1>
    <div class="card">
      <div class="card-body">
        <p class="mb-1"><strong>Name:</strong> {{ user?.name }}</p>
        <p class="mb-1"><strong>Email:</strong> {{ user?.email }}</p>
        <p class="mb-0"><strong>Role:</strong> {{ user?.role }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>


