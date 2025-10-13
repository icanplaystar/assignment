<script setup>
import { reactive, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRoute, useRouter } from 'vue-router'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const form = reactive({ email: '', password: '' })
const errors = reactive({ email: '', password: '', general: '' })
const submitting = ref(false)

function validate() {
  errors.email = ''
  errors.password = ''
  errors.general = ''
  if (!form.email) errors.email = 'Email is required'
  else if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email'
  if (!form.password) errors.password = 'Password is required'
  else if (String(form.password).length < 6) errors.password = 'Password must be at least 6 characters'
  return !errors.email && !errors.password
}

async function submit() {
  if (!validate()) return
  submitting.value = true
  try {
    auth.login({ email: form.email, password: form.password })
    const redirect = route.query.redirect || { name: 'home' }
    router.push(redirect)
  } catch (e) {
    errors.general = e?.message || 'Login failed'
  } finally {
    submitting.value = false
  }
}

async function loginWithGoogle() {
  errors.general = ''
  submitting.value = true
  try {
    await auth.loginWithGoogle()
    const redirect = route.query.redirect || { name: 'home' }
    router.push(redirect)
  } catch (e) {
    errors.general = e?.message || 'Google sign-in failed'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="container-fluid px-0">
    <div class="row g-0 min-vh-100">
      <div class="col-12 d-flex align-items-center justify-content-center p-3">
        <div class="w-100">
          <h1 class="mb-4">Login</h1>
          <div class="card shadow-sm rounded-3">
            <div class="card-body p-4">
              <div v-if="errors.general" class="alert alert-danger">{{ errors.general }}</div>
          <div class="mb-4">
            <label class="form-label" for="login-email">Email</label>
            <input id="login-email" v-model.trim="form.email" type="email" class="form-control form-control-lg" placeholder="you@example.com" autocomplete="username" />
                <div v-if="errors.email" class="text-danger small">{{ errors.email }}</div>
              </div>
              <div class="mb-4">
            <label class="form-label" for="login-password">Password</label>
            <input id="login-password" v-model.trim="form.password" type="password" class="form-control form-control-lg" autocomplete="current-password" />
                <div v-if="errors.password" class="text-danger small">{{ errors.password }}</div>
              </div>
          <button class="btn btn-primary btn-lg w-100 mb-3 py-3 fw-semibold" :disabled="submitting" @click="submit" type="submit">Login</button>
              <button class="btn btn-outline-secondary btn-lg w-100 py-3 fw-semibold" :disabled="submitting" @click="loginWithGoogle">
                Sign in with Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
</template>

<style scoped>
.auth-hero {
  background: linear-gradient(135deg, #0d6efd 0%, #6610f2 100%);
  min-height: 100%;
}
</style>


