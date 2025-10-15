<script setup>
import { computed, reactive, ref } from 'vue'

// Mock data for Users
const sampleNames = ['Alice','Bob','Carol','David','Eve','Frank','Grace','Hank','Ivy','Jack','Kathy','Leo','Mia','Nina','Oscar','Paul','Queen','Ray','Sara','Tom','Uma','Vic','Walt','Xena','Yuri','Zara']
const domains = ['example.com','pingpong.org','club.au','mail.net']
const users = ref(Array.from({ length: 58 }).map((_, i) => ({
  id: i + 1,
  name: sampleNames[i % sampleNames.length] + ' ' + String.fromCharCode(65 + (i % 26)) ,
  email: `${sampleNames[i % sampleNames.length].toLowerCase()}${i + 1}@${domains[i % domains.length]}`,
  role: i % 9 === 0 ? 'admin' : (i % 2 === 0 ? 'user' : 'member')
})))

// Mock data for Events
const venueNames = ['Melbourne CBD','Carlton','Richmond','Southbank','Docklands','Fitzroy','St Kilda']
const eventNames = ['Community Open Play','Beginner Coaching','Women & Girls Night','Youth Pathways','Social Friday']
const events = ref(Array.from({ length: 42 }).map((_, i) => ({
  id: `E${(i + 1).toString().padStart(3, '0')}`,
  name: eventNames[i % eventNames.length],
  date: new Date(Date.now() + i * 86400000).toISOString().slice(0, 10),
  capacity: 10 + (i % 15),
  venue: venueNames[i % venueNames.length]
})))

function useTable(dataRef, columns) {
  const pageSizeOptions = [10, 25, 50]
  const pageSize = ref(10)
  const page = ref(1)
  const sortKey = ref(columns[0].key)
  const sortDir = ref('asc') // 'asc' | 'desc'
  const globalQuery = ref('')
  const colQuery = reactive(Object.fromEntries(columns.map(c => [c.key, ''])))

  function toggleSort(key) {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey.value = key
      sortDir.value = 'asc'
    }
  }

  const filtered = computed(() => {
    const gq = globalQuery.value.trim().toLowerCase()
    const perCol = colQuery
    return dataRef.value.filter(row => {
      // global
      const hitGlobal = !gq || Object.values(row).some(v => String(v).toLowerCase().includes(gq))
      if (!hitGlobal) return false
      // per column
      for (const k of Object.keys(perCol)) {
        const q = String(perCol[k] || '').trim().toLowerCase()
        if (q && !String(row[k]).toLowerCase().includes(q)) return false
      }
      return true
    })
  })

  const sorted = computed(() => {
    const key = sortKey.value
    const dir = sortDir.value
    return [...filtered.value].sort((a, b) => {
      const av = a[key]
      const bv = b[key]
      if (av === bv) return 0
      const cmp = av > bv ? 1 : -1
      return dir === 'asc' ? cmp : -cmp
    })
  })

  const total = computed(() => sorted.value.length)
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
  const pageItems = computed(() => {
    const start = (page.value - 1) * pageSize.value
    return sorted.value.slice(start, start + pageSize.value).filter(Boolean)
  })

  function setPage(p) {
    page.value = Math.min(Math.max(1, p), totalPages.value)
  }

  function resetFilters() {
    globalQuery.value = ''
    for (const k of Object.keys(colQuery)) colQuery[k] = ''
    setPage(1)
  }

  function search() {
    // Computed filters react automatically; search button just normalizes and
    // resets to the first page to reveal results from the beginning.
    globalQuery.value = String(globalQuery.value || '').trim()
    for (const k of Object.keys(colQuery)) colQuery[k] = String(colQuery[k] || '').trim()
    setPage(1)
  }

  function exportCsv(filename = 'export.csv') {
    const rows = sorted.value
    const headers = columns.map(c => c.label)
    const keys = columns.map(c => c.key)
    const csv = [headers.join(',')]
    for (const r of rows) {
      csv.push(keys.map(k => '"' + String(r[k]).replace(/"/g, '""') + '"').join(','))
    }
    const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return reactive({ pageSizeOptions, pageSize, page, sortKey, sortDir, globalQuery, colQuery, toggleSort, pageItems, total, totalPages, setPage, resetFilters, exportCsv, search })
}

const usersColumns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' }
]
const usersTable = useTable(users, usersColumns)

const eventsColumns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'date', label: 'Date' },
  { key: 'capacity', label: 'Capacity' },
  { key: 'venue', label: 'Venue' }
]
const eventsTable = useTable(events, eventsColumns)
</script>

<template>
  <div>
    <h1 class="mb-4">Users and Events Table</h1>

    <!-- USERS TABLE -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <h5 class="mb-0">Users</h5>
            <div class="d-flex align-items-center gap-2">
            <input v-model.trim="usersTable.globalQuery" class="form-control" style="width:240px" placeholder="Global search" />
            <select v-model.number="usersTable.pageSize" class="form-select" style="width:120px">
              <option v-for="opt in usersTable.pageSizeOptions" :key="opt" :value="opt">{{ opt }}/page</option>
            </select>
              <button class="btn btn-secondary" @click="usersTable.search">Search</button>
            <button class="btn btn-outline-secondary" @click="usersTable.resetFilters">Reset</button>
            <button class="btn btn-primary" @click="usersTable.exportCsv('users.csv')">Export CSV</button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table table-striped table-hover align-middle">
            <thead>
              <tr>
                <th v-for="col in usersColumns" :key="col.key" role="button" scope="col" :aria-sort="usersTable.sortKey===col.key ? (usersTable.sortDir==='asc' ? 'ascending' : 'descending') : 'none'" @click="usersTable.toggleSort(col.key)">
                  {{ col.label }}
                  <span v-if="usersTable.sortKey===col.key">{{ usersTable.sortDir==='asc' ? '▲' : '▼' }}</span>
                </th>
              </tr>
              <tr>
                <th v-for="col in usersColumns" :key="col.key+'-filter'">
                  <input v-model.trim="usersTable.colQuery[col.key]" class="form-control form-control-sm" :placeholder="'Search '+col.label" />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in (usersTable.pageItems || [])" :key="idx">
                <td>{{ row?.id || '' }}</td>
                <td>{{ row?.name || '' }}</td>
                <td>{{ row?.email || '' }}</td>
                <td><span class="badge" :class="row?.role==='admin' ? 'text-bg-primary' : 'text-bg-secondary'">{{ row?.role || '' }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="d-flex justify-content-between align-items-center">
          <div class="small">Total: {{ usersTable.total }}</div>
          <nav>
            <ul class="pagination pagination-sm mb-0">
              <li class="page-item" :class="{ disabled: usersTable.page===1 }">
                <a class="page-link" href="#" @click.prevent="usersTable.setPage(usersTable.page-1)">Prev</a>
              </li>
              <li class="page-item disabled"><span class="page-link">Page {{ usersTable.page }} / {{ usersTable.totalPages }}</span></li>
              <li class="page-item" :class="{ disabled: usersTable.page===usersTable.totalPages }">
                <a class="page-link" href="#" @click.prevent="usersTable.setPage(usersTable.page+1)">Next</a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>

    <!-- EVENTS TABLE -->
    <div class="card">
      <div class="card-body">
        <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <h5 class="mb-0">Events</h5>
            <div class="d-flex align-items-center gap-2">
            <input v-model.trim="eventsTable.globalQuery" class="form-control" style="width:240px" placeholder="Global search" />
            <select v-model.number="eventsTable.pageSize" class="form-select" style="width:120px">
              <option v-for="opt in eventsTable.pageSizeOptions" :key="opt" :value="opt">{{ opt }}/page</option>
            </select>
              <button class="btn btn-secondary" @click="eventsTable.search">Search</button>
            <button class="btn btn-outline-secondary" @click="eventsTable.resetFilters">Reset</button>
            <button class="btn btn-primary" @click="eventsTable.exportCsv('events.csv')">Export CSV</button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table table-striped table-hover align-middle">
            <thead>
              <tr>
                <th v-for="col in eventsColumns" :key="col.key" role="button" scope="col" :aria-sort="eventsTable.sortKey===col.key ? (eventsTable.sortDir==='asc' ? 'ascending' : 'descending') : 'none'" @click="eventsTable.toggleSort(col.key)">
                  {{ col.label }}
                  <span v-if="eventsTable.sortKey===col.key">{{ eventsTable.sortDir==='asc' ? '▲' : '▼' }}</span>
                </th>
              </tr>
              <tr>
                <th v-for="col in eventsColumns" :key="col.key+'-filter'">
                  <input v-model.trim="eventsTable.colQuery[col.key]" class="form-control form-control-sm" :placeholder="'Search '+col.label" />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in (eventsTable.pageItems || [])" :key="idx">
                <td>{{ row?.id || '' }}</td>
                <td>{{ row?.name || '' }}</td>
                <td>{{ row?.date || '' }}</td>
                <td>{{ row?.capacity || '' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="d-flex justify-content-between align-items-center">
          <div class="small">Total: {{ eventsTable.total }}</div>
          <nav>
            <ul class="pagination pagination-sm mb-0">
              <li class="page-item" :class="{ disabled: eventsTable.page===1 }">
                <a class="page-link" href="#" @click.prevent="eventsTable.setPage(eventsTable.page-1)">Prev</a>
              </li>
              <li class="page-item disabled"><span class="page-link">Page {{ eventsTable.page }} / {{ eventsTable.totalPages }}</span></li>
              <li class="page-item" :class="{ disabled: eventsTable.page===eventsTable.totalPages }">
                <a class="page-link" href="#" @click.prevent="eventsTable.setPage(eventsTable.page+1)">Next</a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
th[role="button"] { user-select: none; }
</style>


