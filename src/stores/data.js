import { defineStore } from 'pinia'

const DATA_KEY = 'app_items'
const RATINGS_KEY = 'app_ratings'

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

export const useDataStore = defineStore('data', {
  state: () => ({
    items: readJson(DATA_KEY, [
      { id: '1', name: 'Item A', description: 'First example item' },
      { id: '2', name: 'Item B', description: 'Second example item' },
      { id: '3', name: 'Item C', description: 'Third example item' }
    ]),
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


