<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useDataStore } from '../stores/data'
import { usePresenceStore } from '../stores/presence'
import { useBookingsStore } from '../stores/bookings'
import { useEventRegistrationsStore } from '../stores/eventRegistrations'
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
const bookings = useBookingsStore()
const eventRegistrations = useEventRegistrationsStore()
const user = computed(() => auth.currentUser)
const onlineCount = computed(() => presence.onlineCount)

const totalUsers = computed(() => auth.users.length)
const roleCounts = computed(() => {
  const map = { admin: 0, user: 0 }
  for (const u of auth.users) map[u.role === 'admin' ? 'admin' : 'user']++
  return map
})

// Event management data
const totalEvents = computed(() => 7) // Based on your demo events
const totalBookings = computed(() => {
  return bookings.bookings?.length || 0
})
const totalRegistrations = computed(() => {
  return eventRegistrations.myRegs?.length || 0
})
const participationRate = computed(() => {
  if (totalEvents.value === 0) return 0
  const totalCapacity = totalEvents.value * 12 // Assuming 12 capacity per event
  const totalParticipants = totalBookings.value + totalRegistrations.value
  return Math.round((totalParticipants / totalCapacity) * 100)
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

    <!-- User Management Section -->
    <div class="row g-3 mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <h3 class="h5 mb-0">👥 User Management</h3>
          </div>
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-md-3">
                <div class="card bg-primary text-white">
                  <div class="card-body text-center">
                    <div class="display-6">{{ totalUsers }}</div>
                    <div class="small">Total Users</div>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-success text-white">
                  <div class="card-body text-center">
                    <div class="display-6">{{ onlineCount }}</div>
                    <div class="small">Online Now</div>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-info text-white">
                  <div class="card-body text-center">
                    <div class="display-6">{{ roleCounts.admin }}</div>
                    <div class="small">Admins</div>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-warning text-white">
                  <div class="card-body text-center">
                    <div class="display-6">{{ roleCounts.user }}</div>
                    <div class="small">Regular Users</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="table-responsive">
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in auth.users" :key="user.id">
                    <td>{{ user.name }}</td>
                    <td>{{ user.email }}</td>
                    <td>
                      <span class="badge" :class="user.role === 'admin' ? 'bg-danger' : 'bg-secondary'">
                        {{ user.role }}
                      </span>
                    </td>
                    <td>
                      <span class="badge bg-success">Active</span>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-outline-primary">View</button>
                      <button class="btn btn-sm btn-outline-warning">Edit</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Event Management Section -->
    <div class="row g-3 mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <h3 class="h5 mb-0">📅 Event Management</h3>
          </div>
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-md-4">
                <div class="card bg-primary text-white">
                  <div class="card-body text-center">
                    <div class="display-6">{{ totalEvents }}</div>
                    <div class="small">Total Events</div>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card bg-success text-white">
                  <div class="card-body text-center">
                    <div class="display-6">{{ totalBookings }}</div>
                    <div class="small">Total Bookings</div>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card bg-info text-white">
                  <div class="card-body text-center">
                    <div class="display-6">{{ participationRate }}%</div>
                    <div class="small">Participation Rate</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="table-responsive">
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th>Event Name</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Capacity</th>
                    <th>Registered</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Coach GA Private Coaching</td>
                    <td>Oct 18, 2025</td>
                    <td>Melbourne CBD</td>
                    <td>1</td>
                    <td>1/1</td>
                    <td><span class="badge bg-success">Full</span></td>
                    <td>
                      <button class="btn btn-sm btn-outline-primary">View</button>
                      <button class="btn btn-sm btn-outline-warning">Edit</button>
                    </td>
                  </tr>
                  <tr>
                    <td>Carlton Session</td>
                    <td>Oct 19, 2025</td>
                    <td>Carlton</td>
                    <td>12</td>
                    <td>1/12</td>
                    <td><span class="badge bg-warning">Available</span></td>
                    <td>
                      <button class="btn btn-sm btn-outline-primary">View</button>
                      <button class="btn btn-sm btn-outline-warning">Edit</button>
                    </td>
                  </tr>
                  <tr>
                    <td>Richmond Session</td>
                    <td>Oct 20, 2025</td>
                    <td>Richmond</td>
                    <td>12</td>
                    <td>0/12</td>
                    <td><span class="badge bg-secondary">Open</span></td>
                    <td>
                      <button class="btn btn-sm btn-outline-primary">View</button>
                      <button class="btn btn-sm btn-outline-warning">Edit</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Ratings Section (Kept) -->
    <div class="row g-3 mb-3">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <h2 class="h6">Ratings (progress to 5★)</h2>
            <div :style="{height: chartH+'px', width: barW+'px'}">
              <Bar :data="itemsBar" :options="barOptions" />
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
</style>


