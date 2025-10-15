import { defineStore } from 'pinia'
import { getFirestoreDb } from '../firebase'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where
} from 'firebase/firestore'
import { useAuthStore } from './auth'

export const useEventRegistrationsStore = defineStore('eventRegistrations', {
  state: () => ({
    myRegs: [], // [{ id, eventId, userId, userName, createdAt }]
    counts: {}, // { [eventId]: number }
    unsub: null,
    listeningUserId: null,
    unsubAll: null
  }),
  actions: {
    startListening(userId) {
      const uid = userId || useAuthStore().currentUser?.id
      if (!uid) return
      if (this.unsub && this.listeningUserId === uid) return
      if (this.unsub) { this.unsub(); this.unsub = null }
      const db = getFirestoreDb()
      if (!db) return
      const q = query(collection(db, 'event_registrations'), where('userId', '==', uid))
      this.unsub = onSnapshot(q, (snap) => {
        this.myRegs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        this.listeningUserId = uid
      })
      // Global listener for counts
      if (!this.unsubAll) {
        this.unsubAll = onSnapshot(collection(db, 'event_registrations'), (snap) => {
          const map = {}
          for (const d of snap.docs) {
            const ev = d.data()?.eventId
            if (!ev) continue
            map[ev] = (map[ev] || 0) + 1
          }
          this.counts = map
        })
      }
    },
    stopListening() {
      if (this.unsub) { this.unsub(); this.unsub = null }
      if (this.unsubAll) { this.unsubAll(); this.unsubAll = null }
      this.listeningUserId = null
      this.myRegs = []
      this.counts = {}
    },
    async rsvp(eventId, eventName) {
      const auth = useAuthStore()
      const user = auth.currentUser
      if (!user) throw new Error('Not authenticated')
      const db = getFirestoreDb()
      if (!db) throw new Error('Database is not configured')
      const q = query(collection(db, 'event_registrations'), where('userId', '==', user.id), where('eventId', '==', eventId))
      const snap = await getDocs(q)
      if (!snap.empty) throw new Error('You have already joined this event')
      await addDoc(collection(db, 'event_registrations'), {
        eventId,
        eventName: String(eventName || ''),
        userId: user.id,
        userName: user.name || 'User',
        createdAt: serverTimestamp()
      })
    },
    async cancel(eventId) {
      const auth = useAuthStore()
      const user = auth.currentUser
      if (!user) throw new Error('Not authenticated')
      const db = getFirestoreDb()
      if (!db) throw new Error('Database is not configured')
      const found = this.myRegs.find(r => r.eventId === eventId)
      if (!found) throw new Error('Registration not found')
      await deleteDoc(doc(db, 'event_registrations', found.id))
    }
  },
  getters: {
    hasRsvped: (state) => (eventId) => {
      return state.myRegs.some(r => r.eventId === eventId)
    },
    getCount: (state) => (eventId) => {
      return state.counts[eventId] || 0
    }
  }
})


