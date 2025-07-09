'use client'

import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface FAQSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function FAQSearch({ onSearch, placeholder = "Search frequently asked questions..." }: FAQSearchProps): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const clearSearch = (): void => {
    setSearchQuery('');
    onSearch('');
  };

  return (
    <div className="relative max-w-2xl mx-auto mb-8">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
} 