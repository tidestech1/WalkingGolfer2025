'use client'

import { useState } from 'react';
import { faqData } from '@/lib/data/faqData';
import FAQSearch from './FAQSearch';
import FAQCategory from './FAQCategory';

export default function FAQ(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const handleSearch = (query: string): void => {
    setSearchQuery(query);
    // Clear expanded items when searching
    if (query !== '') {
      setExpandedItems([]);
    }
  };

  const handleItemToggle = (itemId: string): void => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Filter categories based on search
  const filteredCategories = faqData.categories.filter(category => {
    if (!searchQuery) return true;
    
    return category.items.some(item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="max-w-4xl mx-auto">
      <FAQSearch onSearch={handleSearch} />
      
      {searchQuery && (
        <div className="mb-6 text-center">
          <p className="text-gray-600">
            {filteredCategories.length > 0 
              ? `Found results for "${searchQuery}"`
              : `No results found for "${searchQuery}"`
            }
          </p>
        </div>
      )}

      <div className="space-y-8">
        {filteredCategories.map((category) => (
          <FAQCategory
            key={category.id}
            category={category}
            searchQuery={searchQuery}
            expandedItems={expandedItems}
            onItemToggle={handleItemToggle}
          />
        ))}
      </div>

      {filteredCategories.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">
            No questions found matching your search.
          </p>
          <p className="text-gray-400">
            Try using different keywords or browse our categories above.
          </p>
        </div>
      )}
    </div>
  );
} 