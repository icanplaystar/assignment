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
