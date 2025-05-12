import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Walking Golfer",
  description:
    "Read our Terms of Service to understand the rules and guidelines for using the Walking Golfer website and services.",
};

export default function TermsPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-4xl font-bold text-[#0A3357] mb-8">
          Terms of Service
        </h1>

        <p className="text-gray-600 mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using The Walking Golfer website and services, you
            agree to be bound by these Terms of Service. If you do not agree to
            these terms, please do not use our services.
          </p>
        </section>

        <section className="mb-8">
          <h2>2. User Accounts</h2>
          <ul>
            <li>You must be at least 18 years old to create an account</li>
            <li>You are responsible for maintaining account security</li>
            <li>You agree to provide accurate and complete information</li>
            <li>
              We reserve the right to terminate accounts that violate our terms
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2>3. User Content</h2>
          <p>When you submit reviews, comments, or other content:</p>
          <ul>
            <li>You retain ownership of your content</li>
            <li>You grant us a license to use and display your content</li>
            <li>You agree not to submit inappropriate or harmful content</li>
            <li>We may remove content that violates our guidelines</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2>4. Geographic Restrictions</h2>
          <p>
            Our services focus on golf courses within the United States. While
            users from other countries may access our website, the information
            and features are primarily designed for U.S. locations.
          </p>
        </section>

        <section className="mb-8">
          <h2>5. Intellectual Property</h2>
          <p>
            The Walking Golfer name, logo, website design, and content are
            protected by intellectual property laws. You may not use these
            materials without our express permission.
          </p>
        </section>

        <section className="mb-8">
          <h2>6. Disclaimer of Warranties</h2>
          <p>
            Our services are provided &apos;as is&apos; without any warranties.
            We do not guarantee the accuracy of course information or user
            reviews.
          </p>
        </section>

        <section className="mb-8">
          <h2>7. Limitation of Liability</h2>
          <p>
            We are not liable for any damages arising from your use of our
            services or any content posted by users.
          </p>
        </section>

        <section className="mb-8">
          <h2>8. Changes to Terms</h2>
          <p>
            We may modify these terms at any time. Continued use of our services
            after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section className="mb-8">
          <h2>9. Contact Information</h2>
          <p>
            For questions about these Terms of Service, please contact us at:
          </p>
          <p>
            Email: legal@walkinggolfer.com
            <br />
            Address: [Your Address]
            <br />
            Phone: +1 (555) 123-4567
          </p>
        </section>
      </div>
    </main>
  );
}
