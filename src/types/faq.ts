export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[]; // For search functionality
}

export interface FAQCategory {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  items: FAQItem[];
}

export interface FAQData {
  categories: FAQCategory[];
} 