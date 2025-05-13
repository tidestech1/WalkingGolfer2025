'use client'

import { useState } from 'react'

import { addDocument } from '@/lib/firebase/firebaseUtils'
import type { ContactFormData } from '@/types/contact'
import { trackContactSubmissionEvent } from './actions'

export default function ContactForm(): JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    const form = e.currentTarget

    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)
    
    try {
      const formData = new FormData(form)

      // Honeypot check
      const honeypotValue = formData.get('website_url') as string;
      if (honeypotValue) {
        console.log('Honeypot field filled, likely spam. Silently ignoring.');
        // Optionally, still set success to true to deceive basic bots
        // setSubmitSuccess(true); 
        // form.reset();
        // setIsSubmitting(false); // Ensure submission state is reset
        return; // Exit early
      }

      const name = formData.get('name') as string
      const email = formData.get('email') as string
      const subject = formData.get('subject') as string
      const message = formData.get('message') as string

      if (!name || !email || !subject || !message) {
        throw new Error("Please fill out all required fields.")
      }

      const contactData: ContactFormData = {
        name,
        email,
        subject,
        message,
        createdAt: new Date().toISOString(),
        status: 'new'
      }

      await addDocument('contacts', contactData)

      // Track Klaviyo event using server action
      try {
        const klaviyoTrackResult = await trackContactSubmissionEvent({
          email: contactData.email,
          name: contactData.name,
          subject: contactData.subject,
          message: contactData.message,
          submittedAt: contactData.createdAt
        });

        if (klaviyoTrackResult.success) {
          console.log('Klaviyo event tracking initiated successfully via server action.');
        } else {
          console.error('Klaviyo event tracking failed via server action:', klaviyoTrackResult.message);
          // Optionally, inform the user or set a specific error state if critical
        }
      } catch (klaviyoError) {
        console.error('Error calling trackContactSubmissionEvent server action:', klaviyoError);
        // Decide if you want to setSubmitError here or just log it
      }

      setSubmitSuccess(true)
      form.reset()
    } catch (error) {
      console.error('Error submitting contact form:', error)
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit form. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={(e) => {
 void handleSubmit(e); 
}} className="space-y-6">
      {submitSuccess && (
        <div role="alert" className="p-4 rounded-md bg-green-50 border border-green-200 text-green-800">
          <p>Thank you for your message! We'll get back to you soon.</p>
        </div>
      )}

      {submitError && (
        <div role="alert" className="p-4 rounded-md bg-red-50 border border-red-200 text-red-800">
          <p className="font-medium">Error:</p>
          <p>{submitError}</p>
        </div>
      )}

      <div style={{ position: 'absolute', left: '-5000px' }} aria-hidden="true">
        <input 
          type="text" 
          id="website_url" 
          name="website_url" 
          tabIndex={-1} 
          autoComplete="off" 
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          aria-required="true"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          aria-required="true"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
          Subject <span className="text-red-500">*</span>
        </label>
        <select
          id="subject"
          name="subject"
          required
          aria-required="true"
          defaultValue=""
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md sm:text-sm"
        >
          <option value="" disabled>Select a subject</option>
          <option value="general">General Inquiry</option>
          <option value="course">Course Information</option>
          <option value="partnership">Partnership Opportunity</option>
          <option value="support">Support</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          aria-required="true"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="How can we help you?"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#0A3357] text-white py-3 px-4 rounded-md shadow-sm hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  )
} 