import { defineStore } from 'pinia'

const UI_KEY = 'app_ui'

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

export const useUiStore = defineStore('ui', {
  state: () => {
    const saved = readJson(UI_KEY, { fontSize: 'md', ttsEnabled: false })
    return {
      fontSize: saved.fontSize || 'md', // 'sm' | 'md' | 'lg'
      ttsEnabled: !!saved.ttsEnabled
    }
  },
  actions: {
    persist() {
      writeJson(UI_KEY, { fontSize: this.fontSize, ttsEnabled: this.ttsEnabled })
    },
    setFontSize(size) {
      if (!['sm','md','lg'].includes(size)) return
      this.fontSize = size
      this.persist()
      const root = document.documentElement
      const map = { sm: '14px', md: '16px', lg: '18px' }
      root.style.setProperty('--root-font-size', map[size] || '16px')
    },
    setTtsEnabled(enabled) {
      this.ttsEnabled = !!enabled
      this.persist()
    },
    toggleTts() {
      this.setTtsEnabled(!this.ttsEnabled)
    },
    apply() {
      this.setFontSize(this.fontSize || 'md')
      // ttsEnabled is applied by App-level listeners
    }
  }
})


