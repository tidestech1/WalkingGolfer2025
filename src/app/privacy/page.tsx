import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Walking Golfer',
  description: 'Learn about how Walking Golfer protects and handles your personal information.',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-4xl font-bold text-[#0A3357] mb-6">
          Privacy Policy
        </h1>

        <div className="border-l-4 border-[#0A3357] pl-6 mb-12 bg-gray-50 p-6 rounded">
          <p className="text-gray-700 text-lg mb-2">
            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
          </p>
          <p className="text-gray-600">
            This Privacy Policy describes how Walking Golfer collects, uses, and protects your information.
          </p>
        </div>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-[#0A3357] mb-4 pb-2 border-b border-gray-300">
            Introduction
          </h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="mb-4">
                          Walking Golfer (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting
            your privacy. This Privacy Policy explains how we collect, use,
            disclose, and safeguard your information when you use our website
            at walkinggolfer.com and related services (collectively, the &quot;Service&quot;).
            </p>
            <p className="font-medium text-[#0A3357]">
              By using our Service, you agree to the collection and use of information
              in accordance with this Privacy Policy.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-[#0A3357] mb-4 pb-2 border-b border-gray-300">
            Information We Collect
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Personal Information You Provide</h3>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Account information (name, email address, password)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Profile information and preferences</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Golf course reviews, ratings, and comments</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Contact form submissions and support inquiries</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Newsletter subscription preferences</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Any other information you choose to provide</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Information We Collect Automatically</h3>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Device and browser information</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>IP address and general location data</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Website usage patterns and interactions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Cookies and similar tracking technologies</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Pages visited, time spent, and referral sources</span>
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Location Information</h3>
              <p>
                We may collect and process information about your general location
                to provide relevant golf course recommendations and improve our
                mapping features. We focus on golf courses within the United States.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-[#0A3357] mb-4 pb-2 border-b border-gray-300">
            How We Use Your Information
          </h2>
          <p className="mb-4">We use the information we collect to:</p>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>Provide, maintain, and improve our Service</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>Process and display your course reviews and ratings</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>Send you newsletters and promotional communications</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>Respond to your inquiries and provide customer support</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>Analyze usage patterns to enhance user experience</span>
              </li>
            </ul>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>Aggregate and analyze review data for business insights</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>Develop new features and services</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>Comply with legal obligations and protect our rights</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>Prevent fraudulent or unauthorized activity</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-[#0A3357] mb-4 pb-2 border-b border-gray-300">
            How We Share Your Information
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Public Information</h3>
              <p className="text-gray-700">
                Your golf course reviews, ratings, and profile information may be
                publicly displayed on our Service and associated with your name
                or username.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Service Providers</h3>
              <p className="mb-3 text-gray-700">
                We work with third-party service providers who help us operate
                our Service, including:
              </p>
              <ul className="grid md:grid-cols-2 gap-2 ml-4">
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Analytics providers (such as Google Analytics)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Email marketing services (such as Klaviyo)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Cloud hosting and database services</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Customer support tools</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border-l-4 border-[#0A3357] p-6 rounded">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Business Insights and Analytics</h3>
              <p className="text-gray-700">
                We may aggregate and anonymize user data, including review data,
                to create business insights and analytics. This aggregated,
                non-personally identifiable information may be shared with or
                sold to third parties for industry research, marketing, or
                business development purposes.
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-[#0A3357] p-6 rounded">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Marketing and Promotional Use</h3>
              <p className="text-gray-700">
                We may use your reviews, ratings, and other content for marketing,
                social media, and promotional purposes, including featuring them
                on our website, social media channels, and marketing materials.
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-[#0A3357] p-6 rounded">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Sponsors and Business Partners</h3>
              <p className="text-gray-700 mb-3">
                We work with sponsors and business partners who support our Service
                and share our commitment to the golf community. We may share aggregated,
                anonymized data and insights with our sponsors and partners to help them:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Better understand golf course preferences and trends</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Develop and market golf-related products and services</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Target their marketing to relevant golf audiences</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Support golf course improvements and walker-friendly initiatives</span>
                </li>
              </ul>
              <p className="text-gray-700 mt-3">
                This data sharing is limited to aggregated, non-personally identifiable
                information and helps support the continued development of our Service.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Legal Requirements</h3>
                <p className="text-gray-700">
                                  We may disclose your information if required by law, legal process,
                or to protect the rights, property, or safety of Walking Golfer,
                our users, or others.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Business Transfers</h3>
                <p className="text-gray-700">
                  In the event of a merger, acquisition, or sale of assets, your
                  information may be transferred as part of that transaction.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <section>
            <h2 className="text-2xl font-semibold text-[#0A3357] mb-4 pb-2 border-b border-gray-300">
              Cookies and Tracking Technologies
            </h2>
            <p className="text-gray-700">
              We use cookies and similar technologies to enhance your experience,
              analyze usage, and provide personalized content. You can control
              cookies through your browser settings, though some features may
              not function properly if cookies are disabled.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3357] mb-4 pb-2 border-b border-gray-300">
              Data Security
            </h2>
            <p className="text-gray-700">
              We implement appropriate technical and organizational security
              measures to protect your personal information. However, no method
              of transmission over the Internet or electronic storage is 100%
              secure. While we strive to protect your information, we cannot
              guarantee absolute security.
            </p>
          </section>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <section>
            <h2 className="text-2xl font-semibold text-[#0A3357] mb-4 pb-2 border-b border-gray-300">
              Data Retention
            </h2>
            <p className="text-gray-700">
              We retain your personal information for as long as necessary to
              provide our services, comply with legal obligations, resolve
              disputes, and enforce our agreements. Review data may be retained
              indefinitely as it contributes to the ongoing value of our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3357] mb-4 pb-2 border-b border-gray-300">
              Children's Privacy
            </h2>
            <p className="text-gray-700">
              Our Service is not intended for children under 18 years of age.
              We do not knowingly collect personal information from children
              under 18. If we become aware that we have collected personal
              information from a child under 18, we will take steps to delete
              such information.
            </p>
          </section>
        </div>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-[#0A3357] mb-4 pb-2 border-b border-gray-300">
            Your Rights and Choices
          </h2>
          <p className="mb-4">You have the right to:</p>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>Access and review your personal information</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>Correct inaccurate or incomplete information</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>Request deletion of your account and associated data</span>
              </li>
            </ul>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>Opt-out of marketing communications</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>Control cookie preferences through your browser</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>Request information about how your data is used</span>
              </li>
            </ul>
          </div>
          <div className="mt-6 bg-blue-50 border-l-4 border-[#0A3357] p-4 rounded">
            <p>
              <strong>To exercise these rights:</strong> Please contact us at privacy@walkinggolfer.com.
              Note that deleting your account may not remove publicly posted
              reviews, which may remain on our Service.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-[#0A3357] mb-4 pb-2 border-b border-gray-300">
            Changes to This Privacy Policy
          </h2>
          <p className="text-gray-700">
            We may update this Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page
            and updating the &quot;Last updated&quot; date. Your continued use of the
            Service after any changes constitutes acceptance of the updated
            Privacy Policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[#0A3357] mb-6 text-center">
            Contact Us
          </h2>
          <p className="text-center mb-6">
            If you have any questions about this Privacy Policy or our data
            practices, please contact us at:
          </p>
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg max-w-md mx-auto text-center">
            <h3 className="text-xl font-semibold text-[#0A3357] mb-4">Walking Golfer</h3>
            <div className="space-y-2 text-gray-700">
              <p>
                <strong>Email:</strong> <a href="mailto:privacy@walkinggolfer.com" className="text-[#0A3357] hover:underline">privacy@walkinggolfer.com</a>
              </p>
              <p>
                <strong>Address:</strong><br />
                11755 W Little York Rd, B-104<br />
                Houston, TX 77041
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
} 