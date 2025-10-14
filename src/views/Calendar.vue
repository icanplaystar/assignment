<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { melbourneTableTennisVenues } from '../data/venues'
import { useBookingsStore } from '../stores/bookings'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const bookingsStore = useBookingsStore()
const bookings = computed(() => bookingsStore.items)
const currentUserId = computed(() => auth.currentUser?.id)

function ms(x) { return new Date(x).getTime() }

function handleSelect(info) {
  const title = prompt('Booking title (e.g., TT Coaching):')
  if (!title) return
  // 1) 本地冲突快速校验
  const conflictLocal = bookings.value.some(b => Math.max(ms(info.start), ms(b.start)) < Math.min(ms(info.end), ms(b.end)))
  if (conflictLocal) {
    alert('该时间段已被占用，无法预订')
    return
  }
  // 2) 服务器端创建（含读校验）
  bookingsStore.create({ title, start: info.startStr, end: info.endStr })
    .catch(err => alert(err?.message || 'Failed to create booking'))
}

function handleEventClick(arg) {
  const id = arg?.event?.extendedProps?.id || arg?.event?._def?.publicId || arg?.event?.id
  const uid = currentUserId.value
  const ownerId = arg?.event?.extendedProps?.userId
  if (!id) return
  if (ownerId && uid && ownerId === uid) {
    if (confirm('删除这条预订？')) {
      bookingsStore.remove(arg.event.extendedProps.id).catch(e => alert(e?.message || '删除失败'))
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
  events: bookings,
  eventDidMount: (info) => {
    const ownerId = info.event.extendedProps?.userId
    if (ownerId && currentUserId.value && ownerId === currentUserId.value) {
      // 自己的预订高亮
      info.el.style.backgroundColor = '#0d6efd'
      info.el.style.borderColor = '#0d6efd'
      info.el.style.color = 'white'
    } else {
      // 他人预订标识
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
})
onUnmounted(() => {
  bookingsStore.stopListening()
})
</script>

<template>
  <div>
    <h1 class="mb-3">Book a Session</h1>
    <p class="text-muted">拖拽/选择时间段创建预订；与现有预订冲突的时段会被标记并阻止创建。点击自己的预订可删除。</p>
    <div class="mb-2">
      <button class="btn btn-sm btn-outline-secondary me-2" @click="alert('演示：请直接在日历中选择时间段创建预订。')">如何预订？</button>
    </div>
    <FullCalendar :options="calendarOptions" />
  </div>
</template>

<style scoped>
/* Ensure calendar is visible with adequate height */
:deep(.fc) { min-height: 700px; }
</style>


