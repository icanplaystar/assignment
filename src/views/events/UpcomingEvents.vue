<script setup>
import { reactive } from 'vue'
import { melbourneTableTennisVenues } from '../../data/venues'

const state = reactive({
  events: melbourneTableTennisVenues.map((v, i) => ({
    id: `e${i + 1}`,
    name: v.name,
    date: new Date(Date.now() + (i + 1) * 86400000).toISOString().slice(0, 10),
    capacity: 12 + (i % 12),
    location: v.name.split(' ')[0],
    lngLat: v.lngLat
  }))
})

function register(ev) {
  alert(`Registered for ${ev.name}`)
}

function openInFindVenue(ev) {
  // Open Find a Venue and center on this event via a hash param
  const q = encodeURIComponent(`${ev.lngLat[0]},${ev.lngLat[1]}`)
  const label = encodeURIComponent(ev.name)
  window.location.href = `/venues/find#center=${q}&label=${label}`
}
</script>

<template>
  <div>
    <h1 class="mb-3">Upcoming Events</h1>
    <div class="table-responsive">
      <table class="table align-middle">
        <thead>
          <tr>
            <th>Name</th>
            <th>Date</th>
            <th>Capacity</th>
            <th>Location</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ev in state.events" :key="ev.id">
            <td>{{ ev.name }}</td>
            <td>{{ ev.date }}</td>
            <td>{{ ev.capacity }}</td>
            <td>{{ ev.location }}</td>
            <td class="text-end"><button class="btn btn-outline-secondary btn-sm me-2" @click="openInFindVenue(ev)">Navigate</button></td>
            <td class="text-end"><button class="btn btn-primary btn-sm" @click="register(ev)">Register</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
</style>


