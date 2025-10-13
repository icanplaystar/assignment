<script setup>
import { ref } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { melbourneTableTennisVenues } from '../data/venues'

const bookings = ref([])

function hasConflict(start, end) {
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  return bookings.value.some(b => {
    const bs = new Date(b.start).getTime()
    const be = new Date(b.end).getTime()
    return Math.max(s, bs) < Math.min(e, be) // overlap
  })
}

function handleSelect(info) {
  const title = prompt('Booking title (e.g., TT Coaching):')
  if (!title) return
  if (hasConflict(info.start, info.end)) {
    alert('Time conflict with an existing booking. Please choose another slot.')
    return
  }
  bookings.value.push({ id: String(Date.now()), title, start: info.startStr, end: info.endStr })
}

const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'timeGridWeek',
  selectable: true,
  selectMirror: true,
  nowIndicator: true,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  eventOverlap: false,
  select: handleSelect,
  events: bookings,
  slotMinTime: '08:00:00',
  slotMaxTime: '22:00:00',
})

const suggestions = melbourneTableTennisVenues.map(v => ({ title: v.name, start: new Date().toISOString().slice(0,10) + 'T18:00:00' }))
</script>

<template>
  <div>
    <h1 class="mb-3">Book a Session</h1>
    <p class="text-muted">Drag/select a time range to create a booking. Conflicts are prevented automatically.</p>
    <div class="mb-2">
      <button class="btn btn-sm btn-outline-secondary me-2" @click="bookings.push(...suggestions)">Load sample TT events</button>
      <button class="btn btn-sm btn-outline-danger" @click="bookings = []">Clear</button>
    </div>
    <FullCalendar :options="calendarOptions" />
  </div>
</template>

<style scoped>
/* Ensure calendar is visible with adequate height */
:deep(.fc) { min-height: 700px; }
</style>


