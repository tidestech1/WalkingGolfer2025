'use client'

import { useState } from 'react';
import * as Icons from 'lucide-react';
import { FAQCategory as FAQCategoryType } from '@/types/faq';
import FAQItem from './FAQItem';

interface FAQCategoryProps {
  category: FAQCategoryType;
  searchQuery?: string;
  expandedItems?: string[];
  onItemToggle?: (itemId: string) => void;
}

export default function FAQCategory({ 
  category, 
  searchQuery = '', 
  expandedItems = [], 
  onItemToggle 
}: FAQCategoryProps): JSX.Element {
  // Filter items based on search query
  const filteredItems = searchQuery 
    ? category.items.filter(item => 
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : category.items;

  // Don't render category if no items match search
  if (filteredItems.length === 0) {
    return <></>;
  }

  // Get the icon component dynamically
  const IconComponent = Icons[category.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;

  return (
    <div className="mb-12">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-[#0A3357] rounded-full p-2">
            <IconComponent className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#0A3357]">
            {category.name}
          </h2>
        </div>
        <p className="text-gray-600 ml-11">
          {category.description}
        </p>
      </div>

      <div className="space-y-4">
        {filteredItems.map((item) => (
          <FAQItem
            key={item.id}
            item={item}
            isExpanded={expandedItems.includes(item.id)}
            onToggle={onItemToggle ? () => onItemToggle(item.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
} 