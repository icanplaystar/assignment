<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, default: 0 },
  readonly: { type: Boolean, default: false }
})
const emit = defineEmits(['update:value'])

const displayValue = computed(() => Math.round(Math.max(0, Math.min(5, Number(props.value) || 0))))

function set(val) {
  if (props.readonly) return
  emit('update:value', val)
}
</script>

<template>
  <div class="rating" role="radiogroup" aria-label="Rating">
    <button
      v-for="n in 5"
      :key="n"
      class="btn btn-sm me-1"
      :class="n <= displayValue ? 'btn-warning' : 'btn-outline-secondary'"
      :aria-checked="n === displayValue"
      role="radio"
      @click="set(n)"
      :disabled="readonly"
    >
      ★
    </button>
  </div>
  
</template>

<style scoped>
.rating button {
  width: 2rem;
}
</style>


