import { defineStore } from 'pinia'
import { getFirebaseAuth } from '../firebase'
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

const USERS_KEY = 'app_users'
const SESSION_KEY = 'app_session'

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

export const useAuthStore = defineStore('auth', {
  state: () => ({
    users: readJson(USERS_KEY, []),
    session: readJson(SESSION_KEY, null),
    firebaseReady: false
  }),
  getters: {
    currentUser(state) {
      if (state.session?.provider === 'firebase') {
        return state.session.user || null
      }
      if (!state.session) return null
      return state.users.find(u => u.id === state.session.userId) || null
    },
    isAuthenticated() {
      return !!this.currentUser
    },
    currentUserRole() {
      return this.currentUser?.role || 'guest'
    }
  },
  actions: {
    initAuthListener() {
      const auth = getFirebaseAuth()
      if (!auth || this.firebaseReady) return
      this.firebaseReady = true
      onAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
          const role = fbUser.email?.endsWith('@admin.local') ? 'admin' : 'user'
          this.session = { provider: 'firebase', user: { id: fbUser.uid, name: fbUser.displayName || fbUser.email || 'User', email: fbUser.email || '', role } }
        } else if (this.session?.provider === 'firebase') {
          this.session = null
        }
        this.save()
      })
    },
    save() {
      writeJson(USERS_KEY, this.users)
      writeJson(SESSION_KEY, this.session)
    },
    register({ name, email, password, role }) {
      const auth = getFirebaseAuth()
      const emailTrimmed = String(email || '').trim().toLowerCase()
      const nameTrimmed = String(name || '').trim()
      if (!nameTrimmed) throw new Error('Name is required')
      if (!emailTrimmed || !/^\S+@\S+\.\S+$/.test(emailTrimmed)) throw new Error('Valid email is required')
      if (!password || String(password).length < 6) throw new Error('Password must be at least 6 characters')
      if (auth) {
        return createUserWithEmailAndPassword(auth, emailTrimmed, String(password))
          .then(async ({ user }) => {
            try { await updateProfile(user, { displayName: nameTrimmed }) } catch {}
            const roleFinal = role === 'admin' ? 'admin' : 'user'
            this.session = { provider: 'firebase', user: { id: user.uid, name: nameTrimmed || (user.email || 'User'), email: user.email || '', role: roleFinal } }
            this.save()
          })
      }
      if (this.users.some(u => u.email === emailTrimmed)) throw new Error('Email already registered')
      const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
      const newUser = { id, name: nameTrimmed, email: emailTrimmed, password: String(password), role: role === 'admin' ? 'admin' : 'user' }
      this.users.push(newUser)
      this.session = { userId: id }
      this.save()
    },
    login({ email, password, roleHint }) {
      const auth = getFirebaseAuth()
      const emailTrimmed = String(email || '').trim().toLowerCase()
      if (auth) {
        return signInWithEmailAndPassword(auth, emailTrimmed, String(password))
          .then(({ user }) => {
            let role = user.email?.endsWith('@admin.local') ? 'admin' : 'user'
            if (roleHint === 'admin' || roleHint === 'user') role = roleHint
            this.session = { provider: 'firebase', user: { id: user.uid, name: user.displayName || user.email || 'User', email: user.email || '', role } }
            this.save()
          })
      }
      const user = this.users.find(u => u.email === emailTrimmed && u.password === String(password))
      if (!user) throw new Error('Invalid email or password')
      this.session = { userId: user.id }
      this.save()
    },
    logout() {
      const auth = getFirebaseAuth()
      if (auth && this.session?.provider === 'firebase') {
        return signOut(auth).finally(() => {
          this.session = null
          this.save()
        })
      }
      this.session = null
      this.save()
    },
    async loginWithGoogle() {
      const auth = getFirebaseAuth()
      if (!auth) throw new Error('Firebase is not configured')
      const provider = new GoogleAuthProvider()
      const { user } = await signInWithPopup(auth, provider)
      const role = user.email?.endsWith('@admin.local') ? 'admin' : 'user'
      this.session = { provider: 'firebase', user: { id: user.uid, name: user.displayName || user.email || 'User', email: user.email || '', role } }
      this.save()
    }
  }
})


