<script setup>
import { reactive, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const form = reactive({ name: '', email: '', password: '', role: 'user' })
const errors = reactive({ name: '', email: '', password: '', general: '' })
const submitting = ref(false)

function validate() {
  errors.name = ''
  errors.email = ''
  errors.password = ''
  errors.general = ''
  if (!form.name) errors.name = 'Name is required'
  if (!form.email) errors.email = 'Email is required'
  else if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email'
  if (!form.password) errors.password = 'Password is required'
  else if (String(form.password).length < 6) errors.password = 'Password must be at least 6 characters'
  return !errors.name && !errors.email && !errors.password
}

async function submit() {
  if (!validate()) return
  submitting.value = true
  try {
    await auth.register({ name: form.name, email: form.email, password: form.password, role: form.role })
    router.push({ name: 'home' })
  } catch (e) {
    errors.general = e?.message || 'Registration failed'
  } finally {
    submitting.value = false
  }
}

async function signupWithGoogle() {
  errors.general = ''
  submitting.value = true
  try {
    await auth.loginWithGoogle()
    router.push({ name: 'home' })
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
          <h1 class="mb-4">Register</h1>
          <div class="card shadow-sm rounded-3">
            <div class="card-body p-4">
              <div v-if="errors.general" class="alert alert-danger">{{ errors.general }}</div>
              <div class="mb-4">
                <label class="form-label">Name</label>
                <input v-model.trim="form.name" type="text" class="form-control form-control-lg" />
                <div v-if="errors.name" class="text-danger small">{{ errors.name }}</div>
              </div>
              <div class="mb-4">
                <label class="form-label">Email</label>
                <input v-model.trim="form.email" type="email" class="form-control form-control-lg" placeholder="you@example.com" />
                <div v-if="errors.email" class="text-danger small">{{ errors.email }}</div>
              </div>
              <div class="mb-4">
                <label class="form-label">Password</label>
                <input v-model.trim="form.password" type="password" class="form-control form-control-lg" />
                <div v-if="errors.password" class="text-danger small">{{ errors.password }}</div>
              </div>
              <div class="mb-5">
                <label class="form-label">Role</label>
                <select v-model="form.role" class="form-select form-select-lg">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button class="btn btn-success w-100 mb-3 py-2 fw-semibold" :disabled="submitting" @click="submit">Create account</button>
              <button class="btn btn-outline-secondary w-100 py-2 fw-semibold" :disabled="submitting" @click="signupWithGoogle">
                Sign up with Google
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


