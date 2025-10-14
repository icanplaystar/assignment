<script setup>
</script>

<template>
  <div>
    <h1 class="mb-4">Programs</h1>
    <div class="row g-3">
      <div class="col-12 col-md-4">
        <div class="card h-100">
          <div class="card-body">
            <h2 class="card-title h5">Community Sessions</h2>
            <p class="card-text">Open play, equipment provided, welcoming for all levels.</p>
            <router-link class="btn btn-outline-primary" :to="{ name: 'programs-community' }">Learn more</router-link>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <div class="card h-100">
          <div class="card-body">
            <h2 class="card-title h5">Youth Pathways</h2>
            <p class="card-text">Coach-led small groups for skill and wellbeing.</p>
            <router-link class="btn btn-outline-primary" :to="{ name: 'programs-youth' }">Learn more</router-link>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <div class="card h-100">
          <div class="card-body">
            <h2 class="card-title h5">Women & Girls Nights</h2>
            <p class="card-text">Female-led, beginner-safe sessions.</p>
            <router-link class="btn btn-outline-primary" :to="{ name: 'programs-women' }">Learn more</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>


