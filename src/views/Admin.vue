<script setup>
import { computed, ref } from 'vue'
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

// Event management functions
const showAddEventModal = ref(false)
const newEvent = ref({
  name: '',
  date: '',
  time: '',
  location: '',
  capacity: 12
})

// Demo events data (in real app, this would come from Firestore)
const events = ref([
  { id: 1, name: 'Coach GA Private Coaching', date: 'Oct 18, 2025', time: '6:00 PM', location: 'Melbourne CBD', capacity: 1, registered: 1, status: 'Full' },
  { id: 2, name: 'Carlton Session', date: 'Oct 19, 2025', time: '6:00 PM', location: 'Carlton', capacity: 12, registered: 1, status: 'Available' },
  { id: 3, name: 'Richmond Session', date: 'Oct 20, 2025', time: '6:00 PM', location: 'Richmond', capacity: 12, registered: 0, status: 'Open' },
  { id: 4, name: 'Southbank Session', date: 'Oct 21, 2025', time: '6:00 PM', location: 'Southbank', capacity: 12, registered: 0, status: 'Open' },
  { id: 5, name: 'Docklands Session', date: 'Oct 22, 2025', time: '6:00 PM', location: 'Docklands', capacity: 12, registered: 0, status: 'Open' },
  { id: 6, name: 'Fitzroy Session', date: 'Oct 23, 2025', time: '6:00 PM', location: 'Fitzroy', capacity: 12, registered: 0, status: 'Open' },
  { id: 7, name: 'St Kilda Session', date: 'Oct 24, 2025', time: '6:00 PM', location: 'St Kilda', capacity: 12, registered: 0, status: 'Open' }
])

const addEvent = () => {
  if (!newEvent.value.name || !newEvent.value.date || !newEvent.value.time || !newEvent.value.location) {
    alert('Please fill in all required fields')
    return
  }
  
  const newId = Math.max(...events.value.map(e => e.id)) + 1
  events.value.push({
    id: newId,
    name: newEvent.value.name,
    date: newEvent.value.date,
    time: newEvent.value.time,
    location: newEvent.value.location,
    capacity: newEvent.value.capacity,
    registered: 0,
    status: 'Open'
  })
  
  // Reset form
  newEvent.value = {
    name: '',
    date: '',
    time: '',
    location: '',
    capacity: 12
  }
  showAddEventModal.value = false
}

const deleteEvent = (eventId) => {
  if (confirm('Are you sure you want to delete this event?')) {
    events.value = events.value.filter(e => e.id !== eventId)
  }
}
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
          <div class="card-header d-flex justify-content-between align-items-center">
            <h3 class="h5 mb-0">📅 Event Management</h3>
            <button class="btn btn-primary btn-sm" @click="showAddEventModal = true">
              <i class="bi bi-plus-circle"></i> Add Event
            </button>
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
                  <tr v-for="event in events" :key="event.id">
                    <td>{{ event.name }}</td>
                    <td>{{ event.date }}</td>
                    <td>{{ event.location }}</td>
                    <td>{{ event.capacity }}</td>
                    <td>{{ event.registered }}/{{ event.capacity }}</td>
                    <td>
                      <span class="badge" :class="{
                        'bg-success': event.status === 'Full',
                        'bg-warning': event.status === 'Available',
                        'bg-secondary': event.status === 'Open'
                      }">{{ event.status }}</span>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-outline-primary me-1">View</button>
                      <button class="btn btn-sm btn-outline-warning me-1">Edit</button>
                      <button class="btn btn-sm btn-outline-danger" @click="deleteEvent(event.id)">Delete</button>
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

    <!-- Add Event Modal -->
    <div v-if="showAddEventModal" class="modal show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Add New Event</h5>
            <button type="button" class="btn-close" @click="showAddEventModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="addEvent">
              <div class="mb-3">
                <label for="eventName" class="form-label">Event Name *</label>
                <input type="text" class="form-control" id="eventName" v-model="newEvent.name" required>
              </div>
              <div class="mb-3">
                <label for="eventDate" class="form-label">Date *</label>
                <input type="date" class="form-control" id="eventDate" v-model="newEvent.date" required>
              </div>
              <div class="mb-3">
                <label for="eventTime" class="form-label">Time *</label>
                <input type="time" class="form-control" id="eventTime" v-model="newEvent.time" required>
              </div>
              <div class="mb-3">
                <label for="eventLocation" class="form-label">Location *</label>
                <input type="text" class="form-control" id="eventLocation" v-model="newEvent.location" required>
              </div>
              <div class="mb-3">
                <label for="eventCapacity" class="form-label">Capacity</label>
                <input type="number" class="form-control" id="eventCapacity" v-model="newEvent.capacity" min="1" max="50">
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showAddEventModal = false">Cancel</button>
            <button type="button" class="btn btn-primary" @click="addEvent">Add Event</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
</style>


