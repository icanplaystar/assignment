<script setup>
import { reactive } from 'vue'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { melbourneTableTennisVenues } from '../../data/venues'

const state = reactive({
  events: melbourneTableTennisVenues.map((v, i) => {
    const year = new Date().getFullYear()
    const day = Math.min(31, 18 + i) // Oct 18 onward
    const date = new Date(year, 9, day).toISOString().slice(0, 10)
    let name = v.name
    let capacity = 12
    if (i === 0) { name = 'Coach GA Private Coaching'; capacity = 1 }
    return {
      id: `e${i + 1}`,
      name,
      date,
      capacity,
      location: v.name.split(' ')[0],
      lngLat: v.lngLat
    }
  })
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

function exportCsv() {
  const headers = ['Name', 'Date', 'Capacity', 'Location']
  const rows = state.events.map(e => [e.name, e.date, e.capacity, e.location])
  const escape = (val) => '"' + String(val).replaceAll('"', '""') + '"'
  const csv = [headers.join(','), ...rows.map(r => r.map(escape).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'upcoming-events.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function exportPdf() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Upcoming Events', 40, 40)
  const body = state.events.map(e => [e.name, e.date, String(e.capacity), e.location])
  autoTable(doc, {
    startY: 60,
    head: [['Name', 'Date', 'Capacity', 'Location']],
    body,
    styles: { font: 'helvetica', fontSize: 10 },
    headStyles: { fillColor: [13,110,253] }
  })
  doc.save('upcoming-events.pdf')
}
</script>

<template>
  <div>
    <h1 class="mb-3">Upcoming Events</h1>
    <div class="d-flex gap-2 mb-2">
      <button class="btn btn-outline-secondary btn-sm" @click="exportCsv" aria-label="Export CSV">Export CSV</button>
      <button class="btn btn-outline-secondary btn-sm" @click="exportPdf" aria-label="Export PDF">Export PDF</button>
    </div>
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


