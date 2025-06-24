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
        <h1 className="text-4xl font-bold text-[#0A3357] mb-6">
          Terms of Service
        </h1>

        <div className="border-l-4 border-[#0A3357] pl-6 mb-12 bg-gray-50 p-6 rounded">
          <p className="text-gray-700 text-lg mb-2">
            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
          </p>
          <p className="text-gray-600">
            Please read these Terms of Service carefully before using Walking Golfer.
          </p>
        </div>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-[#0A3357] mb-4 pb-2 border-b border-gray-300">
            1. Acceptance of Terms
          </h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="mb-4">
              By accessing or using the Walking Golfer website at walkinggolfer.com
              and related services (collectively, the &quot;Service&quot;), you agree to be
              bound by these Terms of Service (&quot;Terms&quot;). These Terms constitute
              a legally binding agreement between you and Walking Golfer
              (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;).
            </p>
            <p className="font-medium text-[#0A3357]">
              If you do not agree to these Terms, please do not use our Service.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-[#0A3357] mb-4 pb-2 border-b border-gray-300">
            2. Description of Service
          </h2>
          <div className="bg-blue-50 border-l-4 border-[#0A3357] p-4 rounded">
            <p>
              Walking Golfer provides a platform for golf enthusiasts to discover,
              review, and rate golf courses, with a focus on courses within the
              United States. Our Service includes course information, user reviews,
              ratings, mapping features, and related golf content.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-[#0A3357] mb-4 pb-2 border-b border-gray-300">
            3. User Accounts and Eligibility
          </h2>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>You must be at least 18 years old to create an account</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>You must provide accurate and complete registration information</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>You are responsible for maintaining the security of your account</span>
              </li>
            </ul>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>You are responsible for all activities that occur under your account</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>You must notify us immediately of any unauthorized use of your account</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>We reserve the right to terminate accounts that violate these Terms</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-[#0A3357] mb-4 pb-2 border-b border-gray-300">
            4. User Content and Reviews
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Content Submission</h3>
              <p className="mb-3 text-gray-700">
                When you submit reviews, ratings, comments, photos, or other content
                (&quot;User Content&quot;) to our Service:
              </p>
              <ul className="grid md:grid-cols-2 gap-x-8 gap-y-2 ml-4">
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>You retain ownership of your User Content</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>You must ensure your content is accurate and truthful</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Content must be based on your personal experience</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>You must not submit inappropriate or harmful content</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border-l-4 border-[#0A3357] p-6 rounded">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">License to Use Your Content</h3>
              <p className="mb-4 text-gray-700">
                By submitting User Content to our Service, you grant Walking Golfer
                a worldwide, non-exclusive, royalty-free, sublicensable, and transferable
                license to use, reproduce, distribute, prepare derivative works of,
                display, and perform your User Content in connection with our Service
                and business operations, including but not limited to:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Displaying your content on our website and mobile applications</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Using your content for marketing, promotional, and advertising purposes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Featuring your content on social media channels and marketing materials</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Aggregating and analyzing your content for business insights</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Sharing aggregated, anonymized data with third parties</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Providing data insights to sponsors and business partners</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Content Moderation</h3>
              <p className="mb-3 text-gray-700">We reserve the right, but not the obligation, to:</p>
              <ul className="grid md:grid-cols-2 gap-x-8 gap-y-2 ml-4">
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Review, monitor, and moderate User Content</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Remove or edit content that violates these Terms</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Remove content that we determine is inappropriate</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#0A3357] mr-2 mt-1">•</span>
                  <span>Suspend accounts that repeatedly violate guidelines</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <section>
            <h2 className="text-2xl font-semibold text-[#0A3357] mb-4 pb-2 border-b border-gray-300">
              5. Geographic Scope and Focus
            </h2>
            <p className="text-gray-700">
              Our Service primarily focuses on golf courses within the United States.
              While users from other countries may access our website, the information,
              features, and services are designed for U.S. locations and may not be
              available or suitable for users in other jurisdictions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3357] mb-4 pb-2 border-b border-gray-300">
              7. Intellectual Property Rights
            </h2>
            <p className="text-gray-700">
              The Walking Golfer name, logo, website design, content, and software
              are owned by Walking Golfer and protected by intellectual property
              laws. You may not use these materials without our express written
              permission, except as necessary for your personal, non-commercial
              use of the Service.
            </p>
          </section>
        </div>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-[#0A3357] mb-4 pb-2 border-b border-gray-300">
            6. Prohibited Uses
          </h2>
          <p className="mb-4">You agree not to:</p>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>Use the Service for any unlawful purpose</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>Submit false, misleading, or fraudulent information</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>Impersonate any person or entity</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>Harass, abuse, or harm other users</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>Attempt to gain unauthorized access to our systems</span>
              </li>
            </ul>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>Use automated systems (bots, scrapers) without permission</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>Interfere with the proper functioning of the Service</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>Submit content that infringes on intellectual property rights</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>Engage in any form of spam or unsolicited communications</span>
              </li>
            </ul>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <section>
            <h2 className="text-2xl font-semibold text-[#0A3357] mb-4 pb-2 border-b border-gray-300">
              8. Third-Party Services and Links
            </h2>
            <p className="text-gray-700">
              Our Service may contain links to third-party websites or integrate
              with third-party services. We are not responsible for the content,
              privacy practices, or terms of service of these third parties.
              Your use of third-party services is subject to their respective
              terms and conditions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3357] mb-4 pb-2 border-b border-gray-300">
              9. Sponsors and Business Partners
            </h2>
            <p className="text-gray-700 mb-3">
              Our Service is supported by sponsors and business partners who share
              our commitment to improving the golf experience for walking golfers.
              By using our Service, you acknowledge and agree that:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>We may share aggregated data insights with our sponsors</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>Sponsors may use this data to improve golf-related products and services</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>This partnership helps support the continued operation of our Service</span>
              </li>
            </ul>
          </section>
        </div>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-[#0A3357] mb-4 pb-2 border-b border-gray-300">
            10. Data and Analytics
          </h2>
          <p className="text-gray-700">
            We may collect, aggregate, and analyze data from your use of the
            Service to improve our offerings, conduct research, and develop
            business insights. This may include sharing aggregated, anonymized
            data with third parties for industry research and business
            development purposes, including with our sponsors and business
            partners to help advance the golf industry and walking golf initiatives.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-[#0A3357] mb-4 pb-2 border-b border-gray-300">
            11. Disclaimers and Limitation of Warranties
          </h2>
          <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded">
            <p className="mb-4 text-gray-700">
              Our Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties
              of any kind, either express or implied. We specifically disclaim:
            </p>
            <ul className="grid md:grid-cols-2 gap-x-8 gap-y-2 ml-4 mb-4">
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>The accuracy or completeness of course information</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>The reliability of user reviews and ratings</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>The availability or uninterrupted operation of the Service</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0A3357] mr-2 mt-1">•</span>
                <span>The security of data transmission or storage</span>
              </li>
            </ul>
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded">
              <p className="font-medium text-gray-800">
                Golf course information, hours, pricing, and policies may change
                without notice. We recommend contacting courses directly to verify
                current information before visiting.
              </p>
            </div>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <section>
            <h2 className="text-2xl font-semibold text-[#0A3357] mb-4 pb-2 border-b border-gray-300">
              12. Limitation of Liability
            </h2>
            <p className="mb-4 text-gray-700">
              To the maximum extent permitted by law, Walking Golfer shall
              not be liable for any indirect, incidental, special, consequential,
              or punitive damages, including but not limited to loss of profits,
              data, or goodwill, arising from your use of the Service.
            </p>
            <p className="font-medium text-gray-800">
              Our total liability to you for any claims arising from these Terms
              or your use of the Service shall not exceed the amount you paid
              us, if any, in the twelve (12) months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3357] mb-4 pb-2 border-b border-gray-300">
              13. Indemnification
            </h2>
            <p className="text-gray-700">
              You agree to indemnify, defend, and hold harmless Walking Golfer,
              its officers, directors, employees, and agents from any claims,
              damages, or expenses (including reasonable attorneys&apos; fees) arising
              from your use of the Service, your User Content, or your violation
              of these Terms.
            </p>
          </section>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <section>
            <h2 className="text-2xl font-semibold text-[#0A3357] mb-4 pb-2 border-b border-gray-300">
              14. Termination
            </h2>
            <p className="text-gray-700">
              We may terminate or suspend your account and access to the Service
              at any time, with or without cause or notice, including for violation
              of these Terms. Upon termination, your right to use the Service will
              cease, but these Terms will remain in effect regarding your prior
              use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3357] mb-4 pb-2 border-b border-gray-300">
              15. Changes to Terms
            </h2>
            <p className="text-gray-700">
              We reserve the right to modify these Terms at any time. We will
              notify you of material changes by posting the updated Terms on
              our website and updating the &quot;Last updated&quot; date. Your continued
              use of the Service after changes become effective constitutes
              acceptance of the modified Terms.
            </p>
          </section>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <section>
            <h2 className="text-2xl font-semibold text-[#0A3357] mb-4 pb-2 border-b border-gray-300">
              16. Governing Law and Jurisdiction
            </h2>
            <p className="text-gray-700">
              These Terms are governed by the laws of the State of Texas, without
              regard to conflict of law principles. Any disputes arising from
              these Terms or your use of the Service shall be resolved in the
              courts located in Harris County, Texas.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0A3357] mb-4 pb-2 border-b border-gray-300">
              17. Severability
            </h2>
            <p className="text-gray-700">
              If any provision of these Terms is found to be unenforceable or
              invalid, the remaining provisions will remain in full force and
              effect, and the unenforceable provision will be replaced with
              an enforceable provision that most closely reflects our intent.
            </p>
          </section>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[#0A3357] mb-6 text-center">
            18. Contact Information
          </h2>
          <p className="text-center mb-6">
            For questions about these Terms of Service, please contact us at:
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
  );
}
