<script setup>
import { onMounted, ref } from 'vue'
import 'mapbox-gl/dist/mapbox-gl.css'

const mapContainer = ref(null)
const mapLoaded = ref(false)
const token = import.meta.env.VITE_MAPBOX_TOKEN

// Map & controls
let map
let mapboxgl
const markers = []
const ourMarkers = []

// Search state
const query = ref('table tennis')
const results = ref([])
const searching = ref(false)

// Routing state
const startText = ref('Melbourne Central')
const destText = ref('Carlton Gardens')
const routing = ref(false)
const routeInfo = ref('')

// Our curated events around Melbourne
const ourQuery = ref('')
const ourVenues = [
  { id: 'v1', name: 'CBD Table Tennis Open Play', type: 'Open Play', lngLat: [144.9631, -37.8136] },
  { id: 'v2', name: 'Carlton Beginner Coaching (Ping-Pong)', type: 'Coaching', lngLat: [144.9667, -37.8000] },
  { id: 'v3', name: 'Fitzroy Social Doubles (TT)', type: 'Social', lngLat: [144.9780, -37.8009] },
  { id: 'v4', name: 'Richmond Women & Girls Night (TT)', type: 'Women', lngLat: [145.0017, -37.8183] },
  { id: 'v5', name: 'Southbank Youth Pathways (Table Tennis)', type: 'Youth', lngLat: [144.9643, -37.8211] },
  { id: 'v6', name: 'Docklands Community Coaching Clinic (TT)', type: 'Coaching', lngLat: [144.9450, -37.8156] },
  { id: 'v7', name: 'St Kilda Ladder League (TT)', type: 'League', lngLat: [144.9781, -37.8675] },
  { id: 'v8', name: 'Brunswick Social Friday (Table Tennis)', type: 'Social', lngLat: [144.9615, -37.7648] }
]

async function ensureMap() {
  if (!token || map) return map
  const mod = await import('mapbox-gl')
  mapboxgl = mod.default || mod
  mapboxgl.accessToken = token
  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [144.9631, -37.8136],
    zoom: 12
  })
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
  map.addControl(new mapboxgl.GeolocateControl({ trackUserLocation: true }), 'top-right')
  map.on('load', () => { mapLoaded.value = true })
  return map
}

function clearMarkers() {
  while (markers.length) {
    const m = markers.pop()
    try { m.remove() } catch {}
  }
}

function clearOurMarkers() {
  while (ourMarkers.length) {
    const m = ourMarkers.pop()
    try { m.remove() } catch {}
  }
}

function addMarker(lngLat, title, description) {
  const el = document.createElement('div')
  el.style.width = '12px'
  el.style.height = '12px'
  el.style.borderRadius = '50%'
  el.style.background = '#0d6efd'
  el.style.boxShadow = '0 0 0 3px rgba(13,110,253,0.25)'
  const marker = new mapboxgl.Marker({ element: el })
    .setLngLat(lngLat)
    .setPopup(new mapboxgl.Popup({ offset: 24 }).setHTML(`<strong>${title}</strong><br/>${description || ''}`))
    .addTo(map)
  markers.push(marker)
}

function addOurMarker(lngLat, title, description) {
  const el = document.createElement('div')
  el.style.width = '14px'
  el.style.height = '14px'
  el.style.borderRadius = '50%'
  el.style.background = '#20c997'
  el.style.boxShadow = '0 0 0 3px rgba(32,201,151,0.25)'
  const marker = new mapboxgl.Marker({ element: el })
    .setLngLat(lngLat)
    .setPopup(new mapboxgl.Popup({ offset: 24 }).setHTML(`<strong>${title}</strong><br/>${description || ''}`))
    .addTo(map)
  ourMarkers.push(marker)
}

const melbourneCenter = [144.9631, -37.8136]
const melbourneBbox = [144.4, -38.3, 145.6, -37.4] // approx Greater Melbourne

async function geocode(text) {
  const qRaw = String(text || '').trim()
  const q = encodeURIComponent(qRaw)
  // Include suburb/locality etc to match "Clayton" query
  const types = 'address,poi,place,locality,neighborhood,district,postcode'
  const base = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?fuzzyMatch=true&autocomplete=true&country=AU&types=${types}&proximity=${melbourneCenter[0]},${melbourneCenter[1]}&bbox=${melbourneBbox.join(',')}&limit=8&language=en&access_token=${token}`
  let res = await fetch(base)
  let data = await res.json()
  let feats = data.features || []
  // Fallback: append Melbourne if user only输入 suburb 名称
  if (!feats.length && qRaw && !/melbourne/i.test(qRaw)) {
    const q2 = encodeURIComponent(`${qRaw} Melbourne Victoria`)
    const url2 = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q2}.json?fuzzyMatch=true&autocomplete=true&country=AU&types=${types}&limit=8&language=en&access_token=${token}`
    res = await fetch(url2)
    data = await res.json()
    feats = data.features || []
  }
  return feats
}

async function searchPlaces() {
  if (!token) return
  await ensureMap()
  searching.value = true
  try {
    const feats = await geocode(query.value || '')
    results.value = feats
    clearMarkers()
    feats.forEach((f) => addMarker(f.center, f.text, f.place_name))
    if (feats[0]) {
      const t = (feats[0].place_type && feats[0].place_type[0]) || 'poi'
      const zoomByType = { address: 16, poi: 14, neighborhood: 13, locality: 12, place: 11, district: 10, postcode: 10 }
      const z = zoomByType[t] || 13
      map.flyTo({ center: feats[0].center, zoom: z })
    }
    if (!feats.length) {
      routeInfo.value = 'No results. Try more specific address (e.g., street number + suburb)'
    }
  } finally {
    searching.value = false
  }
}

function showOurVenues() {
  if (!map) return
  clearOurMarkers()
  const text = (ourQuery.value || '').trim().toLowerCase()
  const matches = ourVenues.filter(v => !text || v.name.toLowerCase().includes(text) || v.type.toLowerCase().includes(text))
  const bounds = new mapboxgl.LngLatBounds()
  matches.forEach(v => {
    addOurMarker(v.lngLat, v.name, v.type)
    bounds.extend(v.lngLat)
  })
  if (matches.length) map.fitBounds(bounds, { padding: 60 })
}

function drawRouteLine(geojsonLine) {
  const sourceId = 'route-line'
  if (map.getSource(sourceId)) {
    map.getSource(sourceId).setData(geojsonLine)
    return
  }
  map.addSource(sourceId, { type: 'geojson', data: geojsonLine })
  map.addLayer({
    id: 'route-line-layer',
    type: 'line',
    source: sourceId,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#0d6efd', 'line-width': 5, 'line-opacity': 0.9 }
  })
}

async function getFirstCoord(text) {
  const feats = await geocode(text)
  return feats[0]?.center
}

async function routeBetween() {
  if (!token) return
  await ensureMap()
  routing.value = true
  routeInfo.value = ''
  try {
    const from = await getFirstCoord(startText.value)
    const to = await getFirstCoord(destText.value)
    if (!from || !to) {
      routeInfo.value = 'Could not geocode start or destination.'
      return
    }
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&overview=full&access_token=${token}`
    const res = await fetch(url)
    const data = await res.json()
    const route = data?.routes?.[0]
    if (!route) {
      routeInfo.value = 'No route found.'
      return
    }
    const km = (route.distance / 1000).toFixed(1)
    const mins = Math.round(route.duration / 60)
    routeInfo.value = `${km} km · ${mins} min`
    drawRouteLine({ type: 'FeatureCollection', features: [ { type: 'Feature', geometry: route.geometry } ] })
    map.fitBounds([from, to], { padding: 60 })
  } finally {
    routing.value = false
  }
}

onMounted(async () => {
  if (!token) return
  await ensureMap()
  // render our venues initially
  showOurVenues()
  // if a hash center is provided (#center=lng,lat), fly to it
  try {
    const hash = window.location.hash
    const m = hash.match(/center=([^&]+)/)
    const l = hash.match(/label=([^&]+)/)
    if (m && m[1]) {
      const [lng, lat] = m[1].split(',').map(Number)
      if (!Number.isNaN(lng) && !Number.isNaN(lat)) {
        map.flyTo({ center: [lng, lat], zoom: 15 })
        // Add a temporary focus marker
        const title = l && l[1] ? decodeURIComponent(l[1]) : 'Selected Event'
        addMarker([lng, lat], title, 'From Upcoming Events')
      }
    }
  } catch {}
})
</script>

<template>
  <div>
    <h1 class="mb-3">Find a Venue</h1>
    <div v-if="!token" class="alert alert-warning">Add VITE_MAPBOX_TOKEN to enable the map.</div>

    <div v-else class="card mb-3">
      <div class="card-body">
        <div class="row g-2 align-items-center">
          <div class="col-12 col-lg-6">
            <div class="input-group">
              <input class="form-control" v-model.trim="query" @keyup.enter="searchPlaces" placeholder="Search places or address (e.g., 123 Swanston St)" aria-label="Search places or address" />
              <button class="btn btn-primary" :disabled="searching" @click="searchPlaces" aria-label="Search places">{{ searching ? 'Searching…' : 'Search' }}</button>
            </div>
          </div>
          <div class="col-12 col-lg-6">
            <div class="input-group">
              <input class="form-control" v-model.trim="startText" placeholder="Start (name or address)" aria-label="Start location" />
              <span class="input-group-text">→</span>
              <input class="form-control" v-model.trim="destText" placeholder="Destination (name or address)" aria-label="Destination" />
              <button class="btn btn-outline-secondary" :disabled="routing" @click="routeBetween" aria-label="Get route between start and destination">{{ routing ? 'Routing…' : 'Route' }}</button>
            </div>
            <div class="form-text" v-if="routeInfo" role="status" aria-live="polite">{{ routeInfo }}</div>
          </div>
        </div>
        <div class="row g-2 align-items-center mt-1">
          <div class="col-12 col-lg-6">
            <div class="input-group">
              <span class="input-group-text">Our events</span>
              <input class="form-control" v-model.trim="ourQuery" placeholder="Filter by name or type (e.g., Community, Women)" />
              <button class="btn btn-success" @click="showOurVenues">Show</button>
            </div>
          </div>
          <div class="col-12 col-lg-6 small text-muted">
            Legend: <span class="badge bg-primary">Search results</span> <span class="badge bg-success">Our events</span>
          </div>
        </div>
        <div class="mt-2" v-if="results.length" aria-live="polite" role="region" aria-label="Search results list">
          <div class="small text-muted mb-1">Results:</div>
          <div class="d-flex flex-wrap gap-2" role="list">
            <button v-for="r in results" :key="r.id" class="btn btn-sm btn-light border" role="listitem" :aria-label="`Fly to ${r.text}`" @click="() => { map.flyTo({ center: r.center, zoom: 14 }); }">{{ r.text }}</button>
          </div>
        </div>
      </div>
    </div>

    <div ref="mapContainer" style="height: 520px;" class="w-100 border rounded"></div>
  </div>
</template>

<style scoped>
</style>


