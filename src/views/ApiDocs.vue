<template>
  <div class="container mt-4">
    <div class="row">
      <div class="col-12">
        <h1 class="mb-4">API Documentation</h1>
        <p class="lead">Access our platform data through REST API endpoints</p>
        
        <!-- API Overview -->
        <div class="card mb-4">
          <div class="card-header">
            <h3>Available Endpoints</h3>
          </div>
          <div class="card-body">
            <p>We provide two main REST API endpoints for third-party integration:</p>
            <ul>
              <li><strong>Events API</strong> - Fetch upcoming events and registration data</li>
              <li><strong>Bookings API</strong> - Access calendar booking information</li>
            </ul>
            <div class="alert alert-info">
              <strong>Base URL:</strong> <code>https://us-central1-jiezhi-bd9f2.cloudfunctions.net</code><br>
              <small class="text-muted">Note: The base URL itself is not accessible, but the individual function endpoints below are working.</small>
            </div>
          </div>
        </div>

        <!-- Events API -->
        <div class="card mb-4">
          <div class="card-header bg-primary text-white">
            <h4>📅 Events API</h4>
          </div>
          <div class="card-body">
            <h5>Endpoint</h5>
            <div class="bg-light p-3 mb-3">
              <code>GET /apiEventsUpcoming</code>
            </div>
            
            <h5>Description</h5>
            <p>Retrieve upcoming events with registration counts and capacity information.</p>
            
            <h5>Parameters</h5>
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Type</th>
                  <th>Required</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>start</code></td>
                  <td>string</td>
                  <td>No</td>
                  <td>Start date (YYYY-MM-DD format)</td>
                </tr>
                <tr>
                  <td><code>end</code></td>
                  <td>string</td>
                  <td>No</td>
                  <td>End date (YYYY-MM-DD format)</td>
                </tr>
                <tr>
                  <td><code>limit</code></td>
                  <td>number</td>
                  <td>No</td>
                  <td>Maximum number of events to return (1-200, default: 50)</td>
                </tr>
              </tbody>
            </table>
            
            <h5>Example Request</h5>
            <div class="bg-dark text-light p-3 mb-3">
              <pre><code>GET https://us-central1-jiezhi-bd9f2.cloudfunctions.net/apiEventsUpcoming?start=2025-10-18&end=2025-10-31&limit=5</code></pre>
            </div>
            
            <h5>Example Response</h5>
            <div class="bg-dark text-light p-3 mb-3">
              <pre><code>{
  "items": [
    {
      "id": "e1",
      "name": "Coach GA Private Coaching",
      "start": "2025-10-18T18:00:00.000Z",
      "end": "2025-10-18T20:00:00.000Z",
      "capacity": 1,
      "location": "Melbourne CBD",
      "registrationsCount": 1
    }
  ],
  "nextPageToken": null
}</code></pre>
            </div>
            
            <button class="btn btn-primary" @click="testEventsApi">Test Events API</button>
          </div>
        </div>

        <!-- Bookings API -->
        <div class="card mb-4">
          <div class="card-header bg-success text-white">
            <h4>📋 Bookings API</h4>
          </div>
          <div class="card-body">
            <h5>Endpoint</h5>
            <div class="bg-light p-3 mb-3">
              <code>GET /apiCalendarBookings</code>
            </div>
            
            <h5>Description</h5>
            <p>Retrieve calendar booking information with user details.</p>
            
            <h5>Parameters</h5>
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Type</th>
                  <th>Required</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>start</code></td>
                  <td>string</td>
                  <td>No</td>
                  <td>Start date (YYYY-MM-DD format)</td>
                </tr>
                <tr>
                  <td><code>end</code></td>
                  <td>string</td>
                  <td>No</td>
                  <td>End date (YYYY-MM-DD format)</td>
                </tr>
                <tr>
                  <td><code>userId</code></td>
                  <td>string</td>
                  <td>No</td>
                  <td>Filter bookings by specific user ID</td>
                </tr>
                <tr>
                  <td><code>limit</code></td>
                  <td>number</td>
                  <td>No</td>
                  <td>Maximum number of bookings to return (1-200, default: 50)</td>
                </tr>
              </tbody>
            </table>
            
            <h5>Example Request</h5>
            <div class="bg-dark text-light p-3 mb-3">
              <pre><code>GET https://us-central1-jiezhi-bd9f2.cloudfunctions.net/apiCalendarBookings?start=2025-10-18&end=2025-10-25&limit=10</code></pre>
            </div>
            
            <h5>Example Response</h5>
            <div class="bg-dark text-light p-3 mb-3">
              <pre><code>{
  "items": [
    {
      "id": "booking123",
      "title": "Personal Training Session",
      "start": "2025-10-20T10:00:00.000Z",
      "end": "2025-10-20T11:00:00.000Z",
      "userId": "user456",
      "userName": "John Doe"
    }
  ]
}</code></pre>
            </div>
            
            <button class="btn btn-success" @click="testBookingsApi">Test Bookings API</button>
          </div>
        </div>

        <!-- Test Results -->
        <div v-if="testResult" class="card mb-4">
          <div class="card-header">
            <h5>Test Results</h5>
          </div>
          <div class="card-body">
            <div class="bg-light p-3">
              <pre><code>{{ testResult }}</code></pre>
            </div>
            <button class="btn btn-secondary btn-sm mt-2" @click="testResult = null">Clear</button>
          </div>
        </div>

        <!-- Quick Access Links -->
        <div class="card mb-4">
          <div class="card-header bg-info text-white">
            <h4>🔗 Quick Access Links</h4>
          </div>
          <div class="card-body">
            <p>Click these links to directly access the API endpoints in your browser:</p>
            
            <h5>📅 Events API Links</h5>
            <div class="row mb-3">
              <div class="col-md-6">
                <div class="d-grid gap-2">
                  <a href="https://us-central1-jiezhi-bd9f2.cloudfunctions.net/apiEventsUpcoming" 
                     target="_blank" class="btn btn-outline-primary">
                    All Events
                  </a>
                  <a href="https://us-central1-jiezhi-bd9f2.cloudfunctions.net/apiEventsUpcoming?limit=3" 
                     target="_blank" class="btn btn-outline-primary">
                    First 3 Events
                  </a>
                  <a href="https://us-central1-jiezhi-bd9f2.cloudfunctions.net/apiEventsUpcoming?limit=5" 
                     target="_blank" class="btn btn-outline-primary">
                    First 5 Events
                  </a>
                </div>
              </div>
              <div class="col-md-6">
                <div class="d-grid gap-2">
                  <a href="https://us-central1-jiezhi-bd9f2.cloudfunctions.net/apiEventsUpcoming?start=2025-10-18&end=2025-10-25" 
                     target="_blank" class="btn btn-outline-primary">
                    Oct 18-25 Events
                  </a>
                  <a href="https://us-central1-jiezhi-bd9f2.cloudfunctions.net/apiEventsUpcoming?start=2025-10-20&end=2025-10-22" 
                     target="_blank" class="btn btn-outline-primary">
                    Oct 20-22 Events
                  </a>
                </div>
              </div>
            </div>

            <h5>📋 Bookings API Links</h5>
            <div class="row mb-3">
              <div class="col-md-6">
                <div class="d-grid gap-2">
                  <a href="https://us-central1-jiezhi-bd9f2.cloudfunctions.net/apiCalendarBookings" 
                     target="_blank" class="btn btn-outline-success">
                    All Bookings
                  </a>
                  <a href="https://us-central1-jiezhi-bd9f2.cloudfunctions.net/apiCalendarBookings?limit=10" 
                     target="_blank" class="btn btn-outline-success">
                    First 10 Bookings
                  </a>
                </div>
              </div>
              <div class="col-md-6">
                <div class="d-grid gap-2">
                  <a href="https://us-central1-jiezhi-bd9f2.cloudfunctions.net/apiCalendarBookings?start=2025-10-18&end=2025-10-25" 
                     target="_blank" class="btn btn-outline-success">
                    Oct 18-25 Bookings
                  </a>
                  <a href="https://us-central1-jiezhi-bd9f2.cloudfunctions.net/apiCalendarBookings?start=2025-10-20&end=2025-10-22" 
                     target="_blank" class="btn btn-outline-success">
                    Oct 20-22 Bookings
                  </a>
                </div>
              </div>
            </div>

            <div class="alert alert-info">
              <strong>💡 Tip:</strong> These links will open in a new tab and show the raw JSON data. Perfect for testing and integration!
            </div>
          </div>
        </div>

        <!-- Integration Examples -->
        <div class="card mb-4">
          <div class="card-header">
            <h4>Integration Examples</h4>
          </div>
          <div class="card-body">
            <h5>JavaScript/Fetch</h5>
            <div class="bg-dark text-light p-3 mb-3">
              <pre><code>// Fetch upcoming events
fetch('https://us-central1-jiezhi-bd9f2.cloudfunctions.net/apiEventsUpcoming?limit=5')
  .then(response => response.json())
  .then(data => console.log(data.items));

// Fetch bookings
fetch('https://us-central1-jiezhi-bd9f2.cloudfunctions.net/apiCalendarBookings?start=2025-10-18&end=2025-10-25')
  .then(response => response.json())
  .then(data => console.log(data.items));</code></pre>
            </div>
            
            <h5>cURL</h5>
            <div class="bg-dark text-light p-3 mb-3">
              <pre><code># Test events API
curl "https://us-central1-jiezhi-bd9f2.cloudfunctions.net/apiEventsUpcoming?limit=3"

# Test bookings API
curl "https://us-central1-jiezhi-bd9f2.cloudfunctions.net/apiCalendarBookings?start=2025-10-18&end=2025-10-25"</code></pre>
            </div>
          </div>
        </div>

        <!-- Rate Limits & Terms -->
        <div class="card">
          <div class="card-header">
            <h4>Rate Limits & Terms</h4>
          </div>
          <div class="card-body">
            <ul>
              <li><strong>Rate Limit:</strong> 100 requests per minute per IP</li>
              <li><strong>Data Format:</strong> JSON only</li>
              <li><strong>Authentication:</strong> Currently no API key required (public access)</li>
              <li><strong>Usage:</strong> Please use responsibly and respect our server resources</li>
              <li><strong>Support:</strong> For questions or issues, contact us through our Contact page</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const testResult = ref(null)

const testEventsApi = async () => {
  try {
    const response = await fetch('https://us-central1-jiezhi-bd9f2.cloudfunctions.net/apiEventsUpcoming?limit=3')
    const data = await response.json()
    testResult.value = JSON.stringify(data, null, 2)
  } catch (error) {
    testResult.value = `Error: ${error.message}`
  }
}

const testBookingsApi = async () => {
  try {
    const response = await fetch('https://us-central1-jiezhi-bd9f2.cloudfunctions.net/apiCalendarBookings?start=2025-10-18&end=2025-10-25')
    const data = await response.json()
    testResult.value = JSON.stringify(data, null, 2)
  } catch (error) {
    testResult.value = `Error: ${error.message}`
  }
}
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.card-header h4 {
  margin: 0;
}

.table th {
  border-top: none;
}
</style>
