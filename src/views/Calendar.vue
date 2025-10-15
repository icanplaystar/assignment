<script setup>
import { computed, onMounted, onUnmounted, ref, watch, reactive } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { melbourneTableTennisVenues } from '../data/venues'
import { useBookingsStore } from '../stores/bookings'
import { useAuthStore } from '../stores/auth'
import { useEventRegistrationsStore } from '../stores/eventRegistrations'

const auth = useAuthStore()
const bookingsStore = useBookingsStore()
const regsStore = useEventRegistrationsStore()
const bookings = computed(() => bookingsStore.items)
const currentUserId = computed(() => auth.currentUser?.id)
const calendarRef = ref(null)

// Pretty centered modal dialog
const dialog = reactive({
  visible: false,
  title: '',
  message: '',
  confirmText: 'OK',
  cancelText: 'Cancel',
  showCancel: false,
  onConfirm: null
})

function openInfo(message, title = 'Notice') {
  dialog.title = title
  dialog.message = message
  dialog.confirmText = 'OK'
  dialog.cancelText = 'Cancel'
  dialog.showCancel = false
  dialog.onConfirm = null
  dialog.visible = true
}

function openConfirm(message, onConfirm, title = 'Confirm', confirmText = 'Confirm', cancelText = 'Cancel') {
  dialog.title = title
  dialog.message = message
  dialog.confirmText = confirmText
  dialog.cancelText = cancelText
  dialog.showCancel = true
  dialog.onConfirm = typeof onConfirm === 'function' ? onConfirm : null
  dialog.visible = true
}

function closeDialog(confirmed = false) {
  const cb = confirmed ? dialog.onConfirm : null
  dialog.visible = false
  if (cb) {
    try { cb() } catch {}
  }
}

// Optimistic UI overlay to instantly reflect RSVP changes before Firestore snapshot arrives
const optimistic = reactive({ joined: {}, countDelta: {} })

function isJoinedOptimistic(eventId) {
  return !!optimistic.joined[eventId] || regsStore.hasRsvped(eventId)
}

function getCountOptimistic(eventId) {
  return (regsStore.getCount(eventId) || 0) + (optimistic.countDelta[eventId] || 0)
}

function ms(x) { return new Date(x).getTime() }

// Build upcoming events (same dataset as UpcomingEvents page)
const upcomingBase = computed(() => {
  const year = new Date().getFullYear()
  return melbourneTableTennisVenues.map((v, i) => {
    const day = Math.min(31, 18 + i) // Oct 18 onward, around the 20th, until month end
    const date = new Date(year, 9, day).toISOString().slice(0, 10) // month 9 = October
    let name = v.name
    let capacity = 12
    if (i === 0) { // special private coaching event
      name = 'Coach GA Private Coaching'
      capacity = 1
    }
    return { id: `e${i + 1}`, name, date, capacity }
  })
})

const upcomingEvents = computed(() => upcomingBase.value.map(ev => {
  const count = regsStore.getCount(ev.id)
  return {
    id: ev.id,
    title: ev.name,
    start: `${ev.date}T18:00:00`,
    end: `${ev.date}T20:00:00`,
    extendedProps: { kind: 'event', eventId: ev.id, eventName: ev.name, capacity: ev.capacity, count }
  }
}))

// Merge bookings with upcoming events for the calendar
const allEvents = computed(() => {
  const bookingEvents = bookings.value.map(b => ({
    id: b.id,
    title: b.title,
    start: b.start,
    end: b.end,
    extendedProps: { ...b, kind: 'booking', id: b.id }
  }))
  return [...upcomingEvents.value, ...bookingEvents]
})

function handleSelect(info) {
  const title = prompt('Booking title (e.g., TT Coaching):')
  if (!title) return
  // 1) Local conflict check
  const conflictLocal = bookings.value.some(b => Math.max(ms(info.start), ms(b.start)) < Math.min(ms(info.end), ms(b.end)))
  if (conflictLocal) {
    openInfo('This time slot is already occupied and cannot be booked.', 'Slot Conflict')
    return
  }
  // 2) Server-side create with conflict check
  bookingsStore.create({ title, start: info.startStr, end: info.endStr })
    .catch(err => openInfo(err?.message || 'Failed to create booking', 'Create Failed'))
}

function handleEventClick(arg) {
  const id = arg?.event?.extendedProps?.id || arg?.event?._def?.publicId || arg?.event?.id
  const uid = currentUserId.value
  const ownerId = arg?.event?.extendedProps?.userId
  const kind = arg?.event?.extendedProps?.kind
  if (!id) return
  if (kind === 'booking') {
    if (ownerId && uid && ownerId === uid) {
      openConfirm('Delete this booking?', () => {
        bookingsStore.remove(arg.event.extendedProps.id).catch(e => openInfo(e?.message || 'Failed to delete', 'Delete Failed'))
      }, 'Delete Booking', 'Delete', 'Cancel')
    }
    return
  }
  if (kind === 'event') {
    const eventId = arg?.event?.extendedProps?.eventId
    const eventName = arg?.event?.extendedProps?.eventName
    const capacity = Number(arg?.event?.extendedProps?.capacity || 0)
    const count = getCountOptimistic(eventId)
    const isFull = capacity > 0 && count >= capacity
    if (isFull) {
      openInfo('This event is full and cannot be joined.', 'Event Full')
      return
    }
    const already = regsStore.hasRsvped(eventId)
    if (already) {
      openConfirm('You have joined this event. Cancel RSVP?', () => {
        regsStore.cancel(eventId)
          .then(() => {
            optimistic.joined[eventId] = false
            optimistic.countDelta[eventId] = (optimistic.countDelta[eventId] || 0) - 1
            forceRefresh()
          })
          .catch(e => openInfo(e?.message || 'Failed to cancel', 'Cancel Failed'))
      }, 'Cancel RSVP', 'Cancel RSVP', 'Keep')
    } else {
      openConfirm(`Join event: ${eventName}?`, () => {
        regsStore.rsvp(eventId, eventName)
          .then(() => {
            optimistic.joined[eventId] = true
            optimistic.countDelta[eventId] = (optimistic.countDelta[eventId] || 0) + 1
            forceRefresh()
          })
          .catch(e => openInfo(e?.message || 'Failed to RSVP', 'RSVP Failed'))
      }, 'Join Event', 'Join', 'Dismiss')
    }
  }
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
  eventClick: handleEventClick,
  events: allEvents,
  eventContent: (arg) => {
    const kind = arg.event.extendedProps?.kind
    if (kind !== 'event') return undefined
    const title = arg.event.title || ''
    const capacity = Number(arg.event.extendedProps?.capacity || 0)
    const count = Number(getCountOptimistic(arg.event.extendedProps?.eventId))
    const capText = capacity > 0 ? `${count}/${capacity}` : `${count}`
    const html = `<div class="fc-event-title-container">
      <div class="fc-event-time">${arg.timeText || ''}</div>
      <div class="fc-event-title">${title}</div>
      <div class="fc-event-sub" style="font-size:12px;opacity:.9">${capText}</div>
    </div>`
    return { html }
  },
  eventDidMount: (info) => {
    const kind = info.event.extendedProps?.kind
    if (kind === 'event') {
      const eventId = info.event.extendedProps?.eventId
      const joined = isJoinedOptimistic(eventId)
      const capacity = info.event.extendedProps?.capacity || 0
      const count = getCountOptimistic(eventId)
      const isFull = capacity > 0 && count >= capacity
      const bg = isFull ? '#dc3545' : (joined ? '#0d6efd' : '#20c997')
      info.el.style.backgroundColor = bg
      info.el.style.borderColor = bg
      info.el.style.color = 'white'
      return
    }
    const ownerId = info.event.extendedProps?.userId
    if (ownerId && currentUserId.value && ownerId === currentUserId.value) {
      info.el.style.backgroundColor = '#0d6efd'
      info.el.style.borderColor = '#0d6efd'
      info.el.style.color = 'white'
    } else {
      info.el.style.backgroundColor = '#adb5bd'
      info.el.style.borderColor = '#adb5bd'
      info.el.style.color = '#212529'
    }
  },
  slotMinTime: '08:00:00',
  slotMaxTime: '22:00:00',
})

const suggestions = melbourneTableTennisVenues.map(v => ({ title: v.name, start: new Date().toISOString().slice(0,10) + 'T18:00:00' }))

onMounted(() => {
  bookingsStore.startListening()
  regsStore.startListening(currentUserId.value)
  // initial style refresh
  setTimeout(() => {
    try {
      const api = calendarRef.value?.getApi?.()
      api?.rerenderEvents?.()
      refreshEventStyles()
    } catch {}
  }, 0)
})
onUnmounted(() => {
  bookingsStore.stopListening()
  regsStore.stopListening()
})

function refreshEventStyles() {
  try {
    const api = calendarRef.value?.getApi?.()
    if (!api) return
    api.getEvents().forEach(evt => {
      const kind = evt.extendedProps?.kind
      if (kind === 'event') {
        const eventId = evt.extendedProps?.eventId
        const joined = isJoinedOptimistic(eventId)
        const capacity = Number(evt.extendedProps?.capacity || 0)
        const count = getCountOptimistic(eventId)
        const isFull = capacity > 0 && count >= capacity
        const bg = isFull ? '#dc3545' : (joined ? '#0d6efd' : '#20c997')
        const el = evt.el || document.querySelector(`.fc-event[data-event-id="${evt.id}"]`)
        if (el) {
          el.style.backgroundColor = bg
          el.style.borderColor = bg
          el.style.color = 'white'
        }
      }
    })
  } catch {}
}

function forceRefresh() {
  try {
    const api = calendarRef.value?.getApi?.()
    api?.rerenderEvents?.()
  } catch {}
  refreshEventStyles()
}

// Re-render and refresh styles when counts or my registrations change
watch(() => ({ counts: regsStore.counts, my: regsStore.myRegs, uid: currentUserId.value }), () => {
  // when server snapshot arrives, clear optimistic overlay (it is reflected in store now)
  optimistic.joined = {}
  optimistic.countDelta = {}
  forceRefresh()
}, { deep: true })
</script>

<template>
  <div>
    <h1 class="mb-3">Book a Session & Upcoming Events</h1>
    <p class="text-muted">Drag to select a time slot to create a booking. Conflicting slots are blocked. Upcoming events are shown on the calendar — click an event to Join/Cancel.</p>
    <div class="mb-2">
      <button class="btn btn-sm btn-outline-secondary me-2" @click="openInfo('Tip: Select on the calendar to book. Click an event to RSVP.', 'Help')">How to book?</button>
    </div>
    <FullCalendar ref="calendarRef" :options="calendarOptions" />
    <div v-if="dialog.visible" class="ppp-modal-backdrop"></div>
    <div v-if="dialog.visible" class="ppp-modal" role="dialog" aria-modal="true" aria-label="Dialog">
      <div class="card shadow-lg ppp-modal-card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <strong>{{ dialog.title }}</strong>
          <button type="button" class="btn-close" aria-label="Close" @click="closeDialog(false)"></button>
        </div>
        <div class="card-body">
          <p class="mb-0">{{ dialog.message }}</p>
        </div>
        <div class="card-footer d-flex justify-content-end gap-2">
          <button v-if="dialog.showCancel" class="btn btn-outline-secondary" @click="closeDialog(false)">{{ dialog.cancelText }}</button>
          <button class="btn btn-primary" @click="closeDialog(true)">{{ dialog.confirmText }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ensure calendar is visible with adequate height */
:deep(.fc) { min-height: 700px; }
.ppp-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 2050; }
.ppp-modal { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 2060; padding: 16px; }
.ppp-modal-card { width: min(480px, 92vw); }
</style>


