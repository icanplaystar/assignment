<script setup>
import { reactive, ref } from 'vue'

const form = reactive({ to: '', subject: '', text: '' })
const fnUrl = import.meta.env.VITE_FUNCTIONS_URL || 'https://us-central1-jiezhi-bd9f2.cloudfunctions.net/sendEmail'
const file = ref(null)
const status = ref('')
const sending = ref(false)

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
  const toList = form.to.split(',').map(s => s.trim()).filter(Boolean)
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
        <div class="mb-3">
          <label class="form-label" for="email-to">To</label>
          <input id="email-to" v-model.trim="form.to" type="text" class="form-control" placeholder="recipient1@example.com, recipient2@example.com" />
        </div>
        <div class="mb-3">
          <label class="form-label" for="email-subject">Subject</label>
          <input id="email-subject" v-model.trim="form.subject" type="text" class="form-control" />
        </div>
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


