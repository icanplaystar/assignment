<script setup>
import { ref } from 'vue'

const open = ref(false)
const prompt = ref('Write a friendly, concise email inviting community members to a table tennis session in Melbourne. Include date/time placeholder and a clear call to action.')
const loading = ref(false)
const result = ref('')
const error = ref('')
const genaiUrl = import.meta.env.VITE_GENAI_URL || 'https://us-central1-jiezhi-bd9f2.cloudfunctions.net/genaiSuggest'

async function run() {
  error.value = ''
  result.value = ''
  loading.value = true
  try {
    const res = await fetch(genaiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: prompt.value }) })
    const data = await res.json()
    if (!res.ok || !data?.text) throw new Error(data?.error || 'GenAI unavailable')
    result.value = data.text
  } catch (e) {
    error.value = e?.message || 'AI generation failed'
  } finally {
    loading.value = false
  }
}

async function copyText() {
  try { await navigator.clipboard.writeText(result.value || '') } catch {}
}
</script>

<template>
  <div>
    <!-- Floating AI button -->
    <button class="ai-fab btn btn-warning" @click="open = !open" aria-label="Open AI assistant">✨</button>

    <div v-if="open" class="ai-panel card shadow" role="dialog" aria-label="AI Assistant">
      <div class="card-body p-3">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <strong>AI Assistant</strong>
          <button class="btn-close" aria-label="Close" @click="open = false"></button>
        </div>
        <textarea class="form-control mb-2" rows="3" v-model="prompt" aria-label="Prompt"></textarea>
        <div class="d-flex gap-2 mb-2 flex-wrap">
          <button class="btn btn-sm btn-outline-secondary" @click="prompt='Write a friendly email invitation to a ping‑pong event with date/time and RSVP.'">Email invite</button>
          <button class="btn btn-sm btn-outline-secondary" @click="prompt='Write a short event description for a community table tennis session in Melbourne.'">Event description</button>
          <button class="btn btn-sm btn-outline-secondary" @click="prompt='Write a cheerful social post inviting people to try community ping‑pong.'">Social post</button>
        </div>
        <button class="btn btn-primary w-100 mb-2" :disabled="loading" @click="run">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
          {{ loading ? 'Generating...' : 'Generate' }}
        </button>
        <div v-if="error" class="alert alert-danger p-2">{{ error }}</div>
        <textarea v-model="result" class="form-control" rows="6" aria-label="AI result"></textarea>
        <div class="d-flex justify-content-end mt-2 gap-2">
          <button class="btn btn-outline-secondary" @click="copyText" aria-label="Copy result">Copy</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-fab {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  z-index: 2000;
}
.ai-panel {
  position: fixed;
  right: 20px;
  bottom: 78px;
  width: min(420px, 92vw);
  z-index: 2000;
}
</style>


