<script setup>
import { computed } from 'vue'
import { useDataStore } from '../stores/data'
import { useAuthStore } from '../stores/auth'
import Rating from '../components/Rating.vue'

const dataStore = useDataStore()
const auth = useAuthStore()

const items = computed(() => dataStore.items)
const canRate = computed(() => auth.isAuthenticated)

function onRate(itemId, value) {
  if (!canRate.value) return
  dataStore.setRating(itemId, auth.currentUser?.id, value)
}
</script>

<template>
  <div>
    <h1 class="mb-4">Items</h1>
    <div class="row g-3">
      <div v-for="item in items" :key="item.id" class="col-12 col-md-6 col-lg-4">
        <div class="card h-100">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">{{ item.name }}</h5>
            <p class="card-text">{{ item.description }}</p>
            <div class="mt-auto">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <strong>Average:</strong> {{ dataStore.getAverage(item.id).toFixed(2) }} / 5
                </div>
              </div>
              <div class="mt-2">
                <Rating
                  :value="dataStore.getUserRating(item.id, auth.currentUser?.id)"
                  :readonly="!canRate"
                  @update:value="val => onRate(item.id, val)"
                />
                <div v-if="!canRate" class="form-text">Login to rate.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>


