import { defineStore } from 'pinia'
import { getFirestoreDb } from '../firebase'
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  getDocs
} from 'firebase/firestore'
import { useAuthStore } from './auth'

const HEARTBEAT_MS = 30000 // 30s
const ONLINE_WINDOW_MS = 2 * 60 * 1000 // 2 minutes

export const usePresenceStore = defineStore('presence', {
  state: () => ({
    heartbeatTimer: null,
    listeningUnsub: null,
    people: [] // list of presence docs
  }),
  getters: {
    onlineCount: (state) => {
      const now = Date.now()
      return state.people.filter(p => {
        const ts = typeof p.lastActive === 'number' ? p.lastActive : (p.lastActive?.toMillis?.() || 0)
        return now - ts <= ONLINE_WINDOW_MS
      }).length
    }
  },
  actions: {
    async startForCurrentUser() {
      const auth = useAuthStore()
      const user = auth.currentUser
      const db = getFirestoreDb()
      if (!db || !user) return
      const ref = doc(collection(db, 'presence'), user.id)
      await setDoc(ref, { userId: user.id, name: user.name || 'User', lastActive: serverTimestamp() }, { merge: true })
      this._startHeartbeat(ref)
    },
    stopForCurrentUser() {
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer)
        this.heartbeatTimer = null
      }
    },
    _startHeartbeat(ref) {
      if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
      const tick = async () => {
        try { await updateDoc(ref, { lastActive: serverTimestamp() }) } catch {}
      }
      this.heartbeatTimer = setInterval(tick, HEARTBEAT_MS)
      tick()
      // Best-effort last update when tab is hidden/closed
      const onVis = () => {
        if (document.visibilityState === 'hidden') tick()
      }
      document.addEventListener('visibilitychange', onVis)
    },
    startListening() {
      const db = getFirestoreDb()
      if (!db || this.listeningUnsub) return
      const col = collection(db, 'presence')
      this.listeningUnsub = onSnapshot(col, (snap) => {
        this.people = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      })
    },
    stopListening() {
      if (this.listeningUnsub) { this.listeningUnsub(); this.listeningUnsub = null }
      this.people = []
    }
  }
})


