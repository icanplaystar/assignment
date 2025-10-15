<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useDataStore } from '../stores/data'
import { usePresenceStore } from '../stores/presence'
import { Bar, Pie } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, ArcElement, CategoryScale, LinearScale)

const auth = useAuthStore()
const data = useDataStore()
const presence = usePresenceStore()
const user = computed(() => auth.currentUser)
const onlineCount = computed(() => presence.onlineCount)

const totalUsers = computed(() => auth.users.length)
const roleCounts = computed(() => {
  const map = { admin: 0, user: 0 }
  for (const u of auth.users) map[u.role === 'admin' ? 'admin' : 'user']++
  return map
})

const rolePie = computed(() => ({
  labels: ['Admin', 'User'],
  datasets: [{ data: [roleCounts.value.admin, roleCounts.value.user], backgroundColor: ['#0d6efd', '#6c757d'] }]
}))

const itemsBar = computed(() => {
  const labels = data.items.map(i => i.name)
  const avgs = data.items.map(i => Number(data.getAverage(i.id).toFixed(2)))
  const remaining = avgs.map(v => Math.max(0, 5 - v))
  return {
    labels,
    datasets: [
      { label: 'Rating', data: avgs, backgroundColor: '#20c997', stack: 'rating' },
      { label: 'Remaining', data: remaining, backgroundColor: '#e9ecef', stack: 'rating' }
    ]
  }
})

const pieOptions = { responsive: false, maintainAspectRatio: false, animation: false }
const barOptions = {
  responsive: false,
  maintainAspectRatio: false,
  animation: false,
  indexAxis: 'y',
  scales: {
    x: { beginAtZero: true, max: 5, stacked: true, ticks: { callback: (v) => `${Math.round((Number(v) / 5) * 100)}%` } },
    y: { stacked: true }
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          if (ctx.dataset.label !== 'Rating') return null
          const v = Number(ctx.raw || 0)
          return ` ${v.toFixed(2)}★ (${Math.round((v / 5) * 100)}%)`
        }
      }
    }
  }
}
const chartH = 220
const pieW = 220
const barW = 420
</script>

<template>
  <div>
    <h1 class="mb-4">Admin Dashboard</h1>
    <div class="alert alert-info">Welcome, {{ user?.name }} ({{ user?.role }})</div>

    <div class="row g-3 mb-3">
      <div class="col-12 col-md-4">
        <div class="card h-100 text-center">
          <div class="card-body">
            <div class="display-6">{{ totalUsers }}</div>
            <div class="text-muted">Total Users</div>
          </div>
        </div>
      </div>
    <div class="col-12 col-md-4">
      <div class="card h-100 text-center">
        <div class="card-body">
          <div class="display-6">{{ onlineCount }}</div>
          <div class="text-muted">Online Now</div>
        </div>
      </div>
    </div>
      <div class="col-12 col-md-4">
        <div class="card h-100">
          <div class="card-body">
            <h2 class="h6">Users by Role</h2>
            <div :style="{height: chartH+'px', width: pieW+'px'}" class="mx-auto">
              <Pie :data="rolePie" :options="pieOptions" />
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <div class="card h-100">
          <div class="card-body">
            <h2 class="h6">Ratings (progress to 5★)</h2>
            <div :style="{height: chartH+'px', width: barW+'px'}">
              <Bar :data="itemsBar" :options="barOptions" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <h2 class="h6">Items</h2>
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


