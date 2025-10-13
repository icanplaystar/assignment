<script setup>
import DOMPurify from 'dompurify'

const props = defineProps({ html: { type: String, default: '' } })
</script>

<template>
  <div v-html="DOMPurify.sanitize(props.html)"></div>
</template>

<style scoped>
</style>


