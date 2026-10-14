'use client'

import { useState, type ChangeEvent, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Send } from 'lucide-react'

const topics = ['Buying a truck', 'Selling my truck', 'Becoming a channel partner', 'Something else']

const emptyForm = { name: '', phone: '', email: '', topic: '', message: '' }

type FormField = keyof typeof emptyForm

export default function ContactForm() {
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const handleChange =
    (field: FormField) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          subject: form.topic || undefined,
          message: form.message.trim(),
        }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(data?.error || 'Could not send your inquiry. Please try again.')
        return
      }

      toast.success("Thanks, we've received your inquiry.")
      setForm(emptyForm)
    } catch {
      toast.error('Network error. Please try again, or call us directly.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="ct-form">
      <h2 className="ct-subhead">Send an inquiry</h2>
      <p className="ct-intro">Tell us what you need and we will get back to you.</p>

      <form className="ct-form-grid" onSubmit={handleSubmit}>
        <div className="ct-form-row">
          <div className="ct-field">
            <label htmlFor="ct-name">Full name</label>
            <input
              id="ct-name"
              type="text"
              autoComplete="name"
              minLength={2}
              maxLength={100}
              required
              value={form.name}
              onChange={handleChange('name')}
            />
          </div>

          <div className="ct-field">
            <label htmlFor="ct-phone">Phone</label>
            <input
              id="ct-phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              pattern="[0-9+ \-]{10,16}"
              title="Enter a valid phone number"
              required
              value={form.phone}
              onChange={handleChange('phone')}
            />
          </div>
        </div>

        <div className="ct-form-row">
          <div className="ct-field">
            <label htmlFor="ct-email">Email</label>
            <input
              id="ct-email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange('email')}
            />
          </div>

          <div className="ct-field">
            <label htmlFor="ct-topic">Topic</label>
            <select id="ct-topic" value={form.topic} onChange={handleChange('topic')}>
              <option value="">Select a topic</option>
              {topics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="ct-field">
          <label htmlFor="ct-message">Message</label>
          <textarea
            id="ct-message"
            minLength={10}
            maxLength={2000}
            required
            value={form.message}
            onChange={handleChange('message')}
          />
        </div>

        <button type="submit" className="ct-submit" disabled={submitting}>
          {submitting ? 'Sending...' : 'Send Inquiry'}
          {!submitting && <Send size={18} aria-hidden="true" />}
        </button>
      </form>
    </div>
  )
}
