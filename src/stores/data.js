import { defineStore } from 'pinia'

const DATA_KEY = 'app_items'
const RATINGS_KEY = 'app_ratings'
const VERSION_KEY = 'app_schema_version'
const CURRENT_VERSION = 2

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function getDefaultItems() {
  return [
    { id: 'find-venue', name: 'Find a Venue', description: 'Search, filter and map routing experience' },
    { id: 'events', name: 'Upcoming Events', description: 'Event list, register and navigate' },
    { id: 'calendar', name: 'Booking Calendar', description: 'Book time slots with conflict prevention' },
    { id: 'email', name: 'Email & Bulk Email', description: 'Send email with attachment or to selected users' },
    { id: 'accessibility', name: 'Accessibility', description: 'Keyboard navigation, labels, and WCAG enhancements' }
  ]
}

function migrateItems(maybeItems) {
  // If old demo data (Item A/B/C) or empty, replace with feature-based items
  if (!Array.isArray(maybeItems) || maybeItems.length === 0) return getDefaultItems()
  const sample = (maybeItems[0]?.name || '').toLowerCase()
  if (sample.startsWith('item ')) return getDefaultItems()
  return maybeItems
}

const initialItems = (() => {
  const stored = readJson(DATA_KEY, null)
  const items = migrateItems(stored)
  // Persist migrated structure & version
  writeJson(DATA_KEY, items)
  writeJson(VERSION_KEY, CURRENT_VERSION)
  return items
})()

export const useDataStore = defineStore('data', {
  state: () => ({
    items: initialItems,
    ratings: readJson(RATINGS_KEY, {})
  }),
  actions: {
    save() {
      writeJson(DATA_KEY, this.items)
      writeJson(RATINGS_KEY, this.ratings)
    },
    setRating(itemId, userId, value) {
      const sanitizedValue = Math.max(1, Math.min(5, Number(value) || 0))
      if (!this.ratings[itemId]) this.ratings[itemId] = {}
      this.ratings[itemId][userId] = sanitizedValue
      this.save()
    }
  },
  getters: {
    getAverage: (state) => (itemId) => {
      const map = state.ratings[itemId] || {}
      const values = Object.values(map)
      if (values.length === 0) return 0
      const sum = values.reduce((a, b) => a + Number(b || 0), 0)
      return sum / values.length
    },
    getUserRating: (state) => (itemId, userId) => {
      if (!userId) return 0
      return state.ratings[itemId]?.[userId] || 0
    }
  }
})


