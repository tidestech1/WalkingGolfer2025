import { Metadata } from 'next';
import { HelpCircle, Mail } from 'lucide-react';
import FAQ from '@/app/components/faq/FAQ';

export const metadata: Metadata = {
  title: 'FAQ | Walking Golfer',
  description: 'Frequently asked questions about Walking Golfer - your guide to finding and reviewing walkable golf courses across the USA.',
};

export default function FAQPage(): JSX.Element {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[#0A3357] mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to common questions about using Walking Golfer, understanding our ratings, 
            and making the most of your walking golf experience.
          </p>
        </div>

        <FAQ />

        {/* Still need help section */}
        <div className="mt-16 bg-gradient-to-r from-[#0A3357] to-blue-800 rounded-lg p-8 text-center">
          <HelpCircle className="w-12 h-12 text-[#00FFFF] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">
            Still need help?
          </h2>
          <p className="text-gray-100 mb-6 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is here to help. 
            Get in touch and we'll get back to you as soon as possible.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 bg-[#00FFFF] text-[#0A3357] px-6 py-3 rounded-lg font-semibold hover:bg-cyan-300 transition-colors"
          >
            <Mail className="w-5 h-5" />
            Contact Support
          </a>
        </div>
      </div>
    </main>
  );
} 