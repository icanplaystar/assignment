<script setup>
import { reactive, ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'

const form = reactive({ to: '', subject: '', text: '' })
const fnUrl = import.meta.env.VITE_FUNCTIONS_URL || 'https://us-central1-jiezhi-bd9f2.cloudfunctions.net/sendEmail'
const file = ref(null)
const status = ref('')
const sending = ref(false)
const genaiUrl = import.meta.env.VITE_GENAI_URL || 'https://us-central1-jiezhi-bd9f2.cloudfunctions.net/genaiSuggest'
const aiLoading = ref(false)

// Bulk selection from users
const auth = useAuthStore()
const selectState = reactive({ search: '', selectedIds: new Set() })
const allUsers = computed(() => auth.users || [])
const filteredUsers = computed(() => {
  const q = (selectState.search || '').toLowerCase().trim()
  if (!q) return allUsers.value
  return allUsers.value.filter(u =>
    u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q)
  )
})
const allChecked = computed({
  get() { return filteredUsers.value.length>0 && filteredUsers.value.every(u => selectState.selectedIds.has(u.id)) },
  set(val) { if (val) filteredUsers.value.forEach(u => selectState.selectedIds.add(u.id)); else filteredUsers.value.forEach(u => selectState.selectedIds.delete(u.id)) }
})
const extraRecipients = ref([]) // free-form added emails
const selectedEmails = computed(() => {
  const fromUsers = allUsers.value.filter(u => selectState.selectedIds.has(u.id)).map(u => u.email).filter(Boolean)
  return Array.from(new Set([...fromUsers, ...extraRecipients.value]))
})

const extraEmail = ref('')
function addExtraEmail() {
  const e = (extraEmail.value || '').trim().toLowerCase()
  if (!e) return
  const ok = /^\S+@\S+\.\S+$/.test(e)
  if (!ok) { status.value = 'Please enter a valid email to add.'; return }
  if (!extraRecipients.value.includes(e)) extraRecipients.value.push(e)
  extraEmail.value = ''
}
function removeExtraEmail(e) {
  extraRecipients.value = extraRecipients.value.filter(x => x !== e)
}

async function generateAI() {
  status.value = ''
  aiLoading.value = true
  try {
    const audienceCount = selectedEmails.value.length || (form.to.split(',').map(s=>s.trim()).filter(Boolean).length)
    const context = audienceCount ? `${audienceCount} recipients` : 'community members'
    const prompt = `You are an assistant helping a community table tennis charity write emails.
Write a concise, friendly subject and a short email body inviting ${context} to a ping‑pong session in Melbourne.
Tone: inclusive, positive, clear call to action (reply/RSVP).
Return exactly this format:
Subject: <one short line>
Body:
<4-6 short sentences>`
    const res = await fetch(genaiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) })
    const data = await res.json()
    if (!res.ok || !data?.text) throw new Error(data?.error || 'GenAI unavailable')
    const mSub = data.text.match(/Subject:\s*(.*)/i)
    const mBody = data.text.match(/Body:\s*([\s\S]*)/i)
    if (mSub) form.subject = mSub[1].trim()
    if (mBody) form.text = mBody[1].trim()
    if (!mSub && !mBody) {
      // fallback: put all into body
      form.text = data.text.trim();
      if (!form.subject) form.subject = 'Ping-Pong Invitation'
    }
  } catch (e) {
    status.value = e?.message || 'AI generation failed'
  } finally {
    aiLoading.value = false
  }
}

async function onFile(e) {
  const f = e.target.files?.[0]
  file.value = f || null
}

async function toBase64(f) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(f)
  })
}

async function send() {
  status.value = ''
  let attachmentBase64 = undefined
  let filename = undefined
  if (file.value) {
    attachmentBase64 = await toBase64(file.value)
    filename = file.value.name
  }
  const manualList = form.to.split(',').map(s => s.trim()).filter(Boolean)
  const toList = selectedEmails.value.length ? selectedEmails.value : manualList
  if (toList.length === 0 || !form.subject || !form.text) {
    status.value = 'Please fill To, Subject and Text.'
    return
  }
  sending.value = true
  try {
    const res = await fetch(fnUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: toList, subject: form.subject, text: form.text, attachmentBase64, filename })
    })
    const data = await res.json().catch(() => ({}))
    status.value = res.ok && data?.ok ? 'Email sent' : `Failed (${res.status}): ${data?.error || 'Unknown error'}`
  } catch (e) {
    status.value = e?.message || 'Network error'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="mb-4">Send Email</h1>
    <div class="card">
      <div class="card-body">
        <details class="mb-3">
          <summary class="mb-2">Select recipients from users (optional)</summary>
          <div class="input-group mb-2">
            <span class="input-group-text">Search</span>
            <input class="form-control" v-model.trim="selectState.search" placeholder="Filter by name/email/role" />
          </div>
          <div class="table-responsive" style="max-height:260px; overflow:auto">
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
                  <td><input type="checkbox" :checked="selectState.selectedIds.has(u.id)" @change="(e)=>{ e.target.checked ? selectState.selectedIds.add(u.id) : selectState.selectedIds.delete(u.id) }" :aria-label="`Select ${u.name}`" /></td>
                  <td>{{ u.name }}</td>
                  <td>{{ u.email }}</td>
                  <td><span class="badge" :class="u.role==='admin' ? 'text-bg-primary' : 'text-bg-secondary'">{{ u.role }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="d-flex align-items-center gap-2 flex-wrap mb-2">
            <div class="input-group" style="max-width:420px">
              <span class="input-group-text">Add email</span>
              <input class="form-control" v-model.trim="extraEmail" placeholder="someone@example.com" @keyup.enter="addExtraEmail" />
              <button class="btn btn-outline-secondary" @click="addExtraEmail">Add</button>
            </div>
            <span class="small text-muted">Selected: {{ selectedEmails.length }}</span>
          </div>
          <div class="mb-2" v-if="extraRecipients.length">
            <span class="badge text-bg-light border me-1" v-for="e in extraRecipients" :key="e">{{ e }}
              <button type="button" class="btn-close btn-close-sm ms-1" aria-label="Remove" @click="removeExtraEmail(e)"></button>
            </span>
          </div>
        </details>
        <div class="mb-3">
          <label class="form-label" for="email-to">To</label>
          <input id="email-to" v-model.trim="form.to" type="text" class="form-control" placeholder="recipient1@example.com, recipient2@example.com" />
        </div>
        <div class="mb-3 d-flex justify-content-between align-items-center">
          <label class="form-label" for="email-subject">Subject</label>
          <div class="d-flex align-items-center gap-2 ms-auto">
            <button class="btn btn-sm btn-outline-warning" type="button" @click="generateAI" :disabled="aiLoading" aria-label="Generate subject and body with AI">
              <span v-if="aiLoading" class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
              ✨ AI Suggest
            </button>
          </div>
        </div>
        <input id="email-subject" v-model.trim="form.subject" type="text" class="form-control mb-3" />
        <div class="mb-3">
          <label class="form-label" for="email-text">Text</label>
          <textarea id="email-text" v-model.trim="form.text" class="form-control" rows="4"></textarea>
        </div>
        <div class="mb-3">
          <label class="form-label">Attachment</label>
          <input type="file" class="form-control" @change="onFile" />
        </div>
        <button class="btn btn-primary" :disabled="sending" @click="send" aria-label="Send email">
          <span v-if="sending" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          {{ sending ? 'Sending...' : 'Send' }}
        </button>
        <div class="mt-3" aria-live="polite" role="status">{{ status }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>


