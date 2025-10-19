/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// Minimal v2 style function with SendGrid integration
import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import admin from 'firebase-admin'
import nodemailer from 'nodemailer'
import { GoogleGenerativeAI } from '@google/generative-ai'

admin.initializeApp()

const SMTP_HOST = defineSecret('SMTP_HOST')
const SMTP_PORT = defineSecret('SMTP_PORT')
const SMTP_USER = defineSecret('SMTP_USER')
const SMTP_PASS = defineSecret('SMTP_PASS')
const SMTP_FROM = defineSecret('SMTP_FROM')
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY')
// No API key required for public endpoints
const GEMINI_MODEL = defineSecret('GEMINI_MODEL')

export const sendEmail = onRequest({ secrets: [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM], cors: true, region: 'us-central1' }, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { to, subject, text, html, attachmentBase64, filename } = req.body || {}
    const toList = Array.isArray(to) ? to : (to ? [to] : [])
    if (toList.length === 0 || !subject || (!text && !html)) return res.status(400).json({ error: 'Missing fields' })
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST.value(),
      port: Number(SMTP_PORT.value() || 587),
      secure: Number(SMTP_PORT.value() || 587) === 465,
      auth: { user: SMTP_USER.value(), pass: SMTP_PASS.value() }
    })
    const mail = {
      from: SMTP_FROM.value() || SMTP_USER.value(),
      to: toList.join(','),
      subject,
      text: text || undefined,
      html: html || undefined,
      attachments: attachmentBase64 && filename ? [{ filename, content: Buffer.from(attachmentBase64, 'base64') }] : undefined
    }
    await transporter.sendMail(mail)
    return res.json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to send' })
  }
})

// GenAI endpoint: summarize or generate copy
export const genaiSuggest = onRequest({ secrets: [GEMINI_API_KEY, GEMINI_MODEL], cors: true, region: 'us-central1' }, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { prompt } = req.body || {}
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' })
    // Prefer Gemini 2.x (v1beta) via REST; fallback to 1.5/v1; finally SDK
    const apiKey = GEMINI_API_KEY.value()
    const configured = (GEMINI_MODEL.value && GEMINI_MODEL.value()) || ''
    const restModels = [
      configured,
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-2.0-flash',
      'gemini-2.0-pro',
      'gemini-1.5-pro-latest',
      'gemini-1.5-flash-latest'
    ].filter(Boolean)
    let text = ''
    let lastErr
    for (const m of restModels) {
      try {
        const apiVersion = m.startsWith('gemini-2') ? 'v1beta' : 'v1'
        const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${m}:generateContent?key=${apiKey}`
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] })
        })
        const data = await r.json()
        if (!r.ok) throw new Error(data?.error?.message || `HTTP ${r.status}`)
        text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || ''
        if (text) break
      } catch (e) {
        lastErr = e
      }
    }
    if (!text) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const modelName = configured || 'gemini-2.0-flash'
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent(prompt)
        text = result.response?.text?.() || ''
      } catch (e) {
        lastErr = e
      }
    }
    if (!text) throw lastErr || new Error('No text generated')
    return res.json({ ok: true, text })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'GenAI failed' })
  }
})

// ---------- Public API: Upcoming Events (read-only) ----------
// GET /api/events/upcoming?start=YYYY-MM-DD&end=YYYY-MM-DD&limit=50
export const apiEventsUpcoming = onRequest({ cors: true, region: 'us-central1' }, async (req, res) => {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    const { start, end, limit = 50 } = req.query || {}
    const startDate = start ? new Date(String(start)) : new Date()
    const endDate = end ? new Date(String(end)) : new Date(Date.now() + 30 * 86400000)
    const capLimit = Math.max(1, Math.min(200, Number(limit) || 50))

    const db = admin.firestore()
    const eventsCol = db.collection('events')
    let items = []
    try {
      const q = eventsCol
        .where('start', '>=', startDate.toISOString())
        .where('start', '<', endDate.toISOString())
        .orderBy('start')
        .limit(capLimit)
      const snap = await q.get()
      items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    } catch {
      items = []
    }

    // Fallback: synthesize demo events if no events in DB
    if (items.length === 0) {
      const venueNames = ['Melbourne CBD','Carlton','Richmond','Southbank','Docklands','Fitzroy','St Kilda']
      const year = new Date().getFullYear()
      const out = []
      for (let i = 0; i < Math.min(capLimit, venueNames.length); i++) {
        const day = Math.min(31, 18 + i)
        const date = new Date(year, 9, day).toISOString().slice(0,10)
        out.push({
          id: `e${i + 1}`,
          name: i === 0 ? 'Coach GA Private Coaching' : venueNames[i],
          start: `${date}T18:00:00.000Z`,
          end: `${date}T20:00:00.000Z`,
          capacity: i === 0 ? 1 : 12,
          location: venueNames[i]
        })
      }
      items = out
    }

    // registrationsCount per event (best-effort)
    const regsCol = db.collection('event_registrations')
    const withCounts = await Promise.all(items.map(async (ev) => {
      try {
        const qs = await regsCol.where('eventId', '==', ev.id).get()
        return { ...ev, registrationsCount: qs.size }
      } catch {
        return { ...ev, registrationsCount: 0 }
      }
    }))

    return res.json({ items: withCounts, nextPageToken: null })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to fetch upcoming events' })
  }
})

// ---------- Public API: Calendar Bookings (read-only) ----------
// GET /api/calendar/bookings?start=YYYY-MM-DD&end=YYYY-MM-DD&userId=...&limit=50
export const apiCalendarBookings = onRequest({ cors: true, region: 'us-central1' }, async (req, res) => {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    const { start, end, userId, limit = 50 } = req.query || {}
    const startISO = (start ? new Date(String(start)) : new Date()).toISOString()
    const endISO = (end ? new Date(String(end)) : new Date(Date.now() + 30 * 86400000)).toISOString()
    const capLimit = Math.max(1, Math.min(200, Number(limit) || 50))

    const db = admin.firestore()
    let q = db.collection('bookings')
      .where('start', '>=', startISO)
      .where('start', '<', endISO)
      .orderBy('start')
      .limit(capLimit)
    if (userId) q = q.where('userId', '==', String(userId))
    const snap = await q.get()
    const items = snap.docs.map(d => {
      const { title, start, end, userId, userName } = d.data()
      return { id: d.id, title, start, end, userId, userName }
    })
    return res.json({ items })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to fetch bookings' })
  }
})
