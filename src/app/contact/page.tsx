import { Mail, MapPin, Phone } from 'lucide-react'
import { Metadata } from 'next'

import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact Us | Walking Golfer',
  description: 'Get in touch with the Walking Golfer team. We&apos;re here to help with any questions about walking golf in the USA.',
}

export default function ContactPage(): JSX.Element {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[#0A3357] mb-4">
            Contact Us
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Have questions about walking golf courses, partnerships, or just want to say hello? We&apos;re here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-[#0A3357] border-b pb-3 mb-6">
              Get in Touch
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900">Email</h3>
                  <a href="mailto:info@walkinggolfer.com" className="text-blue-600 hover:underline">info@walkinggolfer.com</a>
                  <p className="text-sm text-gray-500 mt-1">
                    We aim to respond within 24 business hours.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900">Location</h3>
                  <p className="text-gray-600">United States</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Focusing on walkable golf courses across the USA.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900">Phone</h3>
                  <p className="text-gray-600">+1 (555) 123-4567</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Mon-Fri from 9am to 5pm EST (Email preferred for faster response).
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-100">
              <h3 className="font-medium text-[#0A3357] mb-2">
                Looking to Partner?
              </h3>
              <p className="text-sm text-gray-700">
                If you represent a golf course or organization interested in
                promoting walking golf, please select 'Partnership Opportunity'
                in the form subject. We&apos;d love to connect!
              </p>
            </div>
          </div>

          <div className="bg-white shadow-xl rounded-lg p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-[#0A3357] mb-6">
              Send Us a Message
            </h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </main>
  )
} 