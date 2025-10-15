<script setup>
import { computed, reactive, ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const user = computed(() => auth.currentUser)

const editing = ref(false)
const form = reactive({ name: '' })
const saving = ref(false)
const error = ref('')
const success = ref('')

function startEdit() {
  error.value = ''
  success.value = ''
  form.name = user.value?.name || ''
  editing.value = true
}

function cancelEdit() {
  editing.value = false
  error.value = ''
  success.value = ''
}

async function save() {
  error.value = ''
  success.value = ''
  const nameTrimmed = String(form.name || '').trim()
  if (!nameTrimmed) {
    error.value = 'Name is required'
    return
  }
  saving.value = true
  try {
    await auth.updateCurrentUser({ name: nameTrimmed })
    success.value = 'Profile updated'
    editing.value = false
  } catch (e) {
    error.value = e?.message || 'Failed to update profile'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="mb-4">Your Profile</h1>
    <div class="card">
      <div class="card-body">
        <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
        <div v-if="success" class="alert alert-success" role="alert">{{ success }}</div>

        <template v-if="!editing">
          <p class="mb-1"><strong>Name:</strong> {{ user?.name }}</p>
          <p class="mb-1"><strong>Email:</strong> {{ user?.email }}</p>
          <p class="mb-3"><strong>Role:</strong> {{ user?.role }}</p>
          <button class="btn btn-primary" @click="startEdit">Edit</button>
        </template>

        <template v-else>
          <div class="mb-3">
            <label class="form-label" for="prof-name">Name</label>
            <input id="prof-name" v-model.trim="form.name" type="text" class="form-control" autocomplete="name" />
          </div>
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" :value="user?.email" disabled />
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-success" :disabled="saving" @click="save">Save</button>
            <button class="btn btn-outline-secondary" :disabled="saving" @click="cancelEdit">Cancel</button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>


