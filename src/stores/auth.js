import { defineStore } from 'pinia'
import { getFirebaseAuth } from '../firebase'
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { GoogleAuthProvider, GithubAuthProvider, signInWithPopup, fetchSignInMethodsForEmail, linkWithCredential, EmailAuthProvider } from 'firebase/auth'

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
      try {
        const { user } = await signInWithPopup(auth, provider)
        const role = user.email?.endsWith('@admin.local') ? 'admin' : 'user'
        this.session = { provider: 'firebase', user: { id: user.uid, name: user.displayName || user.email || 'User', email: user.email || '', role } }
        this.save()
      } catch (e) {
        // Handle account-exists-with-different-credential by linking
        if (e?.code === 'auth/account-exists-with-different-credential') {
          const email = e?.customData?.email || e?.email || ''
          const pendingCred = GoogleAuthProvider.credentialFromError?.(e)
          if (!email || !pendingCred) throw e
          const methods = await fetchSignInMethodsForEmail(auth, email)
          if (methods.includes('github.com')) {
            const { user } = await signInWithPopup(auth, new GithubAuthProvider())
            await linkWithCredential(user, pendingCred)
            const role = user.email?.endsWith('@admin.local') ? 'admin' : 'user'
            this.session = { provider: 'firebase', user: { id: user.uid, name: user.displayName || user.email || 'User', email: user.email || '', role } }
            this.save()
            return
          }
          if (methods.includes('password')) {
            throw new Error('This email already has a password account. Please sign in with email/password first, then link Google in Profile.')
          }
          throw e
        }
        throw e
      }
    },
    async loginWithGithub() {
      const auth = getFirebaseAuth()
      if (!auth) throw new Error('Firebase is not configured')
      const provider = new GithubAuthProvider()
      try {
        const { user } = await signInWithPopup(auth, provider)
        const role = user.email?.endsWith('@admin.local') ? 'admin' : 'user'
        this.session = { provider: 'firebase', user: { id: user.uid, name: user.displayName || user.email || 'User', email: user.email || '', role } }
        this.save()
      } catch (e) {
        console.log('GitHub login error:', e)
        if (e?.code === 'auth/account-exists-with-different-credential') {
          const email = e?.customData?.email || e?.email || ''
          console.log('Account exists with different credential for email:', email)
          
          // Get existing sign-in methods for this email
          const methods = await fetchSignInMethodsForEmail(auth, email)
          console.log('Existing methods:', methods)
          
          // If methods array is empty, provide a generic message
          if (!methods || methods.length === 0) {
            throw new Error(`This email (${email}) is already registered with a different account. Please try signing in with Google, or use a different email address for GitHub login.`)
          }
          
          if (methods.includes('google.com')) {
            // User has Google account, ask them to sign in with Google first
            throw new Error(`This email is already registered with Google. Please sign in with Google first, then you can link your GitHub account in your profile.`)
          }
          
          if (methods.includes('password')) {
            // User has password account, ask them to sign in with email/password first
            throw new Error(`This email is already registered with email/password. Please sign in with your email and password first, then you can link your GitHub account in your profile.`)
          }
          
          // If we get here, there's some other provider conflict
          console.log('Available methods:', methods)
          const providerNames = {
            'google.com': 'Google',
            'password': 'Email/Password',
            'facebook.com': 'Facebook',
            'github.com': 'GitHub',
            'email': 'Email/Password'
          }
          
          // Find the first known provider
          const knownProvider = methods.find(method => providerNames[method])
          const existingProvider = knownProvider ? providerNames[knownProvider] : (methods[0] || 'Unknown')
          
          throw new Error(`This email is already registered with ${existingProvider}. Please sign in with ${existingProvider} first, then you can link your GitHub account in your profile.`)
        }
        throw e
      }
    },
    async updateCurrentUser({ name }) {
      if (!this.currentUser) throw new Error('Not authenticated')
      const nameTrimmed = String(name || '').trim()
      if (!nameTrimmed) throw new Error('Name is required')
      // Firebase-backed session: update displayName via Firebase, then mirror to session
      if (this.session?.provider === 'firebase') {
        const auth = getFirebaseAuth()
        const fbUser = auth?.currentUser || null
        if (!fbUser) throw new Error('No Firebase user')
        try {
          await updateProfile(fbUser, { displayName: nameTrimmed })
        } catch (e) {
          // surface concise message
          throw new Error(e?.message || 'Failed to update profile')
        }
        this.session = {
          ...this.session,
          user: { ...this.session.user, name: nameTrimmed }
        }
        this.save()
        return
      }
      // Local session: update in users array
      const current = this.currentUser
      const idx = this.users.findIndex(u => u.id === current.id)
      if (idx === -1) throw new Error('User not found')
      this.users[idx] = { ...this.users[idx], name: nameTrimmed }
      this.save()
    }
  }
})


