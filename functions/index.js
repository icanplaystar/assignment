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

admin.initializeApp()

const SMTP_HOST = defineSecret('SMTP_HOST')
const SMTP_PORT = defineSecret('SMTP_PORT')
const SMTP_USER = defineSecret('SMTP_USER')
const SMTP_PASS = defineSecret('SMTP_PASS')
const SMTP_FROM = defineSecret('SMTP_FROM')

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
