<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useDataStore } from '../stores/data'

const auth = useAuthStore()
const data = useDataStore()
const user = computed(() => auth.currentUser)
</script>

<template>
  <div>
    <h1 class="mb-4">Admin Dashboard</h1>
    <div class="alert alert-info">Welcome, {{ user?.name }} ({{ user?.role }})</div>
    <div class="card">
      <div class="card-body">
        <h5 class="card-title">All Items</h5>
        <ul class="list-group list-group-flush">
          <li v-for="it in data.items" :key="it.id" class="list-group-item d-flex justify-content-between align-items-center">
            <span>{{ it.name }}</span>
            <span class="badge text-bg-secondary">Avg: {{ data.getAverage(it.id).toFixed(2) }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>


