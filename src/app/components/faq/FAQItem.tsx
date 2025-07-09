'use client'

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FAQItem as FAQItemType } from '@/types/faq';

interface FAQItemProps {
  item: FAQItemType;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export default function FAQItem({ item, isExpanded = false, onToggle }: FAQItemProps): JSX.Element {
  const [internalExpanded, setInternalExpanded] = useState(isExpanded);

  const handleToggle = (): void => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  const expanded = onToggle ? isExpanded : internalExpanded;

  return (
    <div className="border border-gray-200 rounded-lg shadow-sm">
      <button
        onClick={handleToggle}
        className="w-full px-6 py-4 text-left focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-inset transition-colors hover:bg-gray-50"
        aria-expanded={expanded}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#0A3357] pr-4">
            {item.question}
          </h3>
          <div className="flex-shrink-0">
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>
        </div>
      </button>
      
      {expanded && (
        <div className="px-6 pb-4 border-t border-gray-100">
          <div className="pt-4 text-gray-700 leading-relaxed">
            {item.answer}
          </div>
        </div>
      )}
    </div>
  );
} 