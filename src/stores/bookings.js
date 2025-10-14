import { defineStore } from 'pinia'
import { getFirestoreDb } from '../firebase'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where
} from 'firebase/firestore'
import { useAuthStore } from './auth'

function toMillis(input) {
  if (!input) return 0
  if (typeof input === 'number') return input
  if (typeof input === 'string') return new Date(input).getTime()
  if (input instanceof Date) return input.getTime()
  if (input?.seconds) return input.seconds * 1000
  return 0
}

function overlap(aStart, aEnd, bStart, bEnd) {
  const s1 = toMillis(aStart)
  const e1 = toMillis(aEnd)
  const s2 = toMillis(bStart)
  const e2 = toMillis(bEnd)
  return Math.max(s1, s2) < Math.min(e1, e2)
}

export const useBookingsStore = defineStore('bookings', {
  state: () => ({
    items: [], // { id, title, start, end, userId, userName, createdAt }
    ready: false,
    unsub: null
  }),
  actions: {
    startListening() {
      if (this.unsub) return
      const db = getFirestoreDb()
      if (!db) return // fallback to local-only calendar page behavior
      const q = query(collection(db, 'bookings'), orderBy('start'))
      this.unsub = onSnapshot(q, (snap) => {
        this.items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        this.ready = true
      })
    },
    stopListening() {
      if (this.unsub) {
        this.unsub()
        this.unsub = null
      }
    },
    async fetchOnce(params = {}) {
      const db = getFirestoreDb()
      if (!db) return []
      const { start, end } = params
      const col = collection(db, 'bookings')
      let q = query(col, orderBy('start'))
      // optional naive client-side filter; Firestore compound range could be added if needed
      const snap = await getDocs(q)
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      return all.filter(b => {
        if (!start && !end) return true
        return overlap(b.start, b.end, start, end)
      })
    },
    async create({ title, start, end }) {
      const db = getFirestoreDb()
      const auth = useAuthStore()
      const user = auth.currentUser
      if (!user) throw new Error('Not authenticated')
      if (!db) throw new Error('Database is not configured')
      const startMs = toMillis(start)
      const endMs = toMillis(end)
      if (!title || !startMs || !endMs || endMs <= startMs) throw new Error('Invalid booking payload')
      // conflict check (read-then-write). For stronger guarantees, use a transaction.
      const conflicts = await this.fetchOnce({ start, end })
      if (conflicts.length > 0) {
        throw new Error('该时间段已被占用，无法预订')
      }
      const payload = {
        title: String(title),
        start: new Date(startMs).toISOString(),
        end: new Date(endMs).toISOString(),
        userId: user.id,
        userName: user.name || 'User',
        createdAt: serverTimestamp()
      }
      const ref = await addDoc(collection(db, 'bookings'), payload)
      return ref.id
    },
    async remove(id) {
      const db = getFirestoreDb()
      const auth = useAuthStore()
      const user = auth.currentUser
      if (!user) throw new Error('Not authenticated')
      if (!db) throw new Error('Database is not configured')
      const target = this.items.find(b => b.id === id)
      if (!target) throw new Error('Booking not found')
      if (target.userId !== user.id) throw new Error('只能删除自己的预订')
      await deleteDoc(doc(db, 'bookings', id))
    }
  },
  getters: {
    hasConflict: (state) => (start, end) => {
      return state.items.some(b => overlap(b.start, b.end, start, end))
    }
  }
})


