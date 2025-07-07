import { Mail, MapPin, HelpCircle, Building, Handshake } from 'lucide-react'
import { Metadata } from 'next'

import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact Us | Walking Golfer',
  description: 'Get in touch with the Walking Golfer team. We&apos;re here to help with any questions about getting the most out of the walking game in the USA.',
}

export default function ContactPage(): JSX.Element {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[#0A3357] mb-4">
            Contact Us
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Have questions about walkable golf courses, partnerships, or just want to say hello? We&apos;re here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-[#0A3357] border-b border-gray-200 pb-3 mb-8">
              Get in Touch
            </h2>
            
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="bg-[#0A3357] rounded-full p-2">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                  <a href="mailto:info@walkinggolfer.com" className="text-[#0A3357] hover:text-blue-700 font-medium transition-colors">
                    info@walkinggolfer.com
                  </a>
                  <p className="text-sm text-gray-500 mt-1">
                    We aim to respond within 24 business hours.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-[#0A3357] rounded-full p-2">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Location</h3>
                  <p className="text-gray-600 font-medium">United States</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Focusing on walkable golf courses across the USA.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6 mt-10">
              <div className="bg-[#0A3357] text-white rounded-lg p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <Handshake className="w-6 h-6 text-[#00FFFF] mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">
                      Looking to Partner?
                    </h3>
                    <p className="text-gray-100 text-sm leading-relaxed">
                      If you represent a golf course or organization interested in
                      promoting walking the course, please select 'Partnership Opportunity'
                      in the form subject. We&apos;d love to connect!
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#91FF87] bg-opacity-20 border border-[#91FF87] border-opacity-30 rounded-lg p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-6 h-6 text-green-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-[#0A3357] mb-2">
                      Need Support or Help?
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Have questions about using our platform or need assistance?
                      Our support resources and FAQ section will be available soon.
                      For immediate help, please contact us using the form.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#FF9A00] bg-opacity-15 border border-[#FF9A00] border-opacity-30 rounded-lg p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <Building className="w-6 h-6 text-[#FF9A00] mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-[#0A3357] mb-2">
                      Looking to Update Course and Club Details?
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Are you a course representative looking to update your
                      course information, photos, or details? We want to ensure
                      our information is accurate and up-to-date. Please get in
                      touch using the contact form.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-8">
            <div className="bg-white shadow-xl rounded-lg p-6 sm:p-8 border border-gray-100">
              <h2 className="text-2xl font-semibold text-[#0A3357] mb-6">
                Send Us a Message
              </h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
} 