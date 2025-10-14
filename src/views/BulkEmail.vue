<script setup>
import { computed, reactive, ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const state = reactive({
  search: '',
  selectedIds: new Set(),
  subject: '',
  text: '',
})

const attachment = ref(null)
const sending = ref(false)
const status = ref('')

function onFile(e) { attachment.value = e.target.files?.[0] || null }

const allUsers = computed(() => auth.users || [])
const filteredUsers = computed(() => {
  const q = (state.search || '').toLowerCase().trim()
  if (!q) return allUsers.value
  return allUsers.value.filter(u =>
    u.name?.toLowerCase().includes(q) ||
    u.email?.toLowerCase().includes(q) ||
    u.role?.toLowerCase().includes(q)
  )
})

const allChecked = computed({
  get() { return filteredUsers.value.length > 0 && filteredUsers.value.every(u => state.selectedIds.has(u.id)) },
  set(val) {
    if (val) filteredUsers.value.forEach(u => state.selectedIds.add(u.id))
    else filteredUsers.value.forEach(u => state.selectedIds.delete(u.id))
  }
})

const selectedEmails = computed(() => {
  return allUsers.value.filter(u => state.selectedIds.has(u.id)).map(u => u.email).filter(Boolean)
})

async function toBase64(f) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(f)
  })
}

async function sendBulk() {
  status.value = ''
  const to = selectedEmails.value
  if (!to.length) { status.value = 'Please select at least one recipient.'; return }
  if (!state.subject || !state.text) { status.value = 'Subject and Text are required.'; return }
  sending.value = true
  try {
    const fnUrl = import.meta.env.VITE_FUNCTIONS_URL || 'https://us-central1-jiezhi-bd9f2.cloudfunctions.net/sendEmail'
    let attachmentBase64, filename
    if (attachment.value) {
      attachmentBase64 = await toBase64(attachment.value)
      filename = attachment.value.name
    }
    const res = await fetch(fnUrl, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject: state.subject, text: state.text, attachmentBase64, filename })
    })
    const data = await res.json().catch(() => ({}))
    status.value = res.ok && data?.ok ? `Sent to ${to.length} recipients.` : `Failed (${res.status}): ${data?.error || 'Unknown error'}`
  } catch (e) {
    status.value = e?.message || 'Network error'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="mb-3">Bulk Email</h1>

    <div class="row g-3">
      <div class="col-12 col-lg-6">
        <div class="card h-100">
          <div class="card-body">
            <h2 class="h5">1) Select recipients</h2>
            <div class="input-group mb-2">
              <span class="input-group-text">Search</span>
              <input class="form-control" v-model.trim="state.search" placeholder="Filter by name, email, role" aria-label="Filter users" />
            </div>
            <div class="table-responsive" style="max-height:400px; overflow:auto">
              <table class="table table-sm align-middle">
                <thead>
                  <tr>
                    <th scope="col"><input type="checkbox" :checked="allChecked" @change="allChecked = $event.target.checked" aria-label="Select all" /></th>
                    <th scope="col">Name</th>
                    <th scope="col">Email</th>
                    <th scope="col">Role</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="u in filteredUsers" :key="u.id">
                    <td><input type="checkbox" :checked="state.selectedIds.has(u.id)" @change="(e) => { e.target.checked ? state.selectedIds.add(u.id) : state.selectedIds.delete(u.id) }" :aria-label="`Select ${u.name}`" /></td>
                    <td>{{ u.name }}</td>
                    <td>{{ u.email }}</td>
                    <td><span class="badge" :class="u.role==='admin' ? 'text-bg-primary' : 'text-bg-secondary'">{{ u.role }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="small text-muted mt-1">Selected: {{ selectedEmails.length }}</div>
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-6">
        <div class="card h-100">
          <div class="card-body">
            <h2 class="h5">2) Compose</h2>
            <div class="mb-2">
              <label class="form-label" for="bulk-subject">Subject</label>
              <input id="bulk-subject" v-model.trim="state.subject" class="form-control" />
            </div>
            <div class="mb-2">
              <label class="form-label" for="bulk-text">Text</label>
              <textarea id="bulk-text" v-model.trim="state.text" class="form-control" rows="6"></textarea>
            </div>
            <div class="mb-2">
              <label class="form-label" for="bulk-file">Attachment (optional)</label>
              <input id="bulk-file" type="file" class="form-control" @change="onFile" />
            </div>
            <button class="btn btn-primary" :disabled="sending" @click="sendBulk" aria-label="Send bulk email">
              <span v-if="sending" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {{ sending ? 'Sending...' : 'Send to selected' }}
            </button>
            <div class="mt-3" aria-live="polite" role="status">{{ status }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>


