import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Walking Golfer',
  description: 'Learn about how Walking Golfer protects and handles your personal information.',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-4xl font-bold text-[#0A3357] mb-8">
          Privacy Policy
        </h1>

        <p className="text-gray-600 mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2>Introduction</h2>
          <p>
            The Walking Golfer (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting
            your privacy. This Privacy Policy explains how we collect, use,
            disclose, and safeguard your information when you use our website
            and services.
          </p>
        </section>

        <section className="mb-8">
          <h2>Information We Collect</h2>
          <h3>Personal Information</h3>
          <ul>
            <li>Name and contact information</li>
            <li>Account credentials</li>
            <li>Profile information</li>
            <li>Course reviews and ratings</li>
            <li>Communication preferences</li>
          </ul>

          <h3>Usage Information</h3>
          <ul>
            <li>Browser and device information</li>
            <li>IP address and location data</li>
            <li>Website activity and interactions</li>
            <li>Cookies and similar technologies</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2>How We Use Your Information</h2>
          <ul>
            <li>Provide and improve our services</li>
            <li>Process and display your course reviews</li>
            <li>Communicate with you about our services</li>
            <li>Send newsletters and marketing communications</li>
            <li>Analyze website usage and trends</li>
            <li>Protect against fraudulent or unauthorized activity</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2>Information Sharing</h2>
          <p>
            We may share your information with:
          </p>
          <ul>
            <li>Service providers and partners</li>
            <li>Other users (for public reviews and profiles)</li>
            <li>Legal authorities when required by law</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2>Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to
            protect your personal information. However, no method of transmission
            over the Internet is 100% secure.
          </p>
        </section>

        <section className="mb-8">
          <h2>Your Rights</h2>
          <p>
            You have the right to:
          </p>
          <ul>
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Opt-out of marketing communications</li>
            <li>Update your preferences</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2>Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or our practices,
            please contact us at:
          </p>
          <p>
            Email: privacy@walkinggolfer.com<br />
            Address: [Your Address]<br />
            Phone: +1 (555) 123-4567
          </p>
        </section>
      </div>
    </main>
  )
} 